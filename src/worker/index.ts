import { searchInput } from "../lib/search-input";
import { searchAlliteration, searchRhyme } from "../lib/searchRhyme";
import type { Env } from "./env";
import { handleMcp } from "./mcp";

export default {
	async fetch(request, env) {
		const path = new URL(request.url).pathname;
		try {
			if (path === "/api/mcp") return await handleMcp(request, env);
			if (path === "/api/rhyme" || path === "/api/alliteration") {
				if (request.method !== "POST") {
					return Response.json(
						{ error: "Method not allowed" },
						{
							status: 405,
							headers: { Allow: "POST" },
						},
					);
				}
				let body: unknown;
				try {
					body = await request.json();
				} catch {
					return Response.json({ error: "Invalid JSON" }, { status: 400 });
				}
				const parsed = searchInput.safeParse(body);
				if (!parsed.success) {
					return Response.json(
						{
							error:
								"text must be 1–200 characters; minLength must be an integer from 1 to 200",
						},
						{ status: 400 },
					);
				}
				const search = path === "/api/rhyme" ? searchRhyme : searchAlliteration;
				return Response.json(
					await search(env, parsed.data.text, parsed.data.minLength),
				);
			}
			if (path.startsWith("/api/") || path.startsWith("/data/")) {
				return Response.json({ error: "Not found" }, { status: 404 });
			}
			return env.ASSETS.fetch(request);
		} catch (error) {
			console.error("Request failed:", error);
			return Response.json({ error: "Internal server error" }, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
