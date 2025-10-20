from fastapi import HTTPException, Request
import jwt
import os
from db_utils.db import SessionLocal, User

JWT_SECRET = os.getenv('JWT_SECRET_KEY', 'secret')


async def get_current_admin(request: Request) -> User:
    """Extract and validate admin user from JWT token"""
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account disabled")
        return user
    finally:
        db.close()


async def get_current_super_admin(current_admin: User = None) -> User:
    """Extract and validate super admin user"""
    if not current_admin:
        raise HTTPException(status_code=403, detail="Super admin required")
    if current_admin.role != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin required")
    return current_admin
