import type { Env } from "../worker/env";
import { getDatabase, searchInDatabase, type WordEntry } from "./database";
import { getVowels } from "./getVowels";
import { getYomi } from "./text-analyzer";

export interface RhymeResult {
	yomi: string;
	vowels: string;
	results: Record<number, WordEntry[]>;
}

async function search(
	env: Env,
	text: string,
	minLength: number,
	mode: "rhyme" | "alliteration",
): Promise<RhymeResult> {
	const { yomi, vowels } = await getYomiAndVowels(env, text);
	if (vowels.length < minLength) return { yomi, vowels, results: {} };
	const db = await getDatabase(env.ASSETS);
	return {
		yomi,
		vowels,
		results: searchInDatabase(db, vowels, minLength, mode),
	};
}

export function searchRhyme(
	env: Env,
	text: string,
	minLength = 3,
): Promise<RhymeResult> {
	return search(env, text, minLength, "rhyme");
}

export function searchAlliteration(
	env: Env,
	text: string,
	minLength = 3,
): Promise<RhymeResult> {
	return search(env, text, minLength, "alliteration");
}

export async function getYomiAndVowels(
	env: Env,
	text: string,
): Promise<{ yomi: string; vowels: string }> {
	const yomi = await getYomi(env.ASSETS, text);
	return { yomi, vowels: getVowels(yomi) };
}
