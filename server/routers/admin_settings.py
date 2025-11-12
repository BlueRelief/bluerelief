from fastapi import APIRouter, HTTPException, Depends, Request
from services.admin_domain_validator import domain_validator, AdminDomainValidator
from middleware.admin_auth import get_current_admin, get_current_super_admin
from services.admin_logger import log_admin_activity
from db_utils.db import SessionLocal, User
from models.admin import EmailValidationRequest, DomainConfigResponse

router = APIRouter(prefix="/api/admin", tags=["Admin - Settings"])


@router.get('/domain-config')
async def get_domain_config(current_admin: User = Depends(get_current_admin)):
    await get_current_super_admin(current_admin)
    return {
        'enabled': domain_validator.enabled,
        'allowed_domains': domain_validator.get_allowed_domains(),
        'exception_emails_count': len(domain_validator.exception_emails),
        'note': 'Exception emails list is hidden for security'
    }


@router.post('/domain-config/validate-email')
async def validate_admin_email(request: EmailValidationRequest, current_admin: User = Depends(get_current_admin)):
    is_valid = domain_validator.is_valid_admin_email(request.email)
    return {
        'email': request.email,
        'is_valid': is_valid,
        'reason': 'Domain allowed' if is_valid else f'Domain not in allowed list: {", ".join(domain_validator.get_allowed_domains())}'
    }


@router.post('/domain-config/reload')
async def reload_domain_config(current_admin: User = Depends(get_current_admin)):
    await get_current_super_admin(current_admin)
    global domain_validator
    domain_validator = AdminDomainValidator()
    log_admin_activity(admin_id=current_admin.id if current_admin else None, action='DOMAIN_CONFIG_RELOADED', details={'allowed_domains': domain_validator.get_allowed_domains()})
    return {'message': 'Domain configuration reloaded', 'allowed_domains': domain_validator.get_allowed_domains()}
