import google.generativeai as genai
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

def analyze_posts(posts):
    """Process posts with Gemini AI for disaster extraction"""
    if not posts:
        print("No posts to process")
        return None

    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")

    prompt = (
        "Analyze these social media posts about disasters and extract structured information. "
        "For each disaster mentioned, return a JSON array with objects containing:\n"
        "- location: specific location of the disaster\n"
        "- event_time: when the disaster occurred\n"
        "- severity: rate 1-5 (1=minor, 5=catastrophic)\n"
        "- magnitude: single numerical value if applicable (e.g., 7.6 for earthquakes, 4 for hurricanes). "
        "If it's a range, use the highest value. If unknown, use null.\n"
        "- description: brief summary of the disaster\n\n"
        "Posts:\n"
        + "\n".join(
            [f"{idx}. {post['record']['text']}" for idx, post in enumerate(posts, 1)]
        )
        + "\n\nReturn ONLY valid JSON array format, no other text."
    )

    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

    response = model.generate_content(prompt)
    analysis = response.text

    print(f"\n[{datetime.now()}] AI Analysis Complete:")
    print(analysis)

    return analysis


def analyze_sentiment(posts):
    """Analyze sentiment for each post using Gemini AI"""
    if not posts:
        return {}

    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not found in environment variables")

    posts_text = "\n".join(
        [
            f"{idx}. [ID: {post.get('uri', '')}] {post['record']['text']}"
            for idx, post in enumerate(posts, 1)
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

    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

    response = model.generate_content(prompt)
    sentiment_data = response.text

    print(f"\n[{datetime.now()}] Sentiment Analysis Complete")

    return sentiment_data
