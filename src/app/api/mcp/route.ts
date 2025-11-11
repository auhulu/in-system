import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { searchAlliteration, searchRhyme } from "../../../lib/searchRhyme";

const handler = createMcpHandler(
	(server) => {
		server.tool(
			"rhyme_search",
			"日本語の指定の単語（テキスト）と同じ脚韻の単語を検索します",
			{
				text: z
					.string()
					.describe("検索するテキスト ex) チーム友達、 親友誇らしい、 同じ"),
			},
			async ({ text }) => {
				const result = await searchRhyme(text);
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(result),
						},
					],
				};
			},
		);

		server.tool(
			"alliteration_search",
			"日本語の指定の単語（テキスト）と同じ頭韻の単語を検索します",
			{
				text: z
					.string()
					.describe("検索するテキスト ex) チーム友達、 親友誇らしい、 同じ"),
			},
			async ({ text }) => {
				const minLength = 3;
				const result = await searchAlliteration(text, minLength);
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(result),
						},
					],
				};
			},
		);
	},
	{},
	{
		basePath: "/api",
		maxDuration: 60,
		verboseLogs: false,
	},
);

export { handler as GET, handler as POST };
