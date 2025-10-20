from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import os
from services.admin_domain_validator import domain_validator
from services.admin_logger import log_admin_activity
from db_utils.db import SessionLocal, User

router = APIRouter()

JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'secret')
JWT_ALGO = 'HS256'


class LoginCredentials(BaseModel):
    email: str
    password: str


@router.post('/api/admin/login')
def admin_login(credentials: LoginCredentials, request: Request):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == credentials.email).first()
        if not user:
            raise HTTPException(401, 'Invalid credentials')

        # TODO: verify password properly (placeholder)
        if credentials.password != 'admin-placeholder':
            # increment failed attempts
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            db.commit()
            raise HTTPException(401, 'Invalid credentials')

        # Must be admin flag
        if not getattr(user, 'is_admin', False):
            raise HTTPException(403, 'User is not an administrator')

        # Domain restriction
        if not domain_validator.is_valid_admin_email(user.email):
            log_admin_activity(admin_id=user.id, action='ADMIN_LOGIN_DENIED_DOMAIN', details={'email': user.email})
            raise HTTPException(403, f'Admin access restricted to {", ".join(domain_validator.get_allowed_domains())} domains')

        # Check lock
        if getattr(user, 'account_locked_until', None) and user.account_locked_until > datetime.utcnow():
            raise HTTPException(423, 'Account is locked')

        # Reset failed attempts
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        db.commit()

        payload = {
            'sub': user.id,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(hours=4)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

        log_admin_activity(admin_id=user.id, action='ADMIN_LOGIN_SUCCESS', details={'email': user.email, 'ip': request.client.host})

        return {'token': token, 'user': {'id': user.id, 'email': user.email, 'role': user.role}}
    finally:
        db.close()


@router.post('/api/admin/logout')
def admin_logout(request: Request):
    # For stateless JWTs, instruct client to discard token. Optionally implement token revocation.
    return {'message': 'Logged out'}
