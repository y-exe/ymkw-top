# Discord Server Analytics (ymkw.top)

Discord鯖のアクティビティ収集、集計、可視化するための統合システムです。<br>
Discord.pyによるデータ収集、FastAPIによるデータ提供、Astro/ReactによるWebダッシュボードで構成

## ディレクトリ構成

プロジェクトは以下のモノレポ構成で管理されています。

- bot/ : データ収集およびコマンド操作を行うDiscordBot
- backend/ : データベースと通信し、フロントエンドにJSONを提供するRESTAPI
- frontend/ : Webダッシュボード (Astro + React)

## 必須要件

- Python 3.10以上
- Node.js 18以上
- PostgreSQL (データベース)

## セットアップ手順

### 1. データベースの準備

PostgreSQLデータベースを作成し、以下のテーブルが必要です。

- users: ユーザー情報 (ID, 名前, アバターURL)
- messages: メッセージログ (ID, ユーザーID, チャンネルID, 日時, 文字数)
- channels: チャンネル情報

既存データが多い環境では、集計APIを速くするために追加インデックスを作成してください。

```bash
psql "$DB_DSN" -f db/indexes.sql
```

`CREATE INDEX CONCURRENTLY` を使っているため、明示的なトランザクションの中では実行しないでください。

### 2. 環境変数の設定

各ディレクトリに必要な `.env` ファイルを作成してください。

**bot/.env および backend/.env (共通):**

```ini
DISCORD_TOKEN=あなたのDiscordボットトークン
DB_DSN=postgresql://user:password@localhost:5432/dbname
GUILD_ID=対象のサーバーID
OWNER_ID=管理者のユーザーID
ADMIN_ROLE_ID=管理者ロールID
KING_ROLE_ID=ランキング1位に付与するロールID
ANNOUNCE_CHANNEL_ID=通知用チャンネルID
```

**frontend/.env:**

```ini
PUBLIC_API_URL=https://api.example.com
```

### 3. 各コンポーネントの起動

**Botの起動 (データ収集):**

```bash
cd Bot
pip install -r requirements.txt
python main.py
```

**過去ログの再取得 (バックフィル):**

Botが停止していた期間のメッセージは、通常起動だけでは自動復旧されません。
必要な期間を指定して `history_scanner.py` を一度実行してください。

```bash
cd Bot
python history_scanner.py
```

終了日を区切る場合:

```bash
python history_scanner.py --after 2025-03-28 --before 2026-05-01
```

進捗を無視して完全に最初から走らせ直す場合:

```bash
python history_scanner.py --after 2025-03-28 --reset-progress
```

デフォルトでは `2025-03-28` 以降を再取得します。
同じメッセージを再取得した場合は、`message_id` をキーにユーザーID、チャンネルID、作成日時、Bot判定、文字数を上書きします。
再取得の進捗は `backfill_progress` に保存されるため、途中で止まった場合も同じコマンドで続きから再開できます。
今後のデータ蓄積は `python main.py` でBotを常時起動している間、`on_message` により自動で行われます。
通常のテキストチャンネルに加えて、フォーラム投稿およびスレッド内のメッセージも再取得対象です。
ローカルPowerShellから実行する場合、`postgres-db:5432` は自動で `localhost:5433` として扱われます。

**バックエンドAPIの起動:**

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8070
```

**フロントエンドの開発サーバー起動:**

```bash
cd frontend
npm install
npm run dev
```

**フロントエンドのビルド:**

```bash
npm run build
```

## 主な機能

### データ収集とプライバシー

- Botはメッセージのメタデータ（送信日時、文字数、チャンネル）のみを保存します。メッセージ本文は保存しません。
- 削除されたユーザー（Deleted User）やBotが認識できないユーザーは、ランキングおよび個人推移グラフから自動的に除外されます。

### Webダッシュボード

- サーバー全体の活動量、ヒートマップ、チャンネル別分布を表示。
- ユーザーごとの発言数推移を折れ線グラフで可視化。
- ログイン中のユーザーおよび検索したユーザーのデータをグラフ上で比較可能。

### キャッシュシステム

パフォーマンスと負荷軽減のため、3段階のキャッシュを実装しています。

1. ブラウザキャッシュ: ユーザー側の再読み込みを高速化
2. エッジキャッシュ (Cloudflare): HTMLおよびAPIレスポンスをCDNでキャッシュ
3. ディスクキャッシュ (API): データベース集計結果をサーバー上に一時保存 (DiskCache使用)

### 累計ランキング

- Webの `/open` は、常に最新の全期間ランキングを表示します。
- Discordの `/all` コマンドにより、全期間ランキングの埋め込みを送信できます。

## ライセンス

MIT License

Copyright (c) 2026 ymkw.top
