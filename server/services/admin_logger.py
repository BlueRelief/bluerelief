from typing import Optional, Dict, Any
import logging
import asyncio

from services.logging_service import logging_service

logger = logging.getLogger(__name__)


def log_admin_activity(
    admin_id: Optional[str], 
    action: str, 
    target_user_id: Optional[str] = None, 
    details: Optional[Dict[str, Any]] = None, 
    ip_address: Optional[str] = None, 
    user_agent: Optional[str] = None
):
    """
    Log admin activity using the new comprehensive logging system.
    Wraps the async logging_service for backward compatibility.
    """
    try:
        # Create event loop if needed for synchronous context
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Enhance details with target user info
        enhanced_details = details or {}
        if target_user_id:
            enhanced_details['target_user_id'] = target_user_id
        
        # Run async logging in sync context
        loop.run_until_complete(
            logging_service.log_audit(
                user_id=admin_id,
                action=action,
                resource_type="user" if target_user_id else None,
                resource_id=target_user_id,
                new_value=enhanced_details,
                change_summary=f"Admin action: {action}",
                ip_address=ip_address,
                user_agent=user_agent,
                is_admin_action=True,
            )
        )
    except Exception as e:
        # Don't let logging failures break the application
        logger.error(f"Failed to log admin activity: {e}")
