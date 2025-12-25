from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import os
from services.email_service import (
    send_email_via_microservice, 
    log_email_event,
    send_crisis_alert_email,
    send_weekly_digest_email,
    send_mention_notification_email,
    send_welcome_email
)
from db_utils.db import SessionLocal, UserNotificationPreference, EmailLog, Disaster, User
from sqlalchemy.orm import Session
from celery_app import celery_app
import traceback

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

# SHOWCASE_MODE: When enabled, blocks batch email tasks
SHOWCASE_MODE = os.getenv("SHOWCASE_MODE", "true").lower() == "true"


class EmailSendRequest(BaseModel):
    to: EmailStr
    subject: str
    html: str
    user_id: Optional[str] = None
    crisis_id: Optional[int] = None


class BatchEmailRequest(BaseModel):
    recipients: List[EmailSendRequest]


class CrisisAlertRequest(BaseModel):
    to: EmailStr
    disaster_type: str
    location: str
    severity: str
    description: str
    affected_area: Optional[str] = None
    user_id: Optional[str] = None
    crisis_id: Optional[int] = None


class WeeklyDigestRequest(BaseModel):
    to: EmailStr
    user_name: str
    week_start: str
    week_end: str
    crisis_count: int
    crises: List[Dict[str, Any]]
    user_id: Optional[str] = None


class MentionNotificationRequest(BaseModel):
    to: EmailStr
    user_name: str
    mentioned_by: str
    context: str
    post_title: Optional[str] = None
    post_content: Optional[str] = None
    user_id: Optional[str] = None


class WelcomeEmailRequest(BaseModel):
    to: EmailStr
    user_name: str
    user_id: Optional[str] = None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/email/send")
def send_email(req: EmailSendRequest):
    """Send an individual crisis alert email (DEV only)."""
    # Check user preferences if user_id provided
    try:
        if req.user_id:
            db = SessionLocal()
            pref = db.query(UserNotificationPreference).filter(UserNotificationPreference.user_id == req.user_id).first()
            if pref and not pref.email_opt_in:
                # log as skipped
                log_id = log_email_event(req.user_id, req.crisis_id, "skipped_opt_out", None, req.dict())
                return {"status": "skipped", "log_id": log_id}

        resp = send_email_via_microservice(req.to, req.subject, req.html, metadata={"crisis_id": req.crisis_id})
        provider_msg_id = resp.get("id") or resp.get("messageId") or resp.get("data", {}).get("id")
        log_id = log_email_event(req.user_id, req.crisis_id, "sent", provider_msg_id, req.dict())
        return {"status": "sent", "provider": resp, "log_id": log_id}
    except Exception as e:
        tb = traceback.format_exc()
        log_id = None
        try:
            log_id = log_email_event(req.user_id, req.crisis_id, "failed", None, {"request": req.dict(), "error": str(e), "trace": tb})
        except Exception:
            pass
        raise HTTPException(status_code=500, detail={"error": str(e), "log_id": log_id})


@celery_app.task(name="notifications.send_batch_emails")
def send_batch_emails_task(recipients: List[Dict[str, Any]]):
    results = []
    for r in recipients:
        try:
            resp = send_email_via_microservice(r.get("to"), r.get("subject"), r.get("html"), metadata={"crisis_id": r.get("crisis_id")})
            provider_msg_id = resp.get("id") or resp.get("messageId") or resp.get("data", {}).get("id")
            log_id = log_email_event(r.get("user_id"), r.get("crisis_id"), "sent", provider_msg_id, r)
            results.append({"to": r.get("to"), "status": "sent", "log_id": log_id})
        except Exception as e:
            try:
                log_id = log_email_event(r.get("user_id"), r.get("crisis_id"), "failed", None, {"request": r, "error": str(e)})
            except Exception:
                log_id = None
            results.append({"to": r.get("to"), "status": "failed", "error": str(e), "log_id": log_id})
    return results


@router.post("/email/crisis-alert")
def send_crisis_alert(req: CrisisAlertRequest):
    """Send a crisis alert email using template."""
    try:
        if req.user_id:
            db = SessionLocal()
            pref = db.query(UserNotificationPreference).filter(UserNotificationPreference.user_id == req.user_id).first()
            if pref and not pref.email_opt_in:
                log_id = log_email_event(req.user_id, req.crisis_id, "skipped_opt_out", None, req.dict())
                return {"status": "skipped", "log_id": log_id}

        resp = send_crisis_alert_email(
            req.to, req.disaster_type, req.location, req.severity, 
            req.description, req.affected_area, req.user_id, req.crisis_id
        )
        provider_msg_id = resp.get("messageId")
        log_id = log_email_event(req.user_id, req.crisis_id, "sent", provider_msg_id, req.dict())
        return {"status": "sent", "provider": resp, "log_id": log_id}
    except Exception as e:
        tb = traceback.format_exc()
        log_id = None
        try:
            log_id = log_email_event(req.user_id, req.crisis_id, "failed", None, {"request": req.dict(), "error": str(e), "trace": tb})
        except Exception:
            pass
        raise HTTPException(status_code=500, detail={"error": str(e), "log_id": log_id})


