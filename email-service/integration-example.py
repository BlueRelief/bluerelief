"""
Example integration code for the Python backend to use the email service.
This file is for reference only and should be integrated into the main backend.
"""

import requests
import json
from typing import Dict, Any, Optional

class EmailServiceClient:
    """Client for BlueRelief Email Service for sending emails."""
    
    def __init__(self, email_service_url: str = "http://email-service:3002"):
        self.base_url = email_service_url
    
    def send_email(
        self,
        to: str,
        subject: str,
        template: str,
        data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send an email using the email service.
        
        Args:
            to: Recipient email address
            subject: Email subject
            template: Template name (email, alert, notification)
            data: Template data/variables
            metadata: Optional metadata for tagging
            
        Returns:
            Dict with success status and message ID or error
        """
        payload = {
            "to": to,
            "subject": subject,
            "template": template,
            "data": data,
            "metadata": metadata or {}
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/send",
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"Email service request failed: {str(e)}"
            }
    
    def send_alert_email(
        self,
        to: str,
        alert_type: str,
        severity: str,
        location: str,
        description: str,
        action_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send an emergency alert email."""
        return self.send_email(
            to=to,
            subject=f"{alert_type} - {location}",
            template="alert",
            data={
                "alertType": alert_type,
                "severity": severity,
                "location": location,
                "description": description,
                "actionText": "View Details" if action_url else None,
                "actionUrl": action_url,
                "timestamp": None  # Will use current time
            },
            metadata={
                "alertType": alert_type,
                "severity": severity,
                "location": location
            }
        )
    
    def send_notification_email(
        self,
        to: str,
        title: str,
        message: str,
        notification_type: str = "info",
        action_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send a notification email."""
        return self.send_email(
            to=to,
            subject=title,
            template="notification",
            data={
                "title": title,
                "message": message,
                "type": notification_type,
                "actionText": "View Details" if action_url else None,
                "actionUrl": action_url,
                "timestamp": None  # Will use current time
            },
            metadata={
                "type": notification_type
            }
        )
    
    def health_check(self) -> Dict[str, Any]:
        """Check if the email service is healthy."""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }


# Example usage in your existing services
def example_usage():
    """Example of how to use the email service in your existing code."""
    
    # Initialize the email service client
    email_client = EmailServiceClient()
    
    # Check service health
    health = email_client.health_check()
    print(f"Email service status: {health.get('status', 'unknown')}")
    
    # Send an emergency alert
    alert_result = email_client.send_alert_email(
        to="user@example.com",
        alert_type="Earthquake Alert",
        severity="High",
        location="San Francisco, CA",
        description="A 6.5 magnitude earthquake has been detected in your area. Please take immediate safety precautions.",
        action_url="https://bluerelief.com/alerts/123"
    )
    
    if alert_result.get("success"):
        print(f"Alert email sent successfully: {alert_result.get('messageId')}")
    else:
        print(f"Failed to send alert email: {alert_result.get('error')}")
    
    # Send a notification
    notification_result = email_client.send_notification_email(
        to="user@example.com",
        title="New Data Available",
        message="New disaster data has been processed and is available in your dashboard.",
        notification_type="info",
        action_url="https://bluerelief.com/dashboard"
    )
    
    if notification_result.get("success"):
        print(f"Notification sent successfully: {notification_result.get('messageId')}")
    else:
        print(f"Failed to send notification: {notification_result.get('error')}")


# Integration with existing services
class UpdatedEmailService:
    """
    Updated email service that uses the new email microservice.
    Replace your existing email service with this.
    """
    
    def __init__(self):
        self.email_client = EmailServiceClient()
    
    async def send_emergency_alert(self, user_email: str, alert_data: dict):
        """Send emergency alert email using the new service."""
        return self.email_client.send_alert_email(
            to=user_email,
            alert_type=alert_data.get("type", "Emergency Alert"),
            severity=alert_data.get("severity", "High"),
            location=alert_data.get("location", "Unknown Location"),
            description=alert_data.get("description", "Emergency situation detected."),
            action_url=alert_data.get("action_url")
        )
    
    async def send_user_notification(self, user_email: str, notification_data: dict):
        """Send user notification email using the new service."""
        return self.email_client.send_notification_email(
            to=user_email,
            title=notification_data.get("title", "Notification"),
            message=notification_data.get("message", "You have a new notification."),
            notification_type=notification_data.get("type", "info"),
            action_url=notification_data.get("action_url")
        )


if __name__ == "__main__":
    example_usage()
