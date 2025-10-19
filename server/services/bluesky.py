import requests
from datetime import datetime
import os
from dotenv import load_dotenv
import time
from typing import List, Dict, Set, Optional, Tuple
import json
import langdetect

load_dotenv()

DISASTER_HASHTAGS = {
    "earthquake": ["#earthquake", "#quake", "#seismic"],
    "hurricane": ["#hurricane", "#cyclone", "#tropicalstorm"],
    "flood": ["#flood", "#flooding", "#flashflood"],
    "wildfire": ["#wildfire", "#forestfire", "#bushfire"],
    "tornado": ["#tornado", "#twister"]
}

class BlueskyAPI:
    def __init__(self):
        self.username = os.getenv("BlueSky_Username")
        self.password = os.getenv("BlueSky_Password")
        self.base_url = "https://bsky.social/xrpc"
        self.session_data = None
        self.headers = None
        
    def create_session(self) -> None:
        """Create a new Bluesky session"""
        response = requests.post(
            f"{self.base_url}/com.atproto.server.createSession",
            json={"identifier": self.username, "password": self.password}
        )
        response.raise_for_status()
        self.session_data = response.json()
        self.headers = {"Authorization": f"Bearer {self.session_data['accessJwt']}"}

    def get_post_details(self, post_uri: str) -> Optional[Dict]:
        """Get detailed information about a specific post"""
        if not self.headers:
            self.create_session()

        response = requests.get(
            f"{self.base_url}/app.bsky.feed.getPosts",
            headers=self.headers,
            params={"uris": [post_uri]}
        )
        response.raise_for_status()
        posts = response.json().get("posts", [])
        return posts[0] if posts else None

    def get_profile(self, actor: str) -> Optional[Dict]:
        """Get detailed profile information for a user"""
        if not self.headers:
            self.create_session()

        response = requests.get(
            f"{self.base_url}/app.bsky.actor.getProfile",
            headers=self.headers,
            params={"actor": actor}
        )
        response.raise_for_status()
        return response.json()

    def get_post_thread(self, post_uri: str) -> Optional[Dict]:
        """Get thread information for a post"""
        if not self.headers:
            self.create_session()

        response = requests.get(
            f"{self.base_url}/app.bsky.feed.getPostThread",
            headers=self.headers,
            params={"uri": post_uri}
        )
        response.raise_for_status()
        return response.json().get("thread", {})

def extract_urls(text: str) -> List[str]:
    """Extract URLs from post text"""
    import re
    url_pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
    return re.findall(url_pattern, text)

def extract_hashtags(text: str) -> List[str]:
    """Extract hashtags from post text"""
    import re
    hashtag_pattern = r'#\w+'
    return re.findall(hashtag_pattern, text)

def extract_mentions(text: str) -> List[str]:
    """Extract mentions from post text"""
    import re
    mention_pattern = r'@\w+'
    return re.findall(mention_pattern, text)

def detect_language(text: str) -> str:
    """Detect the language of the post text"""
    try:
        return langdetect.detect(text)
    except:
        return "unknown"

def enrich_post_data(post: Dict, api: BlueskyAPI) -> Dict:
    """Enrich post data with additional information"""
    # Get detailed post information
    post_uri = post.get("uri")
    post_details = api.get_post_details(post_uri)
    
    # Get author profile information
    author = post.get("author", {}).get("handle")
    if author:
        profile = api.get_profile(author)
    else:
        profile = {}
    
    # Get thread context if it's a reply
    thread_info = {}
    if "reply" in post.get("record", {}):
        thread_info = api.get_post_thread(post_uri)

    # Extract engagement metrics
    engagement = {
        "like_count": post.get("likeCount", 0),
        "repost_count": post.get("repostCount", 0),
        "reply_count": post.get("replyCount", 0),
    }

    # Extract media information
    embed = post.get("embed", {})
    has_media = bool(embed.get("images") or embed.get("media"))
    media_items = embed.get("images", []) or embed.get("media", [])
    media_urls = [item.get("thumb", "") for item in media_items if item.get("thumb")]

    # Get text content
    text = post.get("text") or post.get("record", {}).get("text", "")

    # Extract various metadata
    enriched_data = {
        # Basic post info
        "uri": post_uri,
        "text": text,
        "created_at": post.get("record", {}).get("createdAt"),
        "indexed_at": post.get("indexedAt"),

        # Engagement metrics
        **engagement,

        # Author profile info
        "author_handle": author,
        "author_display_name": profile.get("displayName"),
        "author_description": profile.get("description"),
        "author_followers_count": profile.get("followersCount"),
        "author_following_count": profile.get("followsCount"),
        "author_posts_count": profile.get("postsCount"),
        "author_avatar_url": profile.get("avatar"),

        # Media information
        "has_media": has_media,
        "media_count": len(media_urls),
        "media_urls": media_urls,

        # Extracted content
        "hashtags": extract_hashtags(text),
        "mentions": extract_mentions(text),
        "external_urls": extract_urls(text),
        "language": detect_language(text),

        # Content labels/warnings
        "content_labels": post.get("labels", []),
        "content_warnings": [],  # To be filled if present
        "moderation_status": "active",  # Default status

        # Reply context
        "reply_to_post_id": thread_info.get("parent", {}).get("uri"),
        "reply_root_post_id": thread_info.get("root", {}).get("uri"),
        "thread_depth": thread_info.get("depth", 0),

        # Original raw data
        "raw_data": post
    }

    return enriched_data

def fetch_posts(hashtag: str = None, seen_ids: Set[str] = None, session_data: Dict = None) -> Tuple[List[Dict], Set[str], Dict]:
    """Fetch posts from BlueSky based on hashtag, with deduplication and enriched data
    
    Args:
        hashtag: Optional specific hashtag to search. If None, defaults to #earthquake
        seen_ids: Set of already seen post IDs for deduplication
        session_data: Reuse existing session data to avoid extra login calls

    Returns:
        Tuple of (unique posts list, updated seen_ids set, session data)
    """
    POST_LIMIT = int(os.getenv("POST_LIMIT", "50"))
    
    seen_ids = seen_ids or set()
    search_hashtag = hashtag if hashtag else DISASTER_HASHTAGS["earthquake"][0]
    
    # Initialize API client
    api = BlueskyAPI()
    if session_data:
        api.session_data = session_data
        api.headers = {"Authorization": f"Bearer {session_data['accessJwt']}"}
    else:
        api.create_session()
        session_data = api.session_data

    # Search for posts
    response = requests.get(
        f"{api.base_url}/app.bsky.feed.searchPosts",
        headers=api.headers,
        params={"q": search_hashtag, "limit": POST_LIMIT}
    )
    response.raise_for_status()
    all_posts = response.json().get("posts", [])
    
    # Process and enrich unique posts
    unique_posts = []
    for post in all_posts:
        post_uri = post.get("uri")
        if post_uri and post_uri not in seen_ids:
            seen_ids.add(post_uri)
            enriched_post = enrich_post_data(post, api)
            unique_posts.append(enriched_post)
            time.sleep(0.5)  # Small delay between API calls

    print(f"[{datetime.now()}] Fetched {len(all_posts)} posts from BlueSky for {search_hashtag}")
    print(f"📋 Found {len(unique_posts)} unique posts (filtered {len(all_posts) - len(unique_posts)} duplicates)")
    
    return unique_posts, seen_ids, session_data

