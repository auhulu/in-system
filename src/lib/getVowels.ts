// カタカナから母音へのマッピング
const katakanaToVowel: Record<string, string> = {
	ア: "a",
	カ: "a",
	サ: "a",
	タ: "a",
	ナ: "a",
	ハ: "a",
	マ: "a",
	ヤ: "a",
	ラ: "a",
	ワ: "a",
	ガ: "a",
	ザ: "a",
	ダ: "a",
	バ: "a",
	パ: "a",
	イ: "i",
	キ: "i",
	シ: "i",
	チ: "i",
	ニ: "i",
	ヒ: "i",
	ミ: "i",
	リ: "i",
	ギ: "i",
	ジ: "i",
	ヂ: "i",
	ビ: "i",
	ピ: "i",
	ウ: "u",
	ク: "u",
	ス: "u",
	ツ: "u",
	ヌ: "u",
	フ: "u",
	ム: "u",
	ユ: "u",
	ル: "u",
	グ: "u",
	ズ: "u",
	ヅ: "u",
	ブ: "u",
	プ: "u",
	エ: "e",
	ケ: "e",
	セ: "e",
	テ: "e",
	ネ: "e",
	ヘ: "e",
	メ: "e",
	レ: "e",
	ゲ: "e",
	ゼ: "e",
	デ: "e",
	ベ: "e",
	ペ: "e",
	オ: "o",
	コ: "o",
	ソ: "o",
	ト: "o",
	ノ: "o",
	ホ: "o",
	モ: "o",
	ヨ: "o",
	ロ: "o",
	ヲ: "o",
	ゴ: "o",
	ゾ: "o",
	ド: "o",
	ボ: "o",
	ポ: "o",
	ン: "n",
	ァ: "a",
	ャ: "a",
	ィ: "i",
	ゥ: "u",
	ュ: "u",
	ェ: "e",
	ォ: "o",
	ョ: "o",
};

// カタカナ文字列を母音の列に変換する関数
export function getVowels(text: string): string {
	// 長音記号「ー」を処理
	const chars = text.split("");
	for (let i = 1; i < chars.length; i++) {
		if (chars[i] === "ー") {
			const prevChar = chars[i - 1];
			if (prevChar in katakanaToVowel) {
				const prevVowel = katakanaToVowel[prevChar];
				if (prevVowel === "a") chars[i] = "ア";
				else if (prevVowel === "i") chars[i] = "イ";
				else if (prevVowel === "u") chars[i] = "ウ";
				else if (prevVowel === "e") chars[i] = "エ";
				else if (prevVowel === "o") chars[i] = "ウ";
			}
		}
	}

	const processedText = chars.join("");

	// 各文字を母音に変換
	let vowelStr = "";
	for (let i = 0; i < processedText.length; i++) {
		const char = processedText[i];

		// 小さいつ（ッ）は無視
		if (char === "ッ") {
			continue;
		}

		// 小さい文字がある場合の処理
		if (
			i < processedText.length - 1 &&
			["ァ", "ャ", "ィ", "ゥ", "ュ", "ェ", "ォ", "ョ"].includes(
				processedText[i + 1],
			)
		) {
			const nextChar = processedText[i + 1];
			if (nextChar in katakanaToVowel) {
				vowelStr += katakanaToVowel[nextChar];
			}
			continue;
		}

		// 前の文字が小さい文字を伴う文字だった場合はスキップ
		if (
			i > 0 &&
			["ァ", "ャ", "ィ", "ゥ", "ュ", "ェ", "ォ", "ョ"].includes(char)
		) {
			continue;
		}

		// 通常の文字処理
		if (char in katakanaToVowel) {
			vowelStr += katakanaToVowel[char];
		}
	}

	return vowelStr;
}
