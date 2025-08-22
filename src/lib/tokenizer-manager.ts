import kuromoji, { type IpadicFeatures, type Tokenizer } from "kuromoji";
import path from "node:path";

// プロダクション環境では public/dict を使用
const DIC_PATH = process.env.NODE_ENV === "production" 
  ? path.join(process.cwd(), "public", "dict")
  : "node_modules/kuromoji/dict";

let tokenizer: Tokenizer<IpadicFeatures> | null = null;
let initPromise: Promise<void> | null = null;

/**
 * tokenizerを初期化する
 * 複数回呼び出されても安全（初回のみ実行）
 */
export async function initializeTokenizer(): Promise<void> {
	// 既に初期化済みの場合は何もしない
	if (tokenizer) {
		return;
	}

	// 初期化中の場合は既存のPromiseを返す
	if (initPromise) {
		return initPromise;
	}

	// 新しい初期化処理を開始
	initPromise = new Promise((resolve, reject) => {
		kuromoji
			.builder({ dicPath: DIC_PATH })
			.build((err: Error | null, builtTokenizer: Tokenizer<IpadicFeatures>) => {
				if (err) {
					// エラー時はPromiseをリセットして再試行可能にする
					initPromise = null;
					reject(new Error(`Kuromoji tokenizer initialization failed: ${err.message}`));
					return;
				}
				tokenizer = builtTokenizer;
				resolve();
			});
	});

	return initPromise;
}

/**
 * 初期化済みのtokenizerを取得する
 * 初期化されていない場合はエラーを投げる
 */
export function getTokenizer(): Tokenizer<IpadicFeatures> {
	if (!tokenizer) {
		throw new Error("Tokenizer is not initialized. Call initializeTokenizer() first.");
	}
	return tokenizer;
}

/**
 * tokenizerが初期化済みかどうかを確認する
 */
export function isTokenizerInitialized(): boolean {
	return tokenizer !== null;
}

/**
 * tokenizerの初期化を確実に行う
 * 初期化済みの場合は何もしない
 */
export async function ensureTokenizerReady(): Promise<void> {
	if (!isTokenizerInitialized()) {
		await initializeTokenizer();
	}
}
