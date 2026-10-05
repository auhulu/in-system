// Kuromoji 0.1.2 exposes these CommonJS modules without TypeScript declarations.
declare module "kuromoji/src/dict/TokenInfoDictionary.js" {
	export default class TokenInfoDictionary {
		target_map: Record<number, Int32Array | undefined>;
		loadDictionary(data: Uint8Array): void;
		loadPosVector(data: Uint8Array): void;
	}
}
declare module "kuromoji/src/dict/UnknownDictionary.js" {
	import TokenInfoDictionary from "kuromoji/src/dict/TokenInfoDictionary.js";
	export default class UnknownDictionary extends TokenInfoDictionary {
		loadUnknownDictionaries(
			dictionary: Uint8Array,
			pos: Uint8Array,
			map: Uint8Array,
			chars: Uint8Array,
			compat: Uint32Array,
			invoke: Uint8Array,
		): void;
	}
}
declare module "kuromoji/src/dict/DynamicDictionaries.js" {
	import TokenInfoDictionary from "kuromoji/src/dict/TokenInfoDictionary.js";
	import UnknownDictionary from "kuromoji/src/dict/UnknownDictionary.js";
	export default class DynamicDictionaries {
		constructor(
			trie: undefined,
			tokens: TokenInfoDictionary,
			costs: undefined,
			unknown: UnknownDictionary,
		);
		loadTrie(base: Int32Array, check: Int32Array): void;
		loadConnectionCosts(costs: Int16Array): void;
	}
}
declare module "kuromoji/src/Tokenizer.js" {
	import type { IpadicFeatures, Tokenizer } from "kuromoji";
	import type DynamicDictionaries from "kuromoji/src/dict/DynamicDictionaries.js";
	const TokenizerConstructor: new (
		dictionary: DynamicDictionaries,
	) => Tokenizer<IpadicFeatures>;
	export default TokenizerConstructor;
}
declare module "*.wasm?module" {
	const module: WebAssembly.Module;
	export default module;
}
