from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
from services.admin_domain_validator import domain_validator
from services.admin_logger import log_admin_activity
from middleware.admin_auth import get_current_admin
from db_utils.db import SessionLocal, User
from pydantic import BaseModel, EmailStr
from datetime import datetime

router = APIRouter()


class CreateUserRequest(BaseModel):
    email: EmailStr
    name: Optional[str]
    role: Optional[str] = 'user'
    is_admin: Optional[bool] = False


@router.post('/api/admin/users')
async def create_user(user_data: CreateUserRequest, request: Request, current_admin: User = Depends(get_current_admin)):
    if user_data.is_admin and not domain_validator.is_valid_admin_email(user_data.email):
        log_admin_activity(admin_id=current_admin.id if current_admin else None, action='ADMIN_CREATION_DENIED_DOMAIN', details={'email': user_data.email})
        raise HTTPException(status_code=400, detail=f'Admin users must have email from allowed domains: {", ".join(domain_validator.get_allowed_domains())}')

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail='User already exists')

        user = User(id=f'user-{int(datetime.utcnow().timestamp())}', email=user_data.email, name=user_data.name, role=user_data.role, is_admin=user_data.is_admin)
        db.add(user)
        db.commit()
        db.refresh(user)

        log_admin_activity(admin_id=current_admin.id if current_admin else None, action='ADMIN_USER_CREATED', target_user_id=user.id, details={'email': user.email})

        return {'id': user.id, 'email': user.email}
    finally:
        db.close()
