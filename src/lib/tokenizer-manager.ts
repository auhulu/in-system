import type { IpadicFeatures, Tokenizer } from "kuromoji";
import DynamicDictionaries from "kuromoji/src/dict/DynamicDictionaries.js";
import TokenInfoDictionary from "kuromoji/src/dict/TokenInfoDictionary.js";
import UnknownDictionary from "kuromoji/src/dict/UnknownDictionary.js";
import TokenizerConstructor from "kuromoji/src/Tokenizer.js";

let tokenizer: Tokenizer<IpadicFeatures> | undefined;
let initializing: Promise<Tokenizer<IpadicFeatures>> | undefined;

function tokenMap(
	data: ArrayBuffer,
	index: ArrayBuffer,
): Record<number, Int32Array | undefined> {
	const values = new Int32Array(data);
	const offsets = new Uint32Array(index);
	return new Proxy(
		{},
		{
			get(_target, key) {
				if (typeof key !== "string") return undefined;
				const offset = offsets[Number(key)];
				if (!offset) return undefined;
				return values.subarray(offset + 1, offset + 1 + values[offset]);
			},
		},
	);
}

async function loadTokenizer(
	assets: Fetcher,
): Promise<Tokenizer<IpadicFeatures>> {
	const manifest = await assets.fetch(
		"https://assets.internal/dict/manifest.json",
	);
	if (!manifest.ok)
		throw new Error(`Tokenizer manifest unavailable (${manifest.status})`);
	const sizes = await manifest.json<Record<string, number>>();
	async function load(name: string): Promise<ArrayBuffer> {
		const response = await assets.fetch(
			`https://assets.internal/dict/${name}.bin`,
		);
		if (!response.ok || !response.body)
			throw new Error(`Dictionary unavailable: ${name}`);
		// Stream into a single allocation: tid_pos alone is tens of megabytes.
		const output = new Uint8Array(sizes[name]);
		const reader = response.body
			.pipeThrough(new DecompressionStream("gzip"))
			.getReader();
		let offset = 0;
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			output.set(value, offset);
			offset += value.length;
		}
		if (offset !== output.length)
			throw new Error(`Invalid dictionary size: ${name}`);
		return output.buffer;
	}

	// Skip constructors' unused 10 MiB build buffers; initialise through load methods.
	const tokens: TokenInfoDictionary = Object.create(
		TokenInfoDictionary.prototype,
	);
	tokens.loadDictionary(new Uint8Array(await load("tid")));
	tokens.loadPosVector(new Uint8Array(await load("tid_pos")));
	tokens.target_map = tokenMap(
		await load("tid_map"),
		await load("tid_offsets"),
	);
	const unknown: UnknownDictionary = Object.create(UnknownDictionary.prototype);
	unknown.loadUnknownDictionaries(
		new Uint8Array(await load("unk")),
		new Uint8Array(await load("unk_pos")),
		new Uint8Array(await load("unk_map")),
		new Uint8Array(await load("unk_char")),
		new Uint32Array(await load("unk_compat")),
		new Uint8Array(await load("unk_invoke")),
	);
	const dictionaries = new DynamicDictionaries(
		undefined,
		tokens,
		undefined,
		unknown,
	);
	dictionaries.loadTrie(
		new Int32Array(await load("base")),
		new Int32Array(await load("check")),
	);
	dictionaries.loadConnectionCosts(new Int16Array(await load("cc")));
	return new TokenizerConstructor(dictionaries);
}

export async function getTokenizer(
	assets: Fetcher,
): Promise<Tokenizer<IpadicFeatures>> {
	if (tokenizer) return tokenizer;
	initializing ??= loadTokenizer(assets)
		.then((value) => {
			tokenizer = value;
			return value;
		})
		.catch((error) => {
			initializing = undefined;
			throw error;
		});
	return initializing;
}
