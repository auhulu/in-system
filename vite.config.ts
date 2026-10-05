import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function sqlJsWorkersLoader() {
	return {
		name: "sql-js-workers-loader",
		enforce: "pre" as const,
		transform(code: string, id: string) {
			if (!id.endsWith("/sql.js/dist/sql-wasm-browser.js")) return;
			// Emscripten assumes browser workers have self.location. Cloudflare does
			// not; our instantiateWasm supplies the module, so no script URL is needed.
			return {
				code: code.replaceAll("self.location.href", "self.location?.href"),
				map: null,
			};
		},
	};
}

export default defineConfig({
	server: { allowedHosts: ["assets.internal"] },
	plugins: [sqlJsWorkersLoader(), react(), cloudflare()],
	environments: {
		in_system: {
			optimizeDeps: {
				include: ["sql.js/dist/sql-wasm-browser.js"],
				rolldownOptions: { plugins: [sqlJsWorkersLoader()] },
			},
		},
	},
});
