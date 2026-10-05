import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { after, before, test } from "node:test";
import kuromoji from "kuromoji";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:4174";
let server;
let serverOutput = "";
let tokenizer;
const db = new DatabaseSync("in-system.db", { readOnly: true });

before(async () => {
  if (!process.env.TEST_BASE_URL) {
    server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4174", "--strictPort"], { stdio: ["ignore", "pipe", "pipe"] });
    for (const stream of [server.stdout, server.stderr]) {
      stream.on("data", (data) => { serverOutput += data.toString(); });
    }
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw new Error(serverOutput);
      try {
        if ((await fetch(base)).ok) { ready = true; break; }
      } catch { /* Wait for workerd to start. */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, `Preview failed to start:\n${serverOutput}`);
  }
  tokenizer = await new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: "node_modules/kuromoji/dict" }).build((error, value) => error ? reject(error) : resolve(value));
  });
});
after(() => { server?.kill(); db.close(); });

async function search(text, mode = "rhyme", minLength = 3) {
  const response = await fetch(`${base}/api/${mode}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, minLength }),
  });
  assert.equal(response.status, 200, `${await response.clone().text()}\n${serverOutput.slice(-2500)}`);
  return response.json();
}
function originalSearch(vowels, mode, minLength) {
  const results = {};
  const used = new Set();
  // Reference implementation: original per-length queries against native SQLite.
  for (let length = vowels.length; length >= minLength; length--) {
    const pattern = mode === "rhyme" ? `%${vowels.slice(-length)}` : `${vowels.slice(0, length)}%`;
    const words = db.prepare("SELECT surface, yomi, vowels FROM words WHERE vowels LIKE ? AND vowels != ?").all(pattern, vowels);
    const unique = words.filter(({ surface }) => {
      if (used.has(surface)) return false;
      used.add(surface);
      return true;
    });
    if (unique.length) results[length] = unique;
  }
  return results;
}
function normalize(results) {
  return Object.fromEntries(Object.entries(results).map(([length, words]) => [length,
    words.map(({ surface, yomi, vowels }) => JSON.stringify([surface, yomi, vowels])).sort(),
  ]));
}

test("SQLite deployment copy is byte-for-byte identical", async () => {
  assert.deepEqual(await readFile("in-system.db"), await readFile("dist/client/data/in-system.db"));
});

test("concurrent cold requests load SQLite and the dictionary successfully", async () => {
  const results = await Promise.all([search("チーム友達"), search("親友誇らしい", "alliteration")]);
  assert.equal(results[0].yomi, "チームトモダチ");
  assert.equal(results[0].vowels, "iiuooai");
  assert.ok(Object.keys(results[0].results).length > 0);
});

for (const mode of ["rhyme", "alliteration"]) {
  for (const [text, minLength] of [["チーム友達", 3], ["親友誇らしい", 3], ["東京", 2], ["あ", 3]]) {
    test(`${mode}: ${text} matches the original SQLite results (minLength=${minLength})`, async () => {
      const result = await search(text, mode, minLength);
      assert.deepEqual(normalize(result.results), normalize(originalSearch(result.vowels, mode, minLength)));
    });
  }
}

test("compact dictionary preserves original readings across token types", async () => {
  for (const text of ["すもももももももものうち", "東京特許許可局", "今日はいい天気です。", "コンピューター", "キャット、ミュージック", "ABC123", "𠮷野家😀", "カタカナとひらがな", "食べられなかった", "未登録語XYZ", "一二三四五六七八九十"]) {
    const yomi = tokenizer.tokenize(text).map((token) => token.reading && token.reading !== "*" ? token.reading : token.surface_form).join("");
    const result = await search(text, "rhyme", 200);
    assert.equal(result.yomi, yomi, text);
  }
});

test("invalid input, method and missing API responses", async () => {
  for (const body of [null, {}, { text: " " }, { text: 1 }, { text: "あ", minLength: 0 }, { text: "あ", minLength: 1.5 }, { text: "あ", minLength: "3" }, { text: "あ".repeat(201) }]) {
    const response = await fetch(`${base}/api/rhyme`, { method: "POST", body: JSON.stringify(body) });
    assert.equal(response.status, 400);
  }
  assert.equal((await fetch(`${base}/api/rhyme`, { method: "POST", body: "{" })).status, 400);
  assert.equal((await fetch(`${base}/api/rhyme`)).status, 405);
  assert.equal((await fetch(`${base}/api/missing`, { headers: { "Sec-Fetch-Mode": "navigate" } })).status, 404);
  assert.equal((await fetch(`${base}/data/in-system.db`)).status, 404);
  const html = await (await fetch(base)).text();
  assert.match(html, /韻システム/);
  assert.ok((await fetch(`${base}/favicon.ico`)).ok);
});

async function mcp(method, params) {
  const response = await fetch(`${base}/api/mcp`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  assert.equal(response.status, 200, await response.clone().text());
  return response.json();
}

test("MCP initialization, discovery and both search tools", async () => {
  const initialized = await mcp("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "migration-test", version: "1" } });
  assert.equal(initialized.result.serverInfo.name, "in-system");
  const listed = await mcp("tools/list", {});
  assert.deepEqual(listed.result.tools.map(({ name }) => name).sort(), ["alliteration_search", "rhyme_search"]);
  for (const mode of ["rhyme", "alliteration"]) {
    const called = await mcp("tools/call", { name: `${mode}_search`, arguments: { text: "東京" } });
    assert.ok(!called.result.isError, JSON.stringify(called));
    const data = JSON.parse(called.result.content[0].text);
    const rest = await search("東京", mode);
    assert.equal(data.yomi, rest.yomi);
    assert.deepEqual(normalize(data.results), normalize(rest.results));
  }
});
