import requests
import os
from typing import List, Dict, Any

class InstagramClient:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://graph.facebook.com/v21.0"

    def get_user_media(self, user_id: str) -> List[Dict[str, Any]]:
        """
        ユーザーのメディア（画像・動画）を取得する。
        """
        url = f"{self.base_url}/{user_id}/media"
        params = {
            "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp",
            "access_token": self.access_token
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json().get("data", [])

    def get_media_details(self, media_id: str) -> Dict[str, Any]:
        """
        個別のメディア詳細（インサイト含む）を取得する。
        """
        url = f"{self.base_url}/{media_id}"
        params = {
            "fields": "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,insights{name,values}",
            "access_token": self.access_token
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()

# 使用例
# client = InstagramClient(os.getenv("INSTAGRAM_ACCESS_TOKEN"))
# media_list = client.get_user_media("me")

