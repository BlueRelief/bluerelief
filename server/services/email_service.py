from typing import Optional, Dict, Any, List
import os
import requests
from db_utils.db import SessionLocal, EmailLog
from datetime import datetime

EMAIL_MICROSERVICE_URL = os.getenv("EMAIL_MICROSERVICE_URL", "http://email-service:3002")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
# Prefer an explicit EMAIL_FROM so provider accepts the sending domain
EMAIL_FROM = (
    os.getenv("EMAIL_FROM")
    or (os.getenv("SENDING_DOMAIN") and f"no-reply@{os.getenv('SENDING_DOMAIN')}")
    or "no-reply@bluerelief.dev"
)


def send_email_via_microservice(
    to_email: str, 
    subject: str, 
    template: str,
    data: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Send email using the Node.js email microservice with template support."""
    payload = {
        "to": to_email,
        "subject": subject,
        "template": template,
        "data": data,
        "metadata": metadata or {}
    }

    try:
        resp = requests.post(f"{EMAIL_MICROSERVICE_URL}/send", json=payload, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        # Fallback to direct Resend API if microservice is unavailable
        if RESEND_API_KEY:
            return _send_via_resend_fallback(to_email, subject, data, metadata)
        raise RuntimeError(f"Email microservice unavailable: {str(e)}") from e


def _send_via_resend_fallback(to_email: str, subject: str, data: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Fallback to direct Resend API when microservice is unavailable."""
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Create simple HTML from data
    html = _create_simple_html(data)
    
    resend_payload = {
        "from": EMAIL_FROM,
        "to": [to_email],
        "subject": subject,
        "html": html
    }
    
    try:
        resp = requests.post("https://api.resend.com/emails", json=resend_payload, headers=headers, timeout=10)
        if not resp.ok:
            raise RuntimeError(f"Resend API error: {resp.status_code} - {resp.text}")
        return resp.json()
    except requests.RequestException as e:
        raise RuntimeError(f"Resend request failed: {str(e)}") from e


def _create_simple_html(data: Dict[str, Any]) -> str:
    """Create simple HTML fallback when microservice is unavailable."""
    title = data.get('title', 'BlueRelief Notification')
    content = data.get('content', 'This is a notification from BlueRelief.')
    
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #007ee6;">{title}</h1>
        <p>{content}</p>
        <p style="color: #666; font-size: 12px;">This email was sent by BlueRelief Emergency Response System.</p>
    </body>
    </html>
    """


# Template selection helper functions
def get_template_for_crisis_alert(disaster_type: str, severity: str) -> str:
    """Select appropriate template for crisis alerts."""
    if severity.lower() in ['critical', 'high']:
        return 'crisis-alert'
    return 'alert'


def get_template_for_notification(notification_type: str) -> str:
    """Select appropriate template for notifications."""
    if notification_type == 'mention':
        return 'mention-notification'
    elif notification_type == 'weekly_digest':
        return 'weekly-digest'
    elif notification_type == 'welcome':
        return 'welcome'
    return 'notification'


def map_crisis_alert_data(disaster_type: str, location: str, severity: str, description: str, affected_area: str = None) -> Dict[str, Any]:
    """Map crisis alert data to template variables."""
    return {
        'disasterType': disaster_type,
        'location': location,
        'severity': severity,
        'description': description,
        'affectedArea': affected_area or location,
        'timestamp': datetime.utcnow().isoformat(),
        'actionText': 'View Details',
        'actionUrl': 'https://bluerelief.com/alerts'
    }


def map_weekly_digest_data(user_name: str, week_start: str, week_end: str, crisis_count: int, crises: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Map weekly digest data to template variables."""
    return {
        'userName': user_name,
        'weekStart': week_start,
        'weekEnd': week_end,
        'crisisCount': crisis_count,
        'crises': crises,
        'dashboardUrl': 'https://bluerelief.com/dashboard'
    }


def map_mention_notification_data(user_name: str, mentioned_by: str, context: str, post_title: str = None, post_content: str = None) -> Dict[str, Any]:
    """Map mention notification data to template variables."""
    return {
        'userName': user_name,
        'mentionedBy': mentioned_by,
        'context': context,
        'postTitle': post_title,
        'postContent': post_content,
        'actionText': 'View Post',
        'actionUrl': 'https://bluerelief.com/posts',
        'timestamp': datetime.utcnow().isoformat()
    }


def map_welcome_data(user_name: str, user_email: str) -> Dict[str, Any]:
    """Map welcome email data to template variables."""
    return {
        'userName': user_name,
        'userEmail': user_email,
        'dashboardUrl': 'https://bluerelief.com/dashboard',
        'settingsUrl': 'https://bluerelief.com/settings',
        'helpUrl': 'https://bluerelief.com/help'
    }


# High-level email sending functions
def send_crisis_alert_email(
    to_email: str,
    disaster_type: str,
    location: str,
    severity: str,
    description: str,
    affected_area: str = None,
    user_id: Optional[str] = None,
    crisis_id: Optional[int] = None
) -> Dict[str, Any]:
    """Send a crisis alert email."""
    template = get_template_for_crisis_alert(disaster_type, severity)
    data = map_crisis_alert_data(disaster_type, location, severity, description, affected_area)
    subject = f"{disaster_type} Alert - {location}"
    
    metadata = {
        'user_id': user_id,
        'crisis_id': crisis_id,
        'type': 'crisis_alert'
    }
    
    return send_email_via_microservice(to_email, subject, template, data, metadata)


def send_weekly_digest_email(
    to_email: str,
    user_name: str,
    week_start: str,
    week_end: str,
    crisis_count: int,
    crises: List[Dict[str, Any]],
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Send a weekly digest email."""
    template = 'weekly-digest'
    data = map_weekly_digest_data(user_name, week_start, week_end, crisis_count, crises)
    subject = f"Weekly Crisis Digest - {week_start} to {week_end}"
    
    metadata = {
        'user_id': user_id,
        'type': 'weekly_digest'
    }
    
    return send_email_via_microservice(to_email, subject, template, data, metadata)


def send_mention_notification_email(
    to_email: str,
    user_name: str,
    mentioned_by: str,
    context: str,
    post_title: str = None,
    post_content: str = None,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Send a mention notification email."""
    template = 'mention-notification'
    data = map_mention_notification_data(user_name, mentioned_by, context, post_title, post_content)
    subject = f"You've been mentioned by {mentioned_by}"
    
    metadata = {
        'user_id': user_id,
        'type': 'mention_notification'
    }
    
    return send_email_via_microservice(to_email, subject, template, data, metadata)


def send_welcome_email(
    to_email: str,
    user_name: str,
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """Send a welcome email."""
    template = 'welcome'
    data = map_welcome_data(user_name, to_email)
    subject = "Welcome to BlueRelief!"
    
    metadata = {
        'user_id': user_id,
        'type': 'welcome'
    }
    
    return send_email_via_microservice(to_email, subject, template, data, metadata)


def send_alert_email(
    to_email: str,
    recipient_name: str,
    alert_title: str,
    alert_message: str,
    alert_type: str,
    severity: int,
    location: str = None,
    latitude: float = None,
    longitude: float = None,
    user_id: Optional[str] = None,
    alert_id: Optional[int] = None
) -> Dict[str, Any]:
    """Send an alert notification email."""
    severity_map = {
        1: "Low",
        2: "Medium", 
        3: "High",
        4: "High",
        5: "Critical"
    }
    
    severity_label = severity_map.get(severity, "Medium")
    template = 'alert'
    
    data = {
        'alertType': alert_title,
        'severity': severity_label,
        'location': location or 'Unknown Location',
        'description': alert_message,
        'actionText': 'View Alert Details',
        'actionUrl': f'https://bluerelief.com/dashboard/alerts',
        'timestamp': datetime.utcnow().isoformat()
    }
    
    subject = f"🚨 {alert_title}"
    
    metadata = {
        'user_id': user_id,
        'alert_id': alert_id,
        'type': 'alert_notification'
    }
    
    return send_email_via_microservice(to_email, subject, template, data, metadata)


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
