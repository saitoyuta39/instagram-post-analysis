# Instagram 投稿解析システム

このシステムは、Instagram の投稿（画像・動画・カルーセル）を Gemini API を使用してマルチモーダル解析し、独自のナレッジベース（Google ドキュメント）に基づいてプロ視点での添削とスコアリングを行うツールです。

## プロジェクト構成

- **フロントエンド**: Next.js (ルートディレクトリ)
- **バックエンド**: FastAPI / Python (`api/` ディレクトリ)

## ローカル環境での起動方法

このプロジェクトをローカルで動かすには、以下の2つの方法があります。

### 方法1: Vercel CLI を使用する (推奨)

Vercel の環境をエミュレートして、フロントエンドとバックエンドを同時に起動します。

1. **Vercel CLI のインストール**:
   ```bash
   npm install -g vercel
   ```

2. **依存関係のインストール**:
   ```bash
   # フロントエンド
   npm install
   # バックエンド (api/venv などで管理)
   cd api
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   cd ..
   ```

3. **環境変数の設定**:
   `api/.env` ファイルを作成し、必要な API キーを設定してください（詳細は後述）。

4. **起動**:
   ```bash
   vercel dev
   ```
   ブラウザで `http://localhost:3000` を開きます。

---

### 方法2: フロントエンドとバックエンドを個別に起動する

Vercel CLI を使わない場合は、バックエンド（FastAPI）とフロントエンド（Next.js）を別々のターミナルで起動します。

#### 1. バックエンドの起動 (FastAPI)
1. `api` ディレクトリへ移動:
   ```bash
   cd api
   ```
2. 仮想環境の作成と起動:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows
   source venv/bin/activate  # Mac/Linux
   ```
3. 依存ライブラリのインストール:
   ```bash
   pip install -r requirements.txt
   ```
4. サーバーの起動:
   ```bash
   python index.py
   ```
   これで `http://localhost:8000` で API が起動します。

#### 2. フロントエンドの起動 (Next.js)
1. ルートディレクトリで依存ライブラリをインストール:
   ```bash
   npm install
   ```
2. サーバーの起動:
   ```bash
   npm run dev
   ```
   これで `http://localhost:3000` でフロントエンドが起動します。
   ※ ローカル実行時に API の向き先を調整する必要がある場合があります（`next.config.ts` でのリライト設定など）。

## 環境変数の設定

`api/.env` に以下の項目を設定する必要があります。

```env
# Google Gemini API
GEMINI_API_KEY=あなたのGemini_APIキー

# Instagram Graph API
INSTAGRAM_ACCESS_TOKEN=あなたのアクセストークン
INSTAGRAM_BUSINESS_ACCOUNT_ID=あなたのビジネスアカウントID

# Google Docs (ナレッジベース)
GOOGLE_DOC_ID=ナレッジが蓄積されたGoogleドキュメントのID
GOOGLE_SERVICE_ACCOUNT_INFO=GoogleサービスアカウントのJSONキー（1行で記述）

# Supabase (オプション)
SUPABASE_URL=あなたのSupabaseURL
SUPABASE_KEY=あなたのSupabaseKey
```

## 使い方

1. `http://localhost:3000` にアクセスします。
2. Instagram のユーザー名を入力して「投稿を取得」をクリックするか、投稿の URL を直接入力します。
3. 解析したい投稿を選択し、「解析を開始」をクリックします。
4. Gemini がマルチモーダル解析を行い、スコアと具体的な改善案（赤ペン添削）が表示されます。

## ナレッジベースについて

このシステムは `GOOGLE_DOC_ID` で指定された Google ドキュメントを「マニュアル」として読み込み、その内容に基づいて添削を行います。ドキュメントを更新することで、AI の診断基準を自由に変更できます。
