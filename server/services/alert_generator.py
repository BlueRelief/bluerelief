from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db_utils.db import Alert, AlertQueue, Disaster, User, UserAlertPreferences, SessionLocal
import json
import logging
import math

logger = logging.getLogger(__name__)

SEVERITY_THRESHOLDS = {
    "new_crisis": 3,
    "severity_change": 2,
    "high_severity": 4,
}

PRIORITY_MAP = {
    5: 1,
    4: 2,
    3: 3,
    2: 4,
    1: 5,
}

# Approximate radius for geolocation filtering (in km)
ALERT_RADIUS_KM = 100


def get_severity_priority(severity: int) -> int:
    """Map disaster severity (1-5) to alert priority (1-5)"""
    return PRIORITY_MAP.get(severity, 3)


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in km using Haversine formula"""
    if not all([lat1, lon1, lat2, lon2]):
        return None
    
    R = 6371  # Earth's radius in km
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def should_alert_user_for_disaster(user_prefs: UserAlertPreferences, user: User, disaster: Disaster) -> bool:
    """Check if user should receive alert for this disaster based on preferences and location

    Checks (in order):
    1. User has preferences set up
    2. Severity meets minimum threshold
    3. GEO-RADIUS: Distance from user to disaster (PRIMARY)
    4. REGION FILTER: User's custom region preferences (SECONDARY)

    Note: email_enabled controls EMAIL sending, not alert creation

    Returns:
        True if user should receive the alert
    """
    if not user_prefs:
        return False

    disaster_severity = disaster.severity or 0
    if disaster_severity < user_prefs.min_severity:
        return False

    # PRIMARY FILTER: Geo-radius based on user coordinates
    if user.latitude is not None and user.longitude is not None and \
       disaster.latitude is not None and disaster.longitude is not None:
        distance = calculate_distance(
            user.latitude, user.longitude,
            disaster.latitude, disaster.longitude
        )

        # If distance is calculated and exceeds radius, check regions as fallback
        if distance is not None and distance > ALERT_RADIUS_KM:
            # SECONDARY FILTER: Check if user has specific regions (override for distant areas)
            if user_prefs.regions and isinstance(user_prefs.regions, list):
                disaster_location = (disaster.location_name or "").lower()
                matches_region = any(
                    region.lower() in disaster_location or disaster_location in region.lower()
                    for region in user_prefs.regions
                )
                if not matches_region:
                    return False
            else:
                # No regions specified and outside radius = no alert
                return False
    else:
        # Fallback: If no coordinates, use region matching only
        if user_prefs.regions and isinstance(user_prefs.regions, list):
            disaster_location = (disaster.location_name or "").lower()
            matches_region = any(
                region.lower() in disaster_location or disaster_location in region.lower()
                for region in user_prefs.regions
            )
            if not matches_region:
                return False

    return True


def should_alert_for_disaster(disaster) -> tuple[bool, str]:
    """Determine if we should generate an alert for this disaster
    
    Returns:
        Tuple of (should_alert: bool, alert_type: str)
    """
    if not disaster:
        return False, None
    
    severity = disaster.severity or 0
    
    if severity >= SEVERITY_THRESHOLDS["high_severity"]:
        return True, "high_severity"
    elif severity >= SEVERITY_THRESHOLDS["new_crisis"]:
        return True, "new_crisis"
    
    return False, None


def get_alert_title_and_message(disaster, alert_type: str) -> tuple[str, str]:
    """Generate alert title and message based on disaster and alert type"""
    location = disaster.location_name or disaster.location or "Unknown location"
    
    titles = {
        "new_crisis": f"New Crisis: {location}",
        "high_severity": f"🚨 High Severity Crisis: {location}",
        "severity_change": f"Crisis Update: {location}",
    }
    
    messages = {
        "new_crisis": f"A new disaster has been detected in {location}. Severity: {disaster.severity}/5",
        "high_severity": f"A high-severity disaster has been detected in {location}. Severity: {disaster.severity}/5",
        "severity_change": f"Crisis situation update in {location}. Severity: {disaster.severity}/5",
    }
    
    title = titles.get(alert_type, "Crisis Alert")
    message = messages.get(alert_type, "A new crisis alert has been generated.")
    
    if disaster.description:
        message += f"\n\nDetails: {disaster.description}"
    
    if disaster.affected_population:
        message += f"\nEstimated affected population: {disaster.affected_population:,}"
    
    return title, message


def create_alert_and_queue(
    db: Session,
    disaster: Disaster,
    alert_type: str,
) -> Alert:
    """Create alert and queue entries for subscribed users in affected region"""
    try:
        title, message = get_alert_title_and_message(disaster, alert_type)
        priority = get_severity_priority(disaster.severity)

        alert = Alert(
            disaster_id=disaster.id,
            alert_type=alert_type,
            severity=disaster.severity,
            title=title,
            message=message,
            alert_metadata={
                "location": disaster.location_name,
                "latitude": disaster.latitude,
                "longitude": disaster.longitude,
                "event_time": (
                    disaster.event_time
                    if isinstance(disaster.event_time, str)
                    else (
                        disaster.event_time.isoformat() if disaster.event_time else None
                    )
                ),
                "affected_population": disaster.affected_population,
            },
        )
        db.add(alert)
        db.flush()

        # Get all users with their preferences
        users = db.query(User).all()
        queued_count = 0

        for user in users:
            prefs = db.query(UserAlertPreferences).filter(
                UserAlertPreferences.user_id == user.id
            ).first()

            # Check if user should receive this alert
            if not should_alert_user_for_disaster(prefs, user, disaster):
                continue

            queue_entry = AlertQueue(
                alert_id=alert.id,
                user_id=user.id,
                recipient_email=user.email,
                recipient_name=user.name,
                priority=priority,
                status="pending",
            )
            db.add(queue_entry)
            queued_count += 1

        db.commit()
        logger.info(f"Created alert for disaster {disaster.id} ({alert_type}): queued for {queued_count} users")
        return alert

    except Exception as e:
        db.rollback()
        logger.error(f"Error creating alert for disaster {disaster.id}: {str(e)}")
        raise


def find_recent_new_disasters(db: Session, minutes: int = 5) -> list:
    """Find disasters created in the last N minutes without alerts"""
    cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
    
    recent_disasters = db.query(Disaster).filter(
        Disaster.extracted_at >= cutoff_time,
    ).all()
    
    disasters_without_alerts = []
    for disaster in recent_disasters:
        existing_alert = db.query(Alert).filter(
            Alert.disaster_id == disaster.id
        ).first()
        
        if not existing_alert:
            disasters_without_alerts.append(disaster)
    
    return disasters_without_alerts


def generate_alerts():
    """Main alert generation task
    
    Runs every 5 minutes to:
    - Detect new crises
    - Create alert records
    - Queue email notifications for users in affected regions
    """
    db = SessionLocal()
    try:
        logger.info("Starting alert generation job")
        
        new_disasters = find_recent_new_disasters(db, minutes=5)
        logger.info(f"Found {len(new_disasters)} new disasters without alerts")
        
        alerts_created = 0
        for disaster in new_disasters:
            should_alert, alert_type = should_alert_for_disaster(disaster)
            
            if should_alert:
                create_alert_and_queue(db, disaster, alert_type)
                alerts_created += 1
        
        logger.info(f"Alert generation completed: {alerts_created} alerts created")
        
        return {
            "status": "success",
            "disasters_checked": len(new_disasters),
            "alerts_created": alerts_created,
        }
        
    except Exception as e:
        logger.error(f"Error in alert generation: {str(e)}")
        raise
    finally:
        db.close()
