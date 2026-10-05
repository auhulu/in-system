import { getTokenizer } from "./tokenizer-manager";

export async function tokenizeText(assets: Fetcher, text: string) {
	return (await getTokenizer(assets)).tokenize(text);
}

export async function getYomi(assets: Fetcher, text: string): Promise<string> {
	const tokens = await tokenizeText(assets, text);
	return tokens
		.map((token) =>
			token.reading && token.reading !== "*"
				? token.reading
				: token.surface_form,
		)
		.join("");
}

export async function getYomiBatch(
	assets: Fetcher,
	texts: string[],
): Promise<string[]> {
	const results: string[] = [];
	for (const text of texts) results.push(await getYomi(assets, text));
	return results;
}
