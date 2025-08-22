import "@mantine/core/styles.css";
import {
	MantineProvider,
	ColorSchemeScript,
	mantineHtmlProps,
} from "@mantine/core";
import { theme } from "../theme";
import { Providers } from "./provider";
import type { ReactNode } from "react";

export const metadata = {
	title: "韻システム",
	description: "脚韻、頭韻を検索できます",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="ja" {...mantineHtmlProps}>
			<head>
				<meta property="og:title" content="韻システム" />
				<meta property="og:description" content="脚韻、頭韻を検索できます" />
				<meta property="og:image" content="https://in.nwnwn.com/ogp.png" />
				<meta property="og:type" content="website" />
				<meta property="og:url" content="https://in.nwnwn.com" />
				<meta name="twitter:card" content="summary_large_image" />
				<ColorSchemeScript />
				<link rel="shortcut icon" href="/favicon.ico" />
				<meta
					name="viewport"
					content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
				/>
			</head>
			<body>
				<MantineProvider theme={theme}>
					<Providers>{children}</Providers>
				</MantineProvider>
			</body>
		</html>
	);
}
