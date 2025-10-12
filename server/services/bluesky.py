import requests
from datetime import datetime
import os
from dotenv import load_dotenv
import time
from typing import List, Dict

load_dotenv()

DISASTER_HASHTAGS = {
    "earthquake": ["#earthquake", "#quake", "#seismic"],
    "hurricane": ["#hurricane", "#cyclone", "#tropicalstorm"],
    "flood": ["#flood", "#flooding", "#flashflood"],
    "wildfire": ["#wildfire", "#forestfire", "#bushfire"],
    "tornado": ["#tornado", "#twister"]
}

def fetch_posts(hashtag: str = None, seen_ids: set = None, session_data: Dict = None) -> tuple[List[Dict], set, Dict]:
    """Fetch posts from BlueSky based on hashtag, with deduplication
    
    Args:
        hashtag: Optional specific hashtag to search. If None, defaults to #earthquake
        seen_ids: Set of already seen post IDs for deduplication
        session_data: Reuse existing session data to avoid extra login calls

    Returns:
        Tuple of (unique posts list, updated seen_ids set, session data)
    """
    BLUESKY_USERNAME = os.getenv("BlueSky_Username")
    BLUESKY_PASSWORD = os.getenv("BlueSky_Password")
    POST_LIMIT = int(os.getenv("POST_LIMIT", "50"))
    
    if not BLUESKY_USERNAME or not BLUESKY_PASSWORD:
        raise ValueError("BlueSky credentials not found in environment variables")
        
    seen_ids = seen_ids or set()  # Initialize if not provided
    
    search_hashtag = hashtag if hashtag else DISASTER_HASHTAGS["earthquake"][0]  # Default to first earthquake hashtag
    
    # Reuse existing session if provided
    if not session_data:
        response = requests.post(
            "https://bsky.social/xrpc/com.atproto.server.createSession",
            json={"identifier": BLUESKY_USERNAME, "password": BLUESKY_PASSWORD}
        )
        response.raise_for_status()
        session_data = response.json()
    access_token = session_data["accessJwt"]

    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"q": search_hashtag, "limit": POST_LIMIT}

    response = requests.get(
        "https://bsky.social/xrpc/app.bsky.feed.searchPosts",
        headers=headers,
        params=params
    )
    response.raise_for_status()
    all_posts = response.json().get("posts", [])
    
    # Deduplicate posts based on URI
    unique_posts = []
    for post in all_posts:
        post_id = post.get("uri")
        if post_id and post_id not in seen_ids:
            seen_ids.add(post_id)
            unique_posts.append(post)

    print(f"[{datetime.now()}] Fetched {len(all_posts)} posts from BlueSky for {search_hashtag}")
    print(f"📋 Found {len(unique_posts)} unique posts (filtered {len(all_posts) - len(unique_posts)} duplicates)")
    
    # Add small delay to respect API
    time.sleep(1)
    
    return unique_posts, seen_ids, session_data

