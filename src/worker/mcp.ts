import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { searchInput } from "../lib/search-input";
import { searchAlliteration, searchRhyme } from "../lib/searchRhyme";
import type { Env } from "./env";

export async function handleMcp(request: Request, env: Env): Promise<Response> {
	const server = new McpServer({ name: "in-system", version: "1.0.0" });
	for (const [name, description, search] of [
		[
			"rhyme_search",
			"日本語の指定の単語（テキスト）と同じ脚韻の単語を検索します",
			searchRhyme,
		],
		[
			"alliteration_search",
			"日本語の指定の単語（テキスト）と同じ頭韻の単語を検索します",
			searchAlliteration,
		],
	] as const) {
		server.registerTool(
			name,
			{ description, inputSchema: searchInput.shape },
			async ({ text, minLength }) => ({
				content: [
					{
						type: "text",
						text: JSON.stringify(await search(env, text, minLength)),
					},
				],
			}),
		);
	}
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	});
	await server.connect(transport);
	try {
		return await transport.handleRequest(request);
	} finally {
		await server.close();
	}
}
