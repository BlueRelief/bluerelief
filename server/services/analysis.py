import google.generativeai as genai
from datetime import datetime
import os
from dotenv import load_dotenv
import time
import asyncio
from typing import List, Dict, Any, Optional
import json
import re
import requests
import base64
from io import BytesIO
from PIL import Image
from services.geocoding_service import geocode_region

load_dotenv()

# SHOWCASE_MODE: When enabled, skip all Gemini API calls
SHOWCASE_MODE = os.getenv("SHOWCASE_MODE", "true").lower() == "true"

# Rate limiter for Gemini API (default 15 RPM for free tier, adjust based on your quota)
GEMINI_RPM = int(os.getenv("GEMINI_RPM", "15"))
GEMINI_CONCURRENT_WORKERS = int(os.getenv("GEMINI_CONCURRENT_WORKERS", "3"))


class RateLimiter:
    """Token bucket rate limiter for API calls"""
    def __init__(self, rpm: int):
        self.rpm = rpm
        self.interval = 60.0 / rpm  # seconds between requests
        self.last_request = 0
        self._lock = asyncio.Lock()
    
    async def acquire(self):
        async with self._lock:
            now = time.time()
            wait_time = self.last_request + self.interval - now
            if wait_time > 0:
                await asyncio.sleep(wait_time)
            self.last_request = time.time()


rate_limiter = RateLimiter(GEMINI_RPM)


def download_image(url: str, max_size: int = 1024) -> Optional[Dict]:
    """Download and prepare image for Gemini vision API.

    Args:
        url: Image URL to download
        max_size: Max dimension to resize to (saves tokens)

    Returns:
        Dict with mime_type and data for Gemini, or None if failed
    """
    try:
        headers = {"User-Agent": "BlueRelief/1.0 (Crisis Monitoring Service)"}
        response = requests.get(url, timeout=10, headers=headers)
        response.raise_for_status()

        # Open and resize image
        img = Image.open(BytesIO(response.content))

        # Convert to RGB if needed (for PNG with transparency)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Resize if too large
        if max(img.size) > max_size:
            ratio = max_size / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)

        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        img_data = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return {"mime_type": "image/jpeg", "data": img_data}
    except Exception as e:
        print(f"⚠️  Failed to download image {url[:50]}...: {e}")
        return None


def normalize_event_time(time_str: str) -> Optional[datetime]:
    """Normalize event time from AI analysis to datetime object

    AI now returns ONLY ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ), so this is much simpler.
    Just handles parsing and timezone conversion.

    Args:
        time_str: ISO 8601 timestamp string from AI

    Returns:
        datetime object or None if unable to parse
    """
    if not time_str or not isinstance(time_str, str):
        return None

    time_str = time_str.strip()

    try:
        # Handle both uppercase and lowercase ISO 8601
        normalized = time_str.upper()
        # Convert Z to +00:00 for Python's fromisoformat
        parsed = datetime.fromisoformat(normalized.replace("Z", "+00:00"))
        return parsed
    except (ValueError, AttributeError) as e:
        print(f"⚠️ Failed to parse event_time: {time_str} - {e}")
        return None


def clean_json_response(text: str) -> str:
    """Clean JSON response from AI model by removing markdown and code blocks

    Args:
        text: Raw response from AI model

    Returns:
        Cleaned JSON string
    """

    # Remove markdown code block markers
    text = re.sub(r'```\s*json\s*', '', text)
    text = re.sub(r'```', '', text)

    # Remove leading/trailing whitespace
    text = text.strip()

    # Try to find the actual JSON content
    json_match = re.search(r'(\[[\s\S]*\]|\{[\s\S]*\})', text)
    if json_match:
        text = json_match.group(1)

    # Validate JSON structure
    try:
        import json
        parsed = json.loads(text)
        return json.dumps(parsed)  # Re-serialize to ensure clean JSON
    except json.JSONDecodeError as e:
        print(f"⚠️ JSON validation failed: {str(e)}")
        print(f"Content was: {text[:200]}...")
        return text  # Return cleaned but invalid JSON for retry logic

    return text

