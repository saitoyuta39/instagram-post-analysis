# Instagram 投稿解析システム (Gemini 1.5 Pro 活用)

このシステムは、WordPress に蓄積された独自の Instagram 運用ノウハウをナレッジベースとし、Gemini 1.5 Pro のマルチモーダル機能を活用して、ユーザーのリール動画やフィード投稿をプロ視点で添削・スコアリングするシステムです。

## 1. 必要なもの (システム要件)

### 環境
- **Python 3.9 以上** (バックエンド用)
- **Node.js 18.x 以上** (フロントエンド用)
- **Redis** (非同期処理用: Celery/Redis)
- **Supabase アカウント** (データベース & ベクトル検索用)

### 必要な API キー / トークン
以下のサービスから取得し、`.env` ファイルに設定する必要があります。
1. **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/) から取得。
2. **Instagram Graph API Access Token**: Facebook Developer Console でアプリを作成し、Instagram ビジネスアカウントのトークンを取得。
3. **Supabase URL & Key**: [Supabase プロジェクト](https://supabase.com/)から取得。

## 2. セットアップ手順

### バックエンド (FastAPI)
1. `backend` ディレクトリへ移動:
   ```bash
   cd backend
   ```
2. 仮想環境の作成と起動:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   ```
3. 依存ライブラリのインストール:
   ```bash
   pip install -r requirements.txt
   ```
4. 環境変数の設定:
   `backend/.env` ファイルを作成し、以下を記述します。
   ```env
   GEMINI_API_KEY=あなたのGeminiAPIキー
   INSTAGRAM_ACCESS_TOKEN=あなたのインスタグラムトークン
   SUPABASE_URL=あなたのSupabaseURL
   SUPABASE_KEY=あなたのSupabaseKey
   REDIS_URL=redis://localhost:6379/0
   ```
5. サーバーの起動:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### フロントエンド (Next.js)
1. `frontend` ディレクトリへ移動:
   ```bash
   cd frontend
   ```
2. 依存ライブラリのインストール:
   ```bash
   npm install
   ```
3. サーバーの起動:
   ```bash
   npm run dev
   ```

## 3. 使い方

1. ブラウザで `http://localhost:3000` を開きます。
2. Instagram の「リール動画」または「フィード投稿」の URL を入力フォームに貼り付けます。
3. 「解析を開始」ボタンをクリックします。
4. **解析プロセス**:
   - バックエンドが Instagram API を通じて動画/画像とキャプションを取得。
   - `knowledge_base/` 内の Markdown ファイルを読み込み、Gemini 1.5 Pro にナレッジとして提供。
   - Gemini がマルチモーダル解析を行い、スコア、具体的な指摘、改善プランを生成。
5. **診断レポートの確認**:
   - 100点満点のスコア。
   - 「赤ペン添削」セクションで、動画の秒数や画像の場所に基づいた具体的な改善点を確認。
   - 明日から実行できる3つのアクションプランを確認。

## 4. ナレッジベースの更新
`knowledge_base/` ディレクトリ内の `.md` ファイルを編集・追加することで、AI の診断基準を最新のノウハウにアップデートできます。
例: `reels_checklist.md` に新しい「流行りのフック」を追加すると、次回の診断からその基準が反映されます。
