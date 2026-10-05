# 韻検索システム

React + Vite / Cloudflare Workers。既存の `in-system.db` をそのまま同梱し、sql.js（SQLite WASM）で読み取り専用検索します。D1、R2、外部データベースは不要です。

## 開発

Node.js 22.13以降、Yarn 4.9.3を使用します。

```sh
yarn install --immutable
yarn dev
```

Yarnコマンドがない環境では、`yarn` を `node .yarn/releases/yarn-4.9.3.cjs` に置き換えられます。

`dev` / `build` は `in-system.db` を `public/data/` にコピーし、Kuromojiの辞書を `public/dict/` に生成します。元のSQLiteファイルと辞書の語彙は変更しません。生成ファイルはGit管理対象外です。

## ビルド・検証

```sh
yarn build
yarn test
yarn lint
yarn preview
```

テストはビルド済みのWorkerをローカルの4174番ポートで起動し、元のSQLite検索との結果比較、読みの一致、不正な入力、MCPの初期化・検索を検証します。`TEST_BASE_URL` を設定すると起動済みのサーバーを使用できます。

## Cloudflareへのデプロイ

```sh
yarn wrangler login
yarn deploy
```

`wrangler.jsonc` のWorker名は `in-system` です。`yarn deploy` がビルドとWorker・静的アセットのアップロードを実行します。カスタムドメインを使う場合はCloudflareでWorkerへの割り当てを設定してください。OGPのURLは従来の `https://in.nwnwn.com` を維持しています。

データ更新はルートの `in-system.db` を差し替えて再デプロイします。実行時の書き込みは無効で、更新の永続化は行いません。DBはASSETS bindingから読み込み、外部からの `/data/*` リクエストには404を返します。

初回検索時に辞書とSQLiteをメモリに読み込み、Workerのインスタンス内で再利用します。辞書は未使用領域を除去し、トークン参照をTypedArrayで保持します。辞書の初期化とSQLite WASM検索はCPUを使うため、Workers Paidを想定しています。実際のCPU時間・メモリ使用量は本番のWorkersメトリクスで確認してください。ローカルテストは本番のリソース制限を保証するものではありません。

sql.jsのEmscriptenローダーが参照する `self.location` はWorkersに存在しないため、Viteで該当箇所だけを互換処理しています。WASM本体は事前コンパイル済みモジュールとしてインポートします。

## API

- `POST /api/rhyme`: 脚韻検索
- `POST /api/alliteration`: 頭韻検索
- `POST /api/mcp`: MCP Streamable HTTP（ステートレス）。`rhyme_search` / `alliteration_search` を提供

検索入力は `{ "text": "チーム友達", "minLength": 3 }`。`text` は1〜200文字、`minLength` は1〜200の整数（省略時3）です。レスポンスの `yomi` / `vowels` / `results` は従来の形式を維持します。

参考: [CloudflareのReact + Vite構成](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/)、[WASMモジュール](https://developers.cloudflare.com/workers/vite-plugin/reference/non-javascript-modules/)、[Workersの制限](https://developers.cloudflare.com/workers/platform/limits/)、[sql.js](https://github.com/sql-js/sql.js)。
