import path from "node:path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "in-system.db");
const TABLE_NAME = "words";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
	if (!db) {
		db = new Database(DB_PATH);
	}
	return db;
}

export function closeDatabase(): void {
	if (db) {
		db.close();
		db = null;
	}
}

export interface WordEntry {
	surface: string;
	yomi: string;
	vowels: string;
}

export function searchRhymeInDatabase(
	queryVowels: string,
	minLength: number = 3,
): Record<number, WordEntry[]> {
	const database = getDatabase();
	const resultsByLength: Record<number, WordEntry[]> = {};
	const usedWords = new Set<string>();

	if (queryVowels.length < minLength) {
		return resultsByLength;
	}

	// 最大長から最小長まで検索（長い韻を優先）
	for (let length = queryVowels.length; length >= minLength; length--) {
		const suffix = queryVowels.slice(-length);

		const stmt = database.prepare(
			`SELECT surface, yomi, vowels FROM ${TABLE_NAME} 
       WHERE vowels LIKE ? AND vowels != ?`,
		);

		const matches = stmt.all(`%${suffix}`, queryVowels) as WordEntry[];

		if (matches.length > 0) {
			// 重複を除去して処理
			const uniqueMatches: WordEntry[] = [];
			for (const match of matches) {
				if (!usedWords.has(match.surface)) {
					uniqueMatches.push(match);
					usedWords.add(match.surface);
				}
			}

			if (uniqueMatches.length > 0) {
				// ランダムな順序にする
				const shuffled = uniqueMatches.sort(() => Math.random() - 0.5);
				resultsByLength[length] = shuffled;
			}
		}
	}

	return resultsByLength;
}

export function searchAlliterationInDatabase(
	queryVowels: string,
	minLength: number = 3,
): Record<number, WordEntry[]> {
	const database = getDatabase();
	const resultsByLength: Record<number, WordEntry[]> = {};
	const usedWords = new Set<string>();

	if (queryVowels.length < minLength) {
		return resultsByLength;
	}

	// 最大長から最小長まで検索（長い頭韻を優先）
	for (let length = queryVowels.length; length >= minLength; length--) {
		const prefix = queryVowels.slice(0, length);

		const stmt = database.prepare(
			`SELECT surface, yomi, vowels FROM ${TABLE_NAME} 
       WHERE vowels LIKE ? AND vowels != ?`,
		);

		const matches = stmt.all(`${prefix}%`, queryVowels) as WordEntry[];

		if (matches.length > 0) {
			// 重複を除去して処理
			const uniqueMatches: WordEntry[] = [];
			for (const match of matches) {
				if (!usedWords.has(match.surface)) {
					uniqueMatches.push(match);
					usedWords.add(match.surface);
				}
			}

			if (uniqueMatches.length > 0) {
				// ランダムな順序にする
				const shuffled = uniqueMatches.sort(() => Math.random() - 0.5);
				resultsByLength[length] = shuffled;
			}
		}
	}

	return resultsByLength;
}
