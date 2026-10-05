import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { gunzipSync, gzipSync } from "node:zlib";

await mkdir("public/data", { recursive: true });
await copyFile("in-system.db", "public/data/in-system.db");
await mkdir("public/dict", { recursive: true });

const sizes = {};
async function read(name) {
	return gunzipSync(
		await readFile(`node_modules/kuromoji/dict/${name}.dat.gz`),
	);
}
async function save(name, buffer) {
	sizes[name] = buffer.byteLength;
	await writeFile(`public/dict/${name}.bin`, gzipSync(buffer));
}
function trimStrings(buffer) {
	let end = buffer.length;
	while (end > 0 && buffer[end - 1] === 0) end--;
	return buffer.subarray(0, Math.min(end + 1, buffer.length));
}

// Preserve every entry; discard only unused capacity in Kuromoji's build buffers.
// Pre-index token maps as typed arrays, avoiding hundreds of thousands of JS arrays.
for (const prefix of ["tid", "unk"]) {
	const map = await read(`${prefix}_map`);
	const count = map.readInt32LE(0);
	let cursor = 4;
	let maxKey = 0;
	let maxToken = 0;
	const entries = [];
	for (let i = 0; i < count; i++) {
		const key = map.readInt32LE(cursor);
		const length = map.readInt32LE(cursor + 4);
		entries.push([key, cursor / 4 + 1]);
		maxKey = Math.max(maxKey, key);
		for (let j = 0; j < length; j++) {
			maxToken = Math.max(maxToken, map.readInt32LE(cursor + 8 + j * 4));
		}
		cursor += 8 + length * 4;
	}
	const offsets = Buffer.alloc((maxKey + 1) * 4);
	for (const [key, offset] of entries) offsets.writeUInt32LE(offset, key * 4);
	await save(`${prefix}_map`, map.subarray(0, cursor));
	await save(`${prefix}_offsets`, offsets);
	await save(prefix, (await read(prefix)).subarray(0, maxToken + 10));
	await save(`${prefix}_pos`, trimStrings(await read(`${prefix}_pos`)));
}
for (const name of ["base", "check", "cc", "unk_char", "unk_compat"]) {
	await save(name, await read(name));
}
await save("unk_invoke", trimStrings(await read("unk_invoke")));
await writeFile("public/dict/manifest.json", `${JSON.stringify(sizes)}\n`);
console.log(
	`SQLite copied unchanged; tokenizer buffers: ${(Object.values(sizes).reduce((a, b) => a + b, 0) / 1024 / 1024).toFixed(1)} MiB`,
);