def process_batch_with_retry(model, prompt: str, batch_num: int, max_retries: int = 3, delay: int = 2) -> Optional[Any]:
    """Process a batch with retry logic
    
    Args:
        model: The AI model to use
        prompt: The prompt to send
        batch_num: Current batch number (for logging)
        max_retries: Maximum number of retry attempts
        delay: Delay between retries in seconds
    
    Returns:
        Parsed JSON response or None if all retries fail
    """
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                print(f"🔄 Retry attempt {attempt + 1}/{max_retries} for batch {batch_num}")
                time.sleep(delay * attempt)  # Exponential backoff
                
            response = model.generate_content(prompt)
            result = clean_json_response(response.text)
            
            try:
                parsed = json.loads(result)
                if not parsed:  # Check if empty object/array
                    raise ValueError("Empty response")
                return parsed
            except (json.JSONDecodeError, ValueError) as e:
                print(f"⚠️ Invalid JSON in batch {batch_num} (attempt {attempt + 1}): {str(e)}")
                print(f"Response was: {result[:200]}...")
                if attempt == max_retries - 1:
                    return None
                continue
                
        except Exception as e:
            print(f"⚠️ Error in batch {batch_num} (attempt {attempt + 1}): {str(e)}")
            if attempt == max_retries - 1:
                print(f"❌ All retries failed for batch {batch_num}")
                return None
            continue
            
    return None

def _prepare_batch_prompt(batch_posts: List[Dict], start_idx: int, now: datetime) -> tuple:
    """Prepare prompt and images for a batch of posts"""
    posts_lines = []
    batch_images = []

    for idx, post in enumerate(batch_posts, start_idx + 1):
        text = post.get("text") or post.get("record", {}).get("text", "")
        post_id = post.get("db_post_id", "unknown")

        media = post.get("media", {})
        image_urls = media.get("urls", []) if isinstance(media, dict) else []

        line = f"{idx}. [POST_ID: {post_id}] {text}"

        if image_urls and len(batch_images) < 10:
            for img_url in image_urls[:2]:
                img_data = download_image(img_url)
                if img_data:
                    batch_images.append(
                        {"post_id": post_id, "post_idx": idx, "image": img_data}
                    )
                    line += f"\n   [HAS_IMAGE_{len(batch_images)}]"

        posts_lines.append(line)

    posts_text = "\n".join(posts_lines)

    prompt = (
        f"CURRENT TIME (UTC): {now.isoformat()}Z\n\n"
        "Analyze these social media posts about disasters and extract structured information. "
        "Some posts have attached images marked as [HAS_IMAGE_N] - I'm also providing these images below. "
        "Use BOTH the text AND images to extract disaster details. Images often contain headlines, news graphics, or photos showing the disaster. "
        "For each disaster mentioned, return a JSON array with objects containing:\n"
        "- post_id: the database post ID from the [POST_ID: X] marker (MUST be an integer or null)\n"
        "- location_name: the SPECIFIC place name (e.g., 'Los Angeles, California, USA', 'Tokyo, Japan', 'Manila, Philippines'). "
        "Include city/region, state/province, and country. Must be a real, geocodable location.\n"
        "- event_time: **ONLY ISO 8601 format YYYY-MM-DDTHH:MM:SSZ** when the disaster occurred. "
        "CRITICAL: Only extract CURRENT/RECENT disasters (within the last 30 days). "
        "If a post mentions a HISTORICAL disaster (years/decades ago), SKIP IT entirely. "
        "If the exact time is unknown, use the current time. "
        "NEVER use vague terms like 'next week', 'upcoming', 'ongoing', 'recently', etc.\n"
        "- disaster_type: MUST be exactly ONE of these 8 values (lowercase): "
        "earthquake, flood, wildfire, hurricane, tornado, tsunami, volcano, heatwave. "
        "Pick ONE. No combinations.\n"
        "- severity: rate 1-5 (1=minor, 5=catastrophic)\n"
        "- magnitude: single numerical value if applicable, null otherwise\n"
        "- description: DETAILED summary (at least 50 characters) with specific facts like casualties, damage, evacuations. "
        "Do NOT just say 'Flood in Indonesia' - include actual details from the post.\n"
        "- affected_population: estimate number of people affected. "
        "Look for mentions like 'X families evacuated', 'Y people without power'. "
        "Convert to individual counts (1 family ≈ 4 people, 1 home ≈ 3 people). "
        "Provide best-effort estimates: neighborhood=5000, city block=500, building=50, regional=50000. "
        "Return null if completely unknown.\n\n"
        "CRITICAL LOCATION RULES:\n"
        "1. NEVER use vague locations like 'Worldwide', 'Global', 'Asia', 'Europe', 'Unknown', 'Undisclosed'\n"
        "2. If a disaster affects MULTIPLE COUNTRIES, create SEPARATE entries for each country with specific locations\n"
        "   Example: 'Floods in Thailand and Indonesia' → two entries: 'Bangkok, Thailand' AND 'Jakarta, Indonesia'\n"
        "3. If no specific location is mentioned, SKIP that disaster entirely - do not include it\n"
        "4. Use the most specific location possible (city > state > country)\n"
        "5. For ocean/offshore events, use nearest coastal city (e.g., 'Offshore Ecuador' → 'Salinas, Ecuador')\n\n"
        "DISASTER TYPE MAPPING:\n"
        "- bushfire/forest fire → wildfire\n"
        "- flash flood/flooding → flood\n"
        "- cyclone/typhoon/tropical storm → hurricane\n"
        "- twister → tornado\n"
        "- quake/tremor → earthquake\n"
        "- eruption → volcano\n"
        "- heat wave/extreme heat → heatwave\n\n"
        f"Posts:\n{posts_text}\n\n"
        "Return ONLY valid JSON. DO NOT include latitude/longitude - we will geocode the location_name separately."
    )

    return prompt, batch_images


