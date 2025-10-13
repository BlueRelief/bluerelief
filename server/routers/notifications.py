from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from services.email_service import send_email_via_microservice, log_email_event
from db_utils.db import SessionLocal, UserNotificationPreference, EmailLog, Disaster, User
from sqlalchemy.orm import Session
from celery_app import celery_app
import traceback

router = APIRouter()


class EmailSendRequest(BaseModel):
    to: EmailStr
    subject: str
    html: str
    user_id: Optional[str] = None
    crisis_id: Optional[int] = None


class BatchEmailRequest(BaseModel):
    recipients: List[EmailSendRequest]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/api/notifications/email/send")
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


@router.post("/api/notifications/email/batch")
def send_batch(req: BatchEmailRequest):
    """Enqueue a batch email job (async)."""
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


@router.get("/api/notifications/email/status/{log_id}")
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
