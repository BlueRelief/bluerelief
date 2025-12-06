from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import Optional, List, Dict, Any
from services.admin_domain_validator import domain_validator
from services.admin_logger import log_admin_activity
from middleware.admin_auth import get_current_admin
from db_utils.db import SessionLocal, User
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import sqlalchemy

router = APIRouter(prefix="/api/admin", tags=["Admin - Users"])


class CreateUserRequest(BaseModel):
    email: EmailStr
    name: Optional[str]
    role: Optional[str] = 'user'
    is_admin: Optional[bool] = False


@router.post('/users')
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


# --- New admin user management endpoints ---


@router.get('/users')
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_admin: Optional[bool] = None,
    is_active: Optional[bool] = None,
    sort_by: str = Query('created_at'),
    sort_order: str = Query('desc'),
    current_admin: User = Depends(get_current_admin),
) -> Dict[str, Any]:
    db = SessionLocal()
    try:
        q = db.query(User).filter(User.deleted_at == None)

        if search:
            term = f"%{search}%"
            q = q.filter(sqlalchemy.or_(User.name.ilike(term), User.email.ilike(term)))

        if role:
            q = q.filter(User.role == role)

        if is_admin is not None:
            q = q.filter(User.is_admin == bool(is_admin))

        if is_active is not None:
            q = q.filter(User.is_active == bool(is_active))

        total_items = q.count()

        # Sorting
        sort_col = getattr(User, sort_by, User.created_at)
        if sort_order.lower() == 'desc':
            sort_col = sort_col.desc()
        else:
            sort_col = sort_col.asc()

        users = q.order_by(sort_col).offset((page - 1) * page_size).limit(page_size).all()

        result = []
        for u in users:
            result.append({
                'id': u.id,
                'email': u.email,
                'name': u.name,
                'role': u.role,
                'is_admin': bool(u.is_admin),
                'is_active': bool(u.is_active),
                'created_at': u.created_at,
                'last_login': u.last_login,
                'failed_login_attempts': u.failed_login_attempts,
                'account_locked_until': u.account_locked_until,
                'location': u.location,
            })

        total_pages = (total_items + page_size - 1) // page_size

        return {
            'users': result,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_items': total_items,
                'total_pages': total_pages,
            },
        }
    finally:
        db.close()


@router.get('/users/stats')
def users_stats(current_admin: User = Depends(get_current_admin)):
    db = SessionLocal()
    try:
        total = db.query(User).filter(User.deleted_at == None).count()
        active = db.query(User).filter(User.deleted_at == None, User.is_active == True).count()
        inactive = total - active
        admins = db.query(User).filter(User.deleted_at == None, User.is_admin == True).count()
        one_week_ago = datetime.utcnow() - timedelta(days=7)
        new_this_week = db.query(User).filter(User.deleted_at == None, User.created_at >= one_week_ago).count()

        return {
            'total_users': total,
            'active_users': active,
            'inactive_users': inactive,
            'admin_users': admins,
            'new_this_week': new_this_week,
        }
    finally:
        db.close()


class BulkDeleteRequest(BaseModel):
    user_ids: List[str]
    hard_delete: Optional[bool] = False


@router.post('/users/bulk-delete')
def bulk_delete(body: BulkDeleteRequest, current_admin: User = Depends(get_current_admin)):
    db = SessionLocal()
    try:
        to_delete = [uid for uid in body.user_ids if uid != getattr(current_admin, 'id', None)]
        if not to_delete:
            raise HTTPException(status_code=400, detail='No valid users to delete')

        deleted = []
        for uid in to_delete:
            u = db.query(User).filter(User.id == uid).first()
            if not u:
                continue
            if body.hard_delete:
                db.delete(u)
            else:
                u.deleted_at = datetime.utcnow()
                db.add(u)
            deleted.append(uid)

        db.commit()
        log_admin_activity(admin_id=current_admin.id if current_admin else None, action='USER_BULK_DELETED', details={'user_ids': deleted, 'hard_delete': bool(body.hard_delete)})
        return {'deleted': deleted, 'requested': len(body.user_ids)}
    finally:
        db.close()


