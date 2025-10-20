from functools import wraps
from fastapi import HTTPException, Request
import jwt
import os
from db_utils.db import SessionLocal, User

JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'secret')


def require_admin(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        request: Request = kwargs.get('request') or (args[0] if args else None)
        if request is None:
            raise HTTPException(status_code=401, detail='Unauthorized')

        auth = request.headers.get('Authorization')
        if not auth or not auth.startswith('Bearer '):
            raise HTTPException(status_code=401, detail='Missing token')

        token = auth.split(' ', 1)[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        except Exception:
            raise HTTPException(status_code=401, detail='Invalid token')

        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=401, detail='Invalid token')

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not getattr(user, 'is_admin', False):
                raise HTTPException(status_code=403, detail='Admin access required')
            if not getattr(user, 'is_active', True):
                raise HTTPException(status_code=403, detail='Account disabled')
            kwargs['current_admin'] = user
            return await func(*args, **kwargs)
        finally:
            db.close()

    return wrapper


def require_super_admin(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Use require_admin first
        await require_admin(lambda *a, **k: None)(*args, **kwargs)
        current_admin = kwargs.get('current_admin')
        if not current_admin or getattr(current_admin, 'role', '') != 'super_admin':
            raise HTTPException(status_code=403, detail='Super admin required')
        return await func(*args, **kwargs)

    return wrapper
