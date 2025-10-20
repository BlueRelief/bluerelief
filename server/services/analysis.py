import google.generativeai as genai
from datetime import datetime
import os
from dotenv import load_dotenv
import time
from typing import List, Dict, Any, Optional
import json
import re

load_dotenv()


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

def analyze_posts(posts: List[Dict], batch_size: int = 50, batch_delay: int = 1) -> str:
    """Process posts with Gemini AI for disaster extraction in batches

    Args:
        posts: List of posts to analyze (should include db_post_id if available)
        batch_size: Number of posts to process in each batch (default: 50)
        batch_delay: Delay between batches in seconds (default: 1)

    Returns:
        JSON string containing array of extracted disasters with source post_ids
    """
    if not posts:
        print("No posts to process")
        return "[]"

    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")

    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

    all_disasters = []
    total_batches = (len(posts) + batch_size - 1) // batch_size
    now = datetime.utcnow()

    print(f"\n🔄 Processing {len(posts)} posts in {total_batches} batches of {batch_size}...")

    for batch_num in range(total_batches):
        # Add delay between batches except for the first one
        if batch_num > 0:
            print(f"⏳ Waiting {batch_delay}s before next batch...")
            time.sleep(batch_delay)

        start_idx = batch_num * batch_size
        end_idx = min((batch_num + 1) * batch_size, len(posts))
        batch_posts = posts[start_idx:end_idx]

        print(f"\n📦 Processing batch {batch_num + 1}/{total_batches} ({len(batch_posts)} posts)")

        # Build prompt with post IDs included
        posts_text = "\n".join(
            [
                f"{idx}. [POST_ID: {post.get('db_post_id', 'unknown')}] {post.get('text') or post.get('record', {}).get('text', '')}"
                for idx, post in enumerate(batch_posts, start_idx + 1)
            ]
        )

        prompt = (
            f"CURRENT TIME (UTC): {now.isoformat()}Z\n\n"
            "Analyze these social media posts about disasters and extract structured information. "
            "For each disaster mentioned, return a JSON array with objects containing:\n"
            "- post_id: the database post ID from the [POST_ID: X] marker (MUST be an integer or null)\n"
            "- location_name: the place name (e.g., 'Tokyo, Japan', 'Manila, Philippines')\n"
            "- latitude: decimal latitude coordinate (e.g., 35.6762)\n"
            "- longitude: decimal longitude coordinate (e.g., 139.6503)\n"
            "- event_time: **ONLY ISO 8601 format YYYY-MM-DDTHH:MM:SSZ** when the disaster occurred. "
            "If the exact time is unknown, use the post's timestamp or estimate based on context. "
            "NEVER use vague terms like 'next week', 'upcoming', 'ongoing', 'recently', etc. "
            "ALWAYS return a valid ISO 8601 timestamp. If completely unknown, use current time.\n"
            "- disaster_type: type of disaster (e.g., 'earthquake', 'hurricane', 'flood', 'wildfire', 'tornado')\n"
            "- severity: rate 1-5 (1=minor, 5=catastrophic)\n"
            "- magnitude: single numerical value if applicable, null otherwise\n"
            "- description: brief summary\n"
            "- affected_population: estimate number of people affected. "
            "Look for mentions like 'X families evacuated', 'Y people without power'. "
            "Convert to individual counts (1 family ≈ 4 people, 1 home ≈ 3 people). "
            "Provide best-effort estimates: neighborhood=5000, city block=500, building=50, regional=50000. "
            "Return null if completely unknown.\n\n"
            f"Posts:\n{posts_text}\n\n"
            "Return ONLY valid JSON. CRITICAL: event_time MUST be ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ), never vague text."
        )

        try:
            response = model.generate_content(prompt)
            cleaned_response = clean_json_response(response.text)

            # Try to merge the disasters from this batch
            try:
                batch_disasters = json.loads(cleaned_response)
                if isinstance(batch_disasters, list):
                    all_disasters.extend(batch_disasters)
                    print(f"✅ Extracted {len(batch_disasters)} disasters from batch {batch_num + 1}")
                else:
                    print(f"⚠️ Invalid response format in batch {batch_num + 1}")
            except json.JSONDecodeError:
                print(f"⚠️ Failed to parse JSON from batch {batch_num + 1}")
                print(f"Response was: {cleaned_response[:200]}...")

        except Exception as e:
            print(f"⚠️ Error processing batch {batch_num + 1}: {str(e)}")

    if all_disasters:
        final_json = json.dumps(all_disasters, indent=2)
        print(f"\n[{datetime.now()}] AI Analysis Complete - Found {len(all_disasters)} total disasters")
        return final_json

    return "[]"


def analyze_sentiment(posts: List[Dict], batch_size: int = 50, batch_delay: int = 1) -> str:
    """Analyze sentiment for each post using Gemini AI in batches
    
    Args:
        posts: List of posts to analyze
        batch_size: Number of posts to process in each batch (default: 50)
        batch_delay: Delay between batches in seconds (default: 1)
        
    Returns:
        JSON string containing sentiment analysis results
    """
    if not posts:
        return "{}"

    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")

    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

    all_sentiments = {}
    total_batches = (len(posts) + batch_size - 1) // batch_size

    print(f"\n🔄 Processing sentiment for {len(posts)} posts in {total_batches} batches of {batch_size}...")

    for batch_num in range(total_batches):
        # Add delay between batches except for the first one
        if batch_num > 0:
            print(f"⏳ Waiting {batch_delay}s before next batch...")
            time.sleep(batch_delay)

        start_idx = batch_num * batch_size
        end_idx = min((batch_num + 1) * batch_size, len(posts))
        batch_posts = posts[start_idx:end_idx]

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

        # Process batch with retry logic
        batch_results = process_batch_with_retry(model, prompt, batch_num + 1)
        if batch_results and isinstance(batch_results, dict):
            all_sentiments.update(batch_results)
            print(f"✅ Analyzed sentiment for {len(batch_results)} posts in batch {batch_num + 1}")
            print(f"📊 Progress: {len(all_sentiments)} total posts analyzed")

    # Prepare final result
    if all_sentiments:
        final_json = json.dumps(all_sentiments, indent=2)
        print(f"\n[{datetime.now()}] Sentiment Analysis Complete - Analyzed {len(all_sentiments)} posts")
        return final_json

    return "{}"