async def _process_single_batch(
    model, batch_num: int, batch_posts: List[Dict], start_idx: int, now: datetime, total_batches: int
) -> List[Dict]:
    """Process a single batch with rate limiting"""
    await rate_limiter.acquire()
    
    print(f"\n📦 Processing batch {batch_num + 1}/{total_batches} ({len(batch_posts)} posts)")
    
    prompt, batch_images = _prepare_batch_prompt(batch_posts, start_idx, now)
    
    if batch_images:
        print(f"📷 Downloaded {len(batch_images)} images for vision analysis")

    try:
        content_parts = [prompt]
        if batch_images:
            for img_info in batch_images:
                content_parts.append({"inline_data": img_info["image"]})

        response = model.generate_content(content_parts)
        cleaned_response = clean_json_response(response.text)

        try:
            batch_disasters = json.loads(cleaned_response)
            if isinstance(batch_disasters, list):
                print(f"✅ Extracted {len(batch_disasters)} disasters from batch {batch_num + 1}")
                return batch_disasters
            else:
                print(f"⚠️ Invalid response format in batch {batch_num + 1}")
                return []
        except json.JSONDecodeError:
            print(f"⚠️ Failed to parse JSON from batch {batch_num + 1}")
            print(f"Response was: {cleaned_response[:200]}...")
            return []

    except Exception as e:
        print(f"⚠️ Error processing batch {batch_num + 1}: {str(e)}")
        return []


