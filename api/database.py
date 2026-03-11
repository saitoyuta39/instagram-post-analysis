from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

def get_supabase_client() -> Client:
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise ValueError("SUPABASE_URL or SUPABASE_KEY is missing in .env")
    return create_client(url, key)

def save_analysis_result(user_id: str, media_id: str, result: dict):
    """診断結果を Supabase に保存する。"""
    supabase = get_supabase_client()
    data = {
        "user_id": user_id,
        "media_id": media_id,
        "score": result["score"],
        "summary": result["summary"],
        "feedbacks": result["feedbacks"],
        "action_plan": result["action_plan"]
    }
    response = supabase.table("diagnostic_history").insert(data).execute()
    return response.data

def search_knowledge_base(query_embedding: list[float]):
    """pgvector を使用したナレッジの類似検索を行う。"""
    supabase = get_supabase_client()
    # rpc (Remote Procedure Call) を呼び出す例
    response = supabase.rpc(
        "match_knowledge", 
        {"query_embedding": query_embedding, "match_threshold": 0.8, "match_count": 5}
    ).execute()
    return response.data