@router.get('/users/{user_id}')
def get_user(user_id: str, current_admin: User = Depends(get_current_admin)):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id, User.deleted_at == None).first()
        if not user:
            raise HTTPException(status_code=404, detail='User not found')

        return {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'role': user.role,
            'is_admin': bool(user.is_admin),
            'is_active': bool(user.is_active),
            'created_at': user.created_at,
            'last_login': user.last_login,
            'failed_login_attempts': user.failed_login_attempts,
            'account_locked_until': user.account_locked_until,
            'location': user.location,
        }
    finally:
        db.close()


class UpdateUserRequest(BaseModel):
    name: Optional[str]
    role: Optional[str]
    is_admin: Optional[bool]
    is_active: Optional[bool]
    account_locked_until: Optional[datetime]


@router.put('/users/{user_id}')
def update_user(user_id: str, body: UpdateUserRequest, current_admin: User = Depends(get_current_admin)):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id, User.deleted_at == None).first()
        if not user:
            raise HTTPException(status_code=404, detail='User not found')

        changes: Dict[str, Any] = {}

        # Prevent self-demotion
        if body.is_admin is not None and user.id == getattr(current_admin, 'id', None) and body.is_admin == False:
            raise HTTPException(status_code=409, detail='Cannot demote yourself from admin')

        if body.is_admin is not None and body.is_admin == True and not domain_validator.is_valid_admin_email(user.email):
            log_admin_activity(admin_id=current_admin.id if current_admin else None, action='ADMIN_PROMOTION_DENIED_DOMAIN', target_user_id=user.id, details={'email': user.email})
            raise HTTPException(status_code=400, detail='Email domain not permitted for admin users')

        # Apply updates
        if body.name is not None and body.name != user.name:
            changes['name'] = {'old': user.name, 'new': body.name}
            user.name = body.name

        if body.role is not None and body.role != user.role:
            changes['role'] = {'old': user.role, 'new': body.role}
            user.role = body.role

        if body.is_admin is not None and body.is_admin != user.is_admin:
            changes['is_admin'] = {'old': user.is_admin, 'new': body.is_admin}
            user.is_admin = body.is_admin

        if body.is_active is not None and body.is_active != user.is_active:
            changes['is_active'] = {'old': user.is_active, 'new': body.is_active}
            user.is_active = body.is_active

        if body.account_locked_until is not None and body.account_locked_until != user.account_locked_until:
            changes['account_locked_until'] = {'old': user.account_locked_until, 'new': body.account_locked_until}
            user.account_locked_until = body.account_locked_until

        if changes:
            db.add(user)
            db.commit()
            log_admin_activity(admin_id=current_admin.id if current_admin else None, action='USER_UPDATED', target_user_id=user.id, details=changes)

        return {'status': 'updated', 'changes': changes}
    finally:
        db.close()


@router.delete('/users/{user_id}')
def delete_user(user_id: str, hard_delete: bool = Query(False), current_admin: User = Depends(get_current_admin)):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail='User not found')

        if user.id == getattr(current_admin, 'id', None):
            raise HTTPException(status_code=409, detail='Cannot delete yourself')

        if hard_delete:
            db.delete(user)
            db.commit()
            log_admin_activity(admin_id=current_admin.id if current_admin else None, action='USER_DELETED', target_user_id=user_id, details={'hard_delete': True})
            return {'status': 'deleted', 'hard_delete': True}
        else:
            user.deleted_at = datetime.utcnow()
            db.add(user)
            db.commit()
            log_admin_activity(admin_id=current_admin.id if current_admin else None, action='USER_DELETED', target_user_id=user_id, details={'hard_delete': False})
            return {'status': 'soft_deleted'}
    finally:
        db.close()