async def _process_batches_concurrent(
    model, posts: List[Dict], batch_size: int, now: datetime
) -> List[Dict]:
    """Process all batches concurrently with rate limiting"""
    total_batches = (len(posts) + batch_size - 1) // batch_size
    
    tasks = []
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min((batch_num + 1) * batch_size, len(posts))
        batch_posts = posts[start_idx:end_idx]
        
        task = _process_single_batch(
            model, batch_num, batch_posts, start_idx, now, total_batches
        )
        tasks.append(task)
    
    # Process with limited concurrency using semaphore
    semaphore = asyncio.Semaphore(GEMINI_CONCURRENT_WORKERS)
    
    async def limited_task(task):
        async with semaphore:
            return await task
    
    results = await asyncio.gather(*[limited_task(t) for t in tasks])
    
    all_disasters = []
    for result in results:
        if result:
            all_disasters.extend(result)
    
    return all_disasters


def analyze_posts(posts: List[Dict], batch_size: int = 50, batch_delay: int = 1) -> str:
    """Process posts with Gemini AI for disaster extraction in batches with concurrent processing

    Args:
        posts: List of posts to analyze (should include db_post_id if available)
        batch_size: Number of posts to process in each batch (default: 50)
        batch_delay: Delay between batches in seconds (default: 1, used for fallback)

    Returns:
        JSON string containing array of extracted disasters with source post_ids
    """
    # SHOWCASE MODE: Skip all Gemini analysis
    if SHOWCASE_MODE:
        print("🎭 SHOWCASE MODE: Skipping Gemini analysis")
        return "[]"

    if not posts:
        print("No posts to process")
        return "[]"

    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")

    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

    total_batches = (len(posts) + batch_size - 1) // batch_size
    now = datetime.utcnow()

    print(f"\n🔄 Processing {len(posts)} posts in {total_batches} batches of {batch_size}...")
    print(f"⚡ Concurrent workers: {GEMINI_CONCURRENT_WORKERS}, Rate limit: {GEMINI_RPM} RPM")

    # Run concurrent processing
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    all_disasters = loop.run_until_complete(
        _process_batches_concurrent(model, posts, batch_size, now)
    )

    if all_disasters:
        # Filter out vague/invalid locations before geocoding
        vague_terms = [
            "worldwide",
            "global",
            "unknown",
            "undisclosed",
            "various",
            "multiple",
        ]
        valid_disasters = []
        skipped = 0

        for disaster in all_disasters:
            location = (disaster.get("location_name") or "").strip().lower()
            if not location or any(term in location for term in vague_terms):
                skipped += 1
                continue
            valid_disasters.append(disaster)

        if skipped:
            print(f"⏭️  Skipped {skipped} disasters with vague/missing locations")

        # Geocode locations to get accurate coordinates
        print(f"\n🌍 Geocoding {len(valid_disasters)} disaster locations...")
        geocoded_disasters = []

        for disaster in valid_disasters:
            location_name = disaster.get("location_name")
            geo_result = geocode_region(location_name)

            if geo_result and geo_result.get("lat") and geo_result.get("lng"):
                disaster["latitude"] = geo_result["lat"]
                disaster["longitude"] = geo_result["lng"]
                geocoded_disasters.append(disaster)
            else:
                print(f"⚠️  Failed to geocode: {location_name[:50]}")

        print(f"✅ Geocoded {len(geocoded_disasters)}/{len(valid_disasters)} locations")

        if not geocoded_disasters:
            print("⚠️  No disasters with valid coordinates")
            return "[]"

        final_json = json.dumps(geocoded_disasters, indent=2)
        print(
            f"\n[{datetime.now()}] AI Analysis Complete - Found {len(geocoded_disasters)} disasters with coordinates"
        )
        return final_json

    return "[]"


