from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
import os
import glob
from dotenv import load_dotenv
import google.generativeai as genai
from typing import List, Optional, Dict, Any
import requests
import json
import uuid
from google.oauth2 import service_account
from googleapiclient.discovery import build

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Instagram Graph API Config
INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN")
IG_BUSINESS_ACCOUNT_ID = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID")

app = FastAPI(title="Instagram Post Analysis API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発環境のため一旦全て許可
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---
class InstagramMediaRequest(BaseModel):
    media_url: str
    caption: str
    media_type: str  # 'IMAGE', 'VIDEO', or 'CAROUSEL_ALBUM'
    media_id: Optional[str] = None # インスタ側のID。なければUUIDを生成
    media_urls: Optional[List[str]] = None # カルーセルの場合の子メディアURLリスト

class FeedbackItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    category: str = "suggestion" # 'good', 'bad', 'suggestion'
    timestamp: Optional[str] = None
    location: Optional[str] = None
    point: str # point は Gemini から返ってくる想定
    suggestion: str # suggestion も Gemini から返ってくる想定

class AnalysisResult(BaseModel):
    task_id: str
    status: str # 'pending', 'completed', 'failed'
    media_url: Optional[str] = None # 代表画像 URL
    media_urls: Optional[List[str]] = None # 全画像/動画 URL (カルーセル対応)
    score: Optional[int] = None
    summary: Optional[str] = None
    feedbacks: Optional[List[FeedbackItem]] = None
    action_plan: Optional[List[Any]] = None # string でも object でも一旦受け入れる

class IGPost(BaseModel):
    id: str
    media_url: str
    caption: Optional[str] = None
    media_type: str
    timestamp: str
    permalink: str
    children: Optional[Dict[str, List[Dict[str, str]]]] = None # 構造を Dict[str, List] に修正

# --- Helpers ---
def get_google_doc_content(doc_id: str) -> str:
    """Google Docs API を使用してドキュメントの内容を取得する。"""
    service_account_info_env = os.getenv("GOOGLE_SERVICE_ACCOUNT_INFO")
    if not service_account_info_env:
        print("Error: GOOGLE_SERVICE_ACCOUNT_INFO is not set.")
        return ""
    
    try:
        service_account_info = json.loads(service_account_info_env)
        creds = service_account.Credentials.from_service_account_info(
            service_account_info, scopes=['https://www.googleapis.com/auth/documents.readonly']
        )
        service = build('docs', 'v1', credentials=creds)
        document = service.documents().get(documentId=doc_id).execute()
        
        content = ""
        for element in document.get('body').get('content'):
            if 'paragraph' in element:
                for text_run in element.get('paragraph').get('elements'):
                    content += text_run.get('textRun', {}).get('content', '')
        return content
    except Exception as e:
        print(f"Error fetching Google Doc: {e}")
        return ""

def load_knowledge_base() -> str:
    """Google ドキュメントから分析用ナレッジベースを読み込む。"""
    doc_id = os.getenv("GOOGLE_DOC_ID")
    if not doc_id:
        print("Warning: GOOGLE_DOC_ID is not set.")
        return ""
    return get_google_doc_content(doc_id)

def perform_gemini_multimodal_analysis(media_urls: List[str], caption: str, media_type: str, knowledge: str) -> Dict[str, Any]:
    """Gemini でマルチモーダル解析を実行。カルーセル対応。"""
    model = genai.GenerativeModel("gemini-2.5-pro") # 最新モデル名に修正
    
    is_carousel = len(media_urls) > 1
    media_info = f"メディアタイプ: {media_type}\n"
    if is_carousel:
        media_info += f"カルーセル画像数: {len(media_urls)}\n"
        media_info += f"画像URLリスト: {', '.join(media_urls)}\n"
    else:
        media_info += f"メディアURL: {media_urls[0]}\n"

    prompt = f"""
    あなたは Instagram の運用プロフェッショナルです。
    以下の「独自ナレッジベース」に基づいて、ユーザーの投稿を添削してください。
    
    ## 独自ナレッジベース
    {knowledge}
    
    ## 解析対象
    {media_info}
    キャプション: {caption}
    
    ## 指示
    1. {"カルーセル投稿の全画像の内容を確認し、1枚目から最後までのストーリー性、情報の配置、テロップの一貫性を分析してください。" if is_carousel else "動画/画像の内容を分析し、ナレッジベースの基準に照らし合わせてください。"}
    2. 100点満点でのスコアリングを行ってください。
    3. 具体的な改善点を「赤ペン添削」として出力してください。{"カルーセルの何枚目の話か、あるいは全体の話かを明確にしてください。" if is_carousel else ""}
    4. フィードバックは必ず「良い点 (good)」「改善が必要な点 (bad)」「さらなる提案 (suggestion)」の3つのカテゴリーに分類してください。
    5. 明日から実行できる3つの具体的なアクションプランを提示してください。
    
    JSON形式で、以下の構造（TypeScriptの型定義に準拠）で出力してください。
    
    interface FeedbackItem {{
      category: "good" | "bad" | "suggestion";
      timestamp?: string; // 形式: "00:05" (動画の場合のみ)
      location?: string;  // 形式: "2枚目", "背景" など
      point: string;      // 指摘内容
      suggestion: string; // 改善案または具体的な理由
    }}

    interface AnalysisResponse {{
      score: number;       // 0-100の整数
      summary: string;     // 全体の講評 (30-50文字)
      feedbacks: FeedbackItem[];
      action_plan: string[]; // 具体的なネクストアクション3つ (文字列の配列)
    }}

    出力は JSON のみとし、コードブロック（```json）などは含めず、純粋な JSON 文字列として出力してください。
    """

    generation_config = {"response_mime_type": "application/json"}

    try:
        if api_key:
            response = model.generate_content(prompt, generation_config=generation_config)
            return json.loads(response.text)
        else:
            raise Exception("GEMINI_API_KEY is missing")
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return {"error": str(e)}

@app.get("/api")
async def root():
    return {"message": "Instagram Post Analysis API (Vercel version)"}

@app.get("/api/ig_posts/{username}", response_model=List[IGPost])
async def get_instagram_posts(username: str):
    """Business Discovery を使用して特定のユーザーの最新投稿を取得する。"""
    if not INSTAGRAM_ACCESS_TOKEN or not IG_BUSINESS_ACCOUNT_ID:
        raise HTTPException(status_code=500, detail="Instagram API config missing")
    
    query = f"business_discovery.username({username}){{media.limit(10){{id,caption,media_type,media_url,permalink,timestamp,children{{media_url,media_type}}}}}}"
    url = f"https://graph.facebook.com/v22.0/{IG_BUSINESS_ACCOUNT_ID}?fields={query}&access_token={INSTAGRAM_ACCESS_TOKEN}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if "error" in data:
            raise HTTPException(status_code=400, detail=data["error"]["message"])
            
        media_list = data.get("business_discovery", {}).get("media", {}).get("data", [])
        return media_list
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze", response_model=AnalysisResult)
async def start_analysis(request: InstagramMediaRequest):
    """解析を実行し、結果を直接返す（Vercel対応の同期処理）。"""
    task_id = request.media_id or str(uuid.uuid4())
    media_urls = request.media_urls or [request.media_url]
    
    knowledge = load_knowledge_base()
    result = perform_gemini_multimodal_analysis(media_urls, request.caption, request.media_type, knowledge)
    
    if "error" in result:
        return AnalysisResult(
            task_id=task_id,
            status="failed",
            media_url=media_urls[0],
            media_urls=media_urls,
            summary=result["error"]
        )
    
    return AnalysisResult(
        task_id=task_id,
        status="completed",
        media_url=media_urls[0],
        media_urls=media_urls,
        **result
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
