from datetime import datetime
from celery_app import celery_app
from services.bluesky import fetch_posts
from services.analysis import analyze_posts, analyze_sentiment
from services.database_service import (
    create_collection_run, 
    complete_collection_run, 
    save_posts, 
    save_analysis
)
import json
import re

@celery_app.task(name="tasks.collect_and_analyze")
def collect_and_analyze():
    """Main task to collect and analyze BlueSky data"""
    print(f"\n{'='*50}")
    print(f"Starting BlueSky data collection - {datetime.now()}")
    print(f"{'='*50}\n")

    run = create_collection_run()

    try:
        posts = fetch_posts()

        sentiment_data = {}
        if len(posts) > 0:
            print(f"🧠 Running sentiment analysis on {len(posts)} posts...")
            sentiment_response = analyze_sentiment(posts)
            try:
                cleaned = re.sub(r"^```json\s*", "", sentiment_response)
                cleaned = re.sub(r"\s*```$", "", cleaned)
                sentiment_data = json.loads(cleaned.strip())
                print(
                    f"✅ Sentiment analysis completed for {len(sentiment_data)} posts"
                )
            except json.JSONDecodeError as e:
                print(f"⚠️  Failed to parse sentiment data: {e}")
                sentiment_data = {}

        saved_count = save_posts(posts, run.id, sentiment_data)

        print(f"Saved {saved_count} new posts (deduplicated from {len(posts)} fetched)")

        if saved_count > 0:
            print(f"🤖 Running disaster analysis on {saved_count} new posts...")
            analysis = analyze_posts(posts)
            if analysis:
                save_analysis(analysis, run.id)
                print(f"✅ Disaster analysis completed")
            else:
                print(f"⚠️  Disaster analysis returned no results")
        else:
            print(f"⏭️  Skipped disaster analysis - no new posts (saved API call!)")
            analysis = None

        complete_collection_run(run.id, saved_count, "completed")

        print(f"\n[{datetime.now()}] Job completed successfully!")

        return {
            "status": "success",
            "run_id": run.id,
            "posts_fetched": len(posts),
            "posts_saved": saved_count,
            "sentiment_analyzed": len(sentiment_data),
            "ai_analysis_ran": saved_count > 0,
            "analysis_preview": (
                analysis[:200] if analysis else "Skipped - no new posts"
            ),
        }
    except Exception as e:
        complete_collection_run(run.id, 0, "failed", str(e))
        print(f"\n[{datetime.now()}] Error occurred: {str(e)}")
        raise
