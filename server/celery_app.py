from celery import Celery
from celery.schedules import crontab
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
SCHEDULE_HOURS = int(os.getenv("SCHEDULE_HOURS", "24"))

celery_app = Celery(
    "bluerelief_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks"]
)

celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    task_track_started=True,
    task_time_limit=30 * 60,
    
    # Concurrency settings
    worker_prefetch_multiplier=1,  # Process one task at a time
    task_acks_late=True,  # Only acknowledge task after it's completed
    
    # Rate limiting
    task_annotations={
        'tasks.collect_and_analyze': {
            'rate_limit': '1/m'  # One task per minute
        }
    },
    
    # Retry settings
    task_default_retry_delay=60,  # 60 seconds between retries
    task_max_retries=3,  # Maximum 3 retries
    
    # Timezone
    timezone="UTC",
    enable_utc=True,
)

# Default to running every 8 hours, but can be configured with env var
SCHEDULE_HOURS = int(os.getenv("SCHEDULE_HOURS", "8"))

celery_app.conf.beat_schedule = {
    "collect-bluesky-data": {
        "task": "tasks.collect_and_analyze",
        "schedule": crontab(hour=f"*/{SCHEDULE_HOURS}"),
        "options": {"expires": 60 * 60 * 3},  # Tasks expire after 3 hours
    },
    "generate-alerts": {
        "task": "tasks.generate_alerts",
        "schedule": 300.0,  # every 5 minutes
        "options": {
            "expires": 60 * 5,  # Tasks expire after 5 minutes
        },
    },
    "manage-alert-queue": {
        "task": "tasks.manage_alert_queue",
        "schedule": 120.0,  # every 2 minutes
        "options": {
            "expires": 60 * 2,  # Tasks expire after 2 minutes
        },
    },
    "cleanup-alerts": {
        "task": "tasks.cleanup_old_alerts",
        "schedule": crontab(hour=2, minute=0),  # 2 AM daily
        "options": {
            "expires": 60 * 60 * 24,  # Tasks expire after 24 hours
        },
    },
    "archive-completed-disasters": {
        "task": "tasks.archive_completed_disasters",
        "schedule": crontab(hour=3, minute=0),  # 3 AM daily
        "options": {
            "expires": 60 * 60 * 24,  # Tasks expire after 24 hours
        },
    },
}

celery_app.conf.timezone = "UTC"
