from datetime import datetime
from celery_app import celery_app
from services.bluesky import fetch_posts
from services.analysis import analyze_posts
from services.database_service import (
    create_collection_run, 
    complete_collection_run, 
    save_posts, 
    save_analysis
)

@celery_app.task(name="tasks.collect_and_analyze")
def collect_and_analyze():
    """Main task to collect and analyze BlueSky data"""
    print(f"\n{'='*50}")
    print(f"Starting BlueSky data collection - {datetime.now()}")
    print(f"{'='*50}\n")
    
    run = create_collection_run()
    
    try:
        posts = fetch_posts()
        saved_count = save_posts(posts, run.id)
        
        print(f"Saved {saved_count} new posts (deduplicated from {len(posts)} fetched)")
        
        if saved_count > 0:
            print(f"🤖 Running AI analysis on {saved_count} new posts...")
            analysis = analyze_posts(posts)
            if analysis:
                save_analysis(analysis, run.id)
                print(f"✅ AI analysis completed")
            else:
                print(f"⚠️  AI analysis returned no results")
        else:
            print(f"⏭️  Skipped AI analysis - no new posts (saved API call!)")
            analysis = None
        
        complete_collection_run(run.id, saved_count, "completed")
        
        print(f"\n[{datetime.now()}] Job completed successfully!")
        
        return {
            "status": "success",
            "run_id": run.id,
            "posts_fetched": len(posts),
            "posts_saved": saved_count,
            "ai_analysis_ran": saved_count > 0,
            "analysis_preview": analysis[:200] if analysis else "Skipped - no new posts"
        }
    except Exception as e:
        complete_collection_run(run.id, 0, "failed", str(e))
        print(f"\n[{datetime.now()}] Error occurred: {str(e)}")
        raise

