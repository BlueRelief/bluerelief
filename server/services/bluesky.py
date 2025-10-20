import requests
from datetime import datetime
import os
from dotenv import load_dotenv
import time
from typing import List, Dict, Set, Optional, Tuple
import json
import langdetect
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

load_dotenv()

DEFAULT_TIMEOUT = int(os.getenv("BLUESKY_TIMEOUT_SECONDS", "10"))
USER_AGENT = "BlueRelief/1.0 (+https://github.com/BlueRelief)"

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
        if not self.username or not self.password:
            raise ValueError("Missing BlueSky_Username/BlueSky_Password environment variables")
        self.base_url = "https://bsky.social/xrpc"
        self.session_data = None
        self.headers = None
        self.http = requests.Session()
        retry = Retry(total=3, backoff_factor=0.5, status_forcelist=(429, 500, 502, 503, 504))
        self.http.mount("https://", HTTPAdapter(max_retries=retry))
        self.http.headers.update({"User-Agent": USER_AGENT})
        
    def create_session(self) -> None:
        """Create a new Bluesky session"""
        response = self.http.post(
            f"{self.base_url}/com.atproto.server.createSession",
            json={"identifier": self.username, "password": self.password},
            timeout=DEFAULT_TIMEOUT,
        )
        response.raise_for_status()
        self.session_data = response.json()
        self.headers = {"Authorization": f"Bearer {self.session_data['accessJwt']}"}
        self.http.headers.update(self.headers)

    def get_post_details(self, post_uri: str) -> Optional[Dict]:
        """Get detailed information about a specific post"""
        if not self.headers:
            self.create_session()

        response = self.http.get(
            f"{self.base_url}/app.bsky.feed.getPosts",
            headers=self.headers,
            params={"uris": [post_uri]},
            timeout=DEFAULT_TIMEOUT,
        )
        response.raise_for_status()
        posts = response.json().get("posts", [])
        return posts[0] if posts else None

    def get_profile(self, actor: str) -> Optional[Dict]:
        """Get detailed profile information for a user"""
        if not self.headers:
            self.create_session()

        response = self.http.get(
            f"{self.base_url}/app.bsky.actor.getProfile",
            headers=self.headers,
            params={"actor": actor},
            timeout=DEFAULT_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()

    def get_post_thread(self, post_uri: str) -> Optional[Dict]:
        """Get thread information for a post"""
        if not self.headers:
            self.create_session()

        response = self.http.get(
            f"{self.base_url}/app.bsky.feed.getPostThread",
            headers=self.headers,
            params={"uri": post_uri},
            timeout=DEFAULT_TIMEOUT,
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
        return langdetect.detect(text or "")
    except langdetect.lang_detect_exception.LangDetectException:
        return "und"

def enrich_post_data(post: Dict, api: BlueskyAPI) -> Dict:
    """Enrich post data with additional information"""
    # Basic post reference
    post_uri = post.get("uri")

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
        "record": post.get("record", {}),
        "indexedAt": post.get("indexedAt"),
        # Engagement metrics (nested under "engagement")
        "engagement": {
            "likes": post.get("likeCount", 0),
            "reposts": post.get("repostCount", 0),
            "replies": post.get("replyCount", 0),
        },
        # Author profile info (nested under "author")
        "author": {
            "handle": author,
            "display_name": profile.get("displayName"),
            "description": profile.get("description"),
            "followers_count": profile.get("followersCount"),
            "following_count": profile.get("followsCount"),
            "posts_count": profile.get("postsCount"),
            "avatar_url": profile.get("avatar"),
        },
        # Media information (nested under "media")
        "media": {
            "has_media": has_media,
            "count": len(media_urls),
            "urls": media_urls,
        },
        # Content analysis (nested under "content")
        "content": {
            "hashtags": extract_hashtags(text),
            "mentions": extract_mentions(text),
            "external_urls": extract_urls(text),
            "language": detect_language(text),
        },
        # Labels/warnings (nested under "moderation")
        "moderation": {
            "labels": post.get("labels", []),
            "warnings": [],
            "status": "active",
        },
        # Reply context (nested under "thread")
        "thread": {
            "parent_uri": thread_info.get("parent", {}).get("uri"),
            "root_uri": thread_info.get("root", {}).get("uri"),
            "depth": thread_info.get("depth", 0),
        },
        # Location information (nested under "location")
        "location": {
            "name": None,
            "latitude": None,
            "longitude": None,
        },
        # Original raw data
        "raw_data": post,
    }

    return enriched_data

def fetch_posts(hashtag: str = None, seen_ids: Set[str] = None, session_data: Dict = None, include_enhanced: bool = True) -> Tuple[List[Dict], Set[str], Dict]:
    """Fetch posts from BlueSky based on hashtag, with deduplication and optional enriched data
    
    Args:
        hashtag: Optional specific hashtag to search. If None, defaults to #earthquake
        seen_ids: Set of already seen post IDs for deduplication
        session_data: Reuse existing session data to avoid extra login calls
        include_enhanced: Whether to collect enhanced post data (profile info, engagement, etc.)

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
    response = api.http.get(
        f"{api.base_url}/app.bsky.feed.searchPosts",
        headers=api.headers,
        params={"q": search_hashtag, "limit": POST_LIMIT},
        timeout=DEFAULT_TIMEOUT,
    )
    response.raise_for_status()
    all_posts = response.json().get("posts", [])
    
    # Process and enrich unique posts
    unique_posts = []
    for post in all_posts:
        post_uri = post.get("uri")
        if post_uri and post_uri not in seen_ids:
            seen_ids.add(post_uri)
            if include_enhanced:
                enriched_post = enrich_post_data(post, api)
                unique_posts.append(enriched_post)
            else:
                unique_posts.append(post)
            time.sleep(0.5)  # Small delay between API calls

    print(f"[{datetime.now()}] Fetched {len(all_posts)} posts from BlueSky for {search_hashtag}")
    print(f"📋 Found {len(unique_posts)} unique posts (filtered {len(all_posts) - len(unique_posts)} duplicates)")
    
    return unique_posts, seen_ids, session_data
