from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import os
from services.admin_domain_validator import domain_validator
from services.admin_logger import log_admin_activity
from db_utils.db import SessionLocal, User
from middleware.admin_auth import get_current_admin

router = APIRouter()

JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'secret')
JWT_ALGO = 'HS256'


class LoginCredentials(BaseModel):
    email: str
    password: str


@router.post('/api/admin/login')
async def admin_login(credentials: LoginCredentials, request: Request):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == credentials.email).first()
        if not user:
            raise HTTPException(status_code=401, detail='Invalid credentials')

        # TODO: verify password properly (placeholder)
        if credentials.password != 'admin-placeholder':
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            db.commit()
            raise HTTPException(status_code=401, detail='Invalid credentials')

        if not user.is_admin:
            raise HTTPException(status_code=403, detail='User is not an administrator')

        if not domain_validator.is_valid_admin_email(user.email):
            log_admin_activity(admin_id=user.id, action='ADMIN_LOGIN_DENIED_DOMAIN', details={'email': user.email})
            raise HTTPException(status_code=403, detail=f'Admin access restricted to {", ".join(domain_validator.get_allowed_domains())} domains')

        if user.account_locked_until and user.account_locked_until > datetime.utcnow():
            raise HTTPException(status_code=423, detail='Account is locked')

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
async def admin_logout(request: Request, current_admin: User = Depends(get_current_admin)):
    return {'message': 'Logged out'}
