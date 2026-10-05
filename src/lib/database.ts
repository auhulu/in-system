import type { Database } from "sql.js";
import initSqlJs from "sql.js/dist/sql-wasm-browser.js";
import sqliteWasm from "sql.js/dist/sql-wasm-browser.wasm?module";

let database: Database | undefined;
let initializing: Promise<Database> | undefined;

export async function getDatabase(assets: Fetcher): Promise<Database> {
	if (database) return database;
	initializing ??= (async () => {
		const SQL = await initSqlJs({
			instantiateWasm(imports, receiveInstance) {
				const instance = new WebAssembly.Instance(sqliteWasm, imports);
				receiveInstance(instance);
				return instance.exports;
			},
		});
		const response = await assets.fetch(
			"https://assets.internal/data/in-system.db",
		);
		if (!response.ok) throw new Error("SQLite database unavailable");
		const db = new SQL.Database(new Uint8Array(await response.arrayBuffer()));
		db.run("PRAGMA query_only = ON");
		database = db;
		return db;
	})().catch((error) => {
		initializing = undefined;
		throw error;
	});
	return initializing;
}

export interface WordEntry {
	surface: string;
	yomi: string;
	vowels: string;
}

// One SQLite scan finds all candidates. Group longest matches first, as before.
// This avoids scanning 236k rows once per character in the query.
export function searchInDatabase(
	db: Database,
	queryVowels: string,
	minLength: number,
	mode: "rhyme" | "alliteration",
): Record<number, WordEntry[]> {
	const results: Record<number, WordEntry[]> = {};
	if (queryVowels.length < minLength) return results;
	const pattern =
		mode === "rhyme"
			? `%${queryVowels.slice(-minLength)}`
			: `${queryVowels.slice(0, minLength)}%`;
	const statement = db.prepare(
		"SELECT surface, yomi, vowels FROM words WHERE vowels LIKE ? AND vowels != ?",
		[pattern, queryVowels],
	);
	const candidates: Record<number, WordEntry[]> = {};
	try {
		while (statement.step()) {
			const row = statement.getAsObject();
			const word = {
				surface: String(row.surface),
				yomi: String(row.yomi),
				vowels: String(row.vowels),
			};
			let length = minLength;
			while (length < Math.min(queryVowels.length, word.vowels.length)) {
				const matches =
					mode === "rhyme"
						? word.vowels.at(-length - 1) === queryVowels.at(-length - 1)
						: word.vowels[length] === queryVowels[length];
				if (!matches) break;
				length++;
			}
			candidates[length] ??= [];
			candidates[length].push(word);
		}
	} finally {
		statement.free();
	}
	const used = new Set<string>();
	for (let length = queryVowels.length; length >= minLength; length--) {
		const unique = (candidates[length] ?? []).filter((word) => {
			if (used.has(word.surface)) return false;
			used.add(word.surface);
			return true;
		});
		if (unique.length) results[length] = unique.sort(() => Math.random() - 0.5);
	}
	return results;
}