@router.post("/email/weekly-digest")
def send_weekly_digest(req: WeeklyDigestRequest):
    """Send a weekly digest email using template."""
    try:
        if req.user_id:
            db = SessionLocal()
            pref = db.query(UserNotificationPreference).filter(UserNotificationPreference.user_id == req.user_id).first()
            if pref and not pref.email_opt_in:
                log_id = log_email_event(req.user_id, None, "skipped_opt_out", None, req.dict())
                return {"status": "skipped", "log_id": log_id}

        resp = send_weekly_digest_email(
            req.to, req.user_name, req.week_start, req.week_end, 
            req.crisis_count, req.crises, req.user_id
        )
        provider_msg_id = resp.get("messageId")
        log_id = log_email_event(req.user_id, None, "sent", provider_msg_id, req.dict())
        return {"status": "sent", "provider": resp, "log_id": log_id}
    except Exception as e:
        tb = traceback.format_exc()
        log_id = None
        try:
            log_id = log_email_event(req.user_id, None, "failed", None, {"request": req.dict(), "error": str(e), "trace": tb})
        except Exception:
            pass
        raise HTTPException(status_code=500, detail={"error": str(e), "log_id": log_id})


@router.post("/email/mention")
def send_mention_notification(req: MentionNotificationRequest):
    """Send a mention notification email using template."""
    try:
        if req.user_id:
            db = SessionLocal()
            pref = db.query(UserNotificationPreference).filter(UserNotificationPreference.user_id == req.user_id).first()
            if pref and not pref.email_opt_in:
                log_id = log_email_event(req.user_id, None, "skipped_opt_out", None, req.dict())
                return {"status": "skipped", "log_id": log_id}

        resp = send_mention_notification_email(
            req.to, req.user_name, req.mentioned_by, req.context, 
            req.post_title, req.post_content, req.user_id
        )
        provider_msg_id = resp.get("messageId")
        log_id = log_email_event(req.user_id, None, "sent", provider_msg_id, req.dict())
        return {"status": "sent", "provider": resp, "log_id": log_id}
    except Exception as e:
        tb = traceback.format_exc()
        log_id = None
        try:
            log_id = log_email_event(req.user_id, None, "failed", None, {"request": req.dict(), "error": str(e), "trace": tb})
        except Exception:
            pass
        raise HTTPException(status_code=500, detail={"error": str(e), "log_id": log_id})


@router.post("/email/welcome")
def send_welcome(req: WelcomeEmailRequest):
    """Send a welcome email using template."""
    try:
        resp = send_welcome_email(req.to, req.user_name, req.user_id)
        provider_msg_id = resp.get("messageId")
        log_id = log_email_event(req.user_id, None, "sent", provider_msg_id, req.dict())
        return {"status": "sent", "provider": resp, "log_id": log_id}
    except Exception as e:
        tb = traceback.format_exc()
        log_id = None
        try:
            log_id = log_email_event(req.user_id, None, "failed", None, {"request": req.dict(), "error": str(e), "trace": tb})
        except Exception:
            pass
        raise HTTPException(status_code=500, detail={"error": str(e), "log_id": log_id})


@router.post("/email/batch")
def send_batch(req: BatchEmailRequest):
    """Enqueue a batch email job (async)."""
    if SHOWCASE_MODE:
        raise HTTPException(
            status_code=403,
            detail="🎭 Showcase Mode: Batch emails disabled. This app is in portfolio/demo mode."
        )
    try:
        # For DEV: perform quick pre-check: filter out opted-out users
        recipients = []
        db = SessionLocal()
        try:
            for r in req.recipients:
                user_id = r.user_id
                if user_id:
                    pref = db.query(UserNotificationPreference).filter(UserNotificationPreference.user_id == user_id).first()
                    if pref and not pref.email_opt_in:
                        # log as skipped
                        log_email_event(user_id, r.crisis_id, "skipped_opt_out", None, r.dict())
                        continue
                recipients.append(r.dict())
        finally:
            db.close()

        task = send_batch_emails_task.delay(recipients)
        return {"status": "enqueued", "task_id": task.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/email/status/{log_id}")
def email_status(log_id: int):
    db = SessionLocal()
    try:
        log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
        if not log:
            raise HTTPException(status_code=404, detail="log not found")
        return {
            "id": log.id,
            "user_id": log.user_id,
            "crisis_id": log.crisis_id,
            "status": log.email_status,
            "provider_message_id": log.provider_message_id,
            "sent_at": log.sent_at.isoformat() if log.sent_at else None,
            "opened_at": log.opened_at.isoformat() if log.opened_at else None,
        }
    finally:
        db.close()
