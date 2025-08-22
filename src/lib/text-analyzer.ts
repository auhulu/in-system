import { ensureTokenizerReady, getTokenizer } from "./tokenizer-manager";

/**
 * テキストから読み（よみ）を取得する
 * @param text 解析対象のテキスト
 * @returns 読み文字列
 */
export async function getYomi(text: string): Promise<string> {
	// tokenizerの初期化を確実に行う
	await ensureTokenizerReady();
	
	const tokenizer = getTokenizer();
	const tokens = tokenizer.tokenize(text);
	let yomi = "";

	for (const token of tokens) {
		// 読みが存在する場合はそれを使用、なければ表層形を使用
		if (token.reading && token.reading !== "*") {
			yomi += token.reading;
		} else {
			yomi += token.surface_form;
		}
	}

	return yomi;
}

/**
 * テキストをトークンに分割する
 * @param text 解析対象のテキスト
 * @returns トークンの配列
 */
export async function tokenizeText(text: string) {
	await ensureTokenizerReady();
	const tokenizer = getTokenizer();
	return tokenizer.tokenize(text);
}

/**
 * 複数のテキストから読みを一括取得する
 * @param texts 解析対象のテキスト配列
 * @returns 読み文字列の配列
 */
export async function getYomiBatch(texts: string[]): Promise<string[]> {
	// 一度だけ初期化を行う
	await ensureTokenizerReady();
	
	const results: string[] = [];
	for (const text of texts) {
		const yomi = await getYomi(text);
		results.push(yomi);
	}
	
	return results;
}
