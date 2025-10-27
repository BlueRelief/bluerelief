from fastapi import HTTPException, Request
import jwt
import os
from db_utils.db import SessionLocal, User

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "secret")
JWT_ALGORITHMS = ["HS256"]


async def get_current_admin(request: Request) -> User:
    """Extract and validate admin user from either Authorization header or 'token' cookie.

    Behavior:
      - Prefer Authorization: Bearer <token> header if present.
      - Otherwise try the HttpOnly cookie named 'token'.
      - Support tokens that encode either 'sub' (user id) or 'email' depending on issuer.
    """
    auth_header = request.headers.get("Authorization")
    token = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
    else:
        # Fallback to cookie-based token (e.g. OAuth flows set HttpOnly cookie 'token')
        token = request.cookies.get("token")

    print(token)

    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=JWT_ALGORITHMS)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Tokens may use 'sub' for user id (admin login) or 'email' (OAuth flows)
    user_id = payload.get("sub")
    db = SessionLocal()
    try:
        user = None
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
        else:
            email = payload.get("email")
            if email:
                user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(status_code=403, detail="user not found")

        if not user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account disabled")

        return user
    finally:
        db.close()


async def get_current_super_admin(current_admin: User = None) -> User:
    """Validate that an admin is a super admin."""
    if not current_admin:
        raise HTTPException(status_code=403, detail="Super admin required")
    if getattr(current_admin, "role", None) != "super_admin":
        raise HTTPException(status_code=403, detail="Super admin required")
    return current_admin
