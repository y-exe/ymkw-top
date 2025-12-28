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
- snapshots: ランキング保存用

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
cd bot
pip install -r requirements.txt
python main.py
```

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

### スナップショット

- /open コマンドにより、特定時点のランキングデータを固定保存（スナップショット）可能。
- 保存されたデータはWeb上で永続的に閲覧可能です。

## ライセンス

MIT License

Copyright (c) 2025 ymkw.top