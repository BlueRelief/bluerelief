import requests
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

def fetch_posts():
    """Fetch posts from BlueSky based on hashtag"""
    BLUESKY_USERNAME = os.getenv("BlueSky_Username")
    BLUESKY_PASSWORD = os.getenv("BlueSky_Password")
    SEARCH_HASHTAG = os.getenv("SEARCH_HASHTAG", "#earthquake")
    POST_LIMIT = int(os.getenv("POST_LIMIT", "50"))
    
    if not BLUESKY_USERNAME or not BLUESKY_PASSWORD:
        raise ValueError("BlueSky credentials not found in environment variables")
    
    response = requests.post(
        "https://bsky.social/xrpc/com.atproto.server.createSession",
        json={"identifier": BLUESKY_USERNAME, "password": BLUESKY_PASSWORD}
    )
    response.raise_for_status()
    session_data = response.json()
    access_token = session_data["accessJwt"]

    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"q": SEARCH_HASHTAG, "limit": POST_LIMIT}

    response = requests.get(
        "https://bsky.social/xrpc/app.bsky.feed.searchPosts",
        headers=headers,
        params=params
    )
    response.raise_for_status()
    posts = response.json().get("posts", [])

    print(f"[{datetime.now()}] Fetched {len(posts)} posts from BlueSky")
    for idx, post in enumerate(posts, 1):
        text = post["record"]["text"]
        print(f"{idx}. {text[:100]}...")
    
    return posts

