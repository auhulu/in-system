import { getYomi } from "./kuromoji";
import { getVowels } from "./getVowels";
import {
	searchRhymeInDatabase,
	searchAlliterationInDatabase,
	closeDatabase,
} from "./database";

export interface RhymeResult {
	yomi: string;
	vowels: string;
	results: Record<
		number,
		Array<{
			surface: string;
			yomi: string;
			vowels: string;
		}>
	>;
}

export async function searchRhyme(
	text: string,
	minLength: number = 3,
): Promise<RhymeResult> {
	try {
		// kuromojiで読みを取得
		const yomi = await getYomi(text);

		// 母音列を取得
		const vowels = getVowels(yomi);

		// データベースから韻を検索
		const results = searchRhymeInDatabase(vowels, minLength);

		return {
			yomi,
			vowels,
			results,
		};
	} finally {
		// データベース接続をクローズ
		closeDatabase();
	}
}

export async function searchAlliteration(
	text: string,
	minLength: number = 3,
): Promise<RhymeResult> {
	try {
		// kuromojiで読みを取得
		const yomi = await getYomi(text);

		// 母音列を取得
		const vowels = getVowels(yomi);

		// データベースから頭韻を検索
		const results = searchAlliterationInDatabase(vowels, minLength);

		return {
			yomi,
			vowels,
			results,
		};
	} finally {
		// データベース接続をクローズ
		closeDatabase();
	}
}

// ユーティリティ関数：単一のテキストから読みと母音列を取得
export async function getYomiAndVowels(
	text: string,
): Promise<{ yomi: string; vowels: string }> {
	const yomi = await getYomi(text);
	const vowels = getVowels(yomi);
	return { yomi, vowels };
}
