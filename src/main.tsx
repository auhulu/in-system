import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import HomePage from "./app/page";
import { Providers } from "./app/provider";
import { theme } from "./theme";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
createRoot(root).render(
	<StrictMode>
		<MantineProvider theme={theme}>
			<Providers>
				<HomePage />
			</Providers>
		</MantineProvider>
	</StrictMode>,
);
