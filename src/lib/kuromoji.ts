import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";

const DIC_PATH = "node_modules/kuromoji/dict";

let tokenizer: Tokenizer<IpadicFeatures> | null = null;

export async function initTokenizer(): Promise<void> {
	if (tokenizer) return;

	return new Promise((resolve, reject) => {
		kuromoji
			.builder({ dicPath: DIC_PATH })
			.build((err: Error, builtTokenizer: Tokenizer<IpadicFeatures>) => {
				if (err) {
					reject(err);
					return;
				}
				tokenizer = builtTokenizer;
				resolve();
			});
	});
}

export async function getYomi(text: string): Promise<string> {
	if (!tokenizer) {
		await initTokenizer();
	}

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
