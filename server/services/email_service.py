from typing import Optional, Dict, Any, List
import os
import requests
from db_utils.db import SessionLocal, EmailLog
from datetime import datetime

EMAIL_MICROSERVICE_URL = os.getenv("EMAIL_MICROSERVICE_URL")  # e.g. BR-78 service URL
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
# Prefer an explicit EMAIL_FROM so provider accepts the sending domain
EMAIL_FROM = os.getenv("EMAIL_FROM") or os.getenv("SENDING_DOMAIN") and f"no-reply@{os.getenv('SENDING_DOMAIN')}" or "no-reply@bluerelief.dev"


def send_email_via_microservice(to_email: str, subject: str, html: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Call the email microservice (BR-78) if configured; otherwise attempt Resend (DEV)."""
    payload = {
        "to": to_email,
        "subject": subject,
        "html": html,
        "metadata": metadata or {}
    }

    if EMAIL_MICROSERVICE_URL:
        resp = requests.post(f"{EMAIL_MICROSERVICE_URL}/send", json=payload, timeout=10)
        resp.raise_for_status()
        return resp.json()

    # DEV fallback: try Resend API (must set RESEND_API_KEY)
    if RESEND_API_KEY:
        headers = {
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json"
        }
        resend_payload = {
            "from": EMAIL_FROM,
            "to": [to_email],
            "subject": subject,
            "html": html
        }
        try:
            resp = requests.post("https://api.resend.com/emails", json=resend_payload, headers=headers, timeout=10)
            # If provider returns error code, include body for diagnostics
            if not resp.ok:
                raise RuntimeError(f"Resend API error: {resp.status_code} - {resp.text}")
            try:
                return resp.json()
            except Exception:
                return {"status_code": resp.status_code, "text": resp.text}
        except requests.RequestException as e:
            # Surface provider error text when available
            raise RuntimeError(f"Resend request failed: {str(e)}") from e

    raise RuntimeError("No email provider configured (EMAIL_MICROSERVICE_URL or RESEND_API_KEY required)")


def log_email_event(user_id: Optional[str], crisis_id: Optional[int], status: str, provider_message_id: Optional[str], payload: Dict[str, Any]):
    db = SessionLocal()
    try:
        log = EmailLog(
            user_id=user_id,
            crisis_id=crisis_id,
            email_status=status,
            provider_message_id=provider_message_id,
            sent_at=datetime.utcnow(),
            payload=payload,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log.id
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