async def _process_sentiment_batch(
    model, batch_num: int, batch_posts: List[Dict], start_idx: int, total_batches: int
) -> Dict:
    """Process a single sentiment batch with rate limiting"""
    await rate_limiter.acquire()
    
    print(f"\n📦 Processing sentiment batch {batch_num + 1}/{total_batches} ({len(batch_posts)} posts)")

    posts_text = "\n".join(
        [
            f"{idx}. [ID: {post.get('uri', '')}] {post.get('text') or post.get('record', {}).get('text', '')}"
            for idx, post in enumerate(batch_posts, start_idx + 1)
        ]
    )

    prompt = (
        "Analyze the sentiment of each social media post about disasters. "
        "For each post, determine:\n"
        "1. sentiment: 'positive', 'negative', 'neutral', 'urgent', or 'fearful'\n"
        "2. sentiment_score: a float from -1.0 (most negative/fearful) to 1.0 (most positive)\n\n"
        "Consider:\n"
        "- 'urgent' for time-sensitive warnings or alerts\n"
        "- 'fearful' for posts expressing panic or distress\n"
        "- 'negative' for sad or concerning news\n"
        "- 'neutral' for factual reporting\n"
        "- 'positive' for relief updates or good news\n\n"
        f"Posts:\n{posts_text}\n\n"
        "Return a JSON object where keys are the post IDs (the URI after 'ID:') and values are objects with 'sentiment' and 'sentiment_score'.\n"
        'Example: {"at://did:plc:xyz/app.bsky.feed.post/abc": {"sentiment": "urgent", "sentiment_score": -0.7}}\n'
        "Return ONLY valid JSON, no other text."
    )

    batch_results = process_batch_with_retry(model, prompt, batch_num + 1)
    if batch_results and isinstance(batch_results, dict):
        print(f"✅ Analyzed sentiment for {len(batch_results)} posts in batch {batch_num + 1}")
        return batch_results
    return {}


async def _process_sentiment_concurrent(
    model, posts: List[Dict], batch_size: int
) -> Dict:
    """Process all sentiment batches concurrently with rate limiting"""
    total_batches = (len(posts) + batch_size - 1) // batch_size
    
    tasks = []
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min((batch_num + 1) * batch_size, len(posts))
        batch_posts = posts[start_idx:end_idx]
        
        task = _process_sentiment_batch(
            model, batch_num, batch_posts, start_idx, total_batches
        )
        tasks.append(task)
    
    semaphore = asyncio.Semaphore(GEMINI_CONCURRENT_WORKERS)
    
    async def limited_task(task):
        async with semaphore:
            return await task
    
    results = await asyncio.gather(*[limited_task(t) for t in tasks])
    
    all_sentiments = {}
    for result in results:
        if result:
            all_sentiments.update(result)
    
    return all_sentiments


def analyze_sentiment(posts: List[Dict], batch_size: int = 50, batch_delay: int = 1) -> str:
    """Analyze sentiment for each post using Gemini AI in batches with concurrent processing
    
    Args:
        posts: List of posts to analyze
        batch_size: Number of posts to process in each batch (default: 50)
        batch_delay: Delay between batches in seconds (default: 1, used for fallback)
        
    Returns:
        JSON string containing sentiment analysis results
    """
    # SHOWCASE MODE: Skip all Gemini analysis
    if SHOWCASE_MODE:
        print("🎭 SHOWCASE MODE: Skipping sentiment analysis")
        return "{}"

    if not posts:
        return "{}"

    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")

    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

    total_batches = (len(posts) + batch_size - 1) // batch_size

    print(f"\n🔄 Processing sentiment for {len(posts)} posts in {total_batches} batches of {batch_size}...")
    print(f"⚡ Concurrent workers: {GEMINI_CONCURRENT_WORKERS}, Rate limit: {GEMINI_RPM} RPM")

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    all_sentiments = loop.run_until_complete(
        _process_sentiment_concurrent(model, posts, batch_size)
    )

    if all_sentiments:
        final_json = json.dumps(all_sentiments, indent=2)
        print(f"\n[{datetime.now()}] Sentiment Analysis Complete - Analyzed {len(all_sentiments)} posts")
        return final_json

    return "{}"
