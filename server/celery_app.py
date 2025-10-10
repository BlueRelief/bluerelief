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
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
)

celery_app.conf.beat_schedule = {
    "collect-bluesky-data": {
        "task": "tasks.collect_and_analyze",
        "schedule": crontab(hour=f"*/{SCHEDULE_HOURS}"),
    },
}

celery_app.conf.timezone = "UTC"

