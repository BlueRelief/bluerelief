from fastapi import APIRouter, Request, HTTPException, status, Cookie
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse
from fastapi.responses import JSONResponse
from jose import JWTError, jwt, ExpiredSignatureError
from datetime import datetime, timedelta
import traceback
import requests
import uuid
import os
from dotenv import load_dotenv
from typing import Optional
from pydantic import BaseModel
from google.oauth2 import service_account
import google.auth.transport.requests
from google.oauth2.id_token import verify_oauth2_token
from db_utils.db import upsert_user, get_user_by_email, SessionLocal, User
from services.password_service import hash_password, verify_password
from services.email_service import send_password_reset_email
import logging as logger
from services.logging_service import logging_service
import secrets

load_dotenv(override=True)

router = APIRouter(prefix="/auth", tags=["auth"])

# Load configurations
config = Config(".env")

# Setup OAuth2
oauth = OAuth()

oauth.register(
    name="auth_demo",
    client_id=config("GOOGLE_CLIENT_ID"),
    client_secret=config("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid profile email"},
)

# Secret key used to encode JWT tokens (should be kept secret)
SECRET_KEY = config("JWT_SECRET_KEY")
ALGORITHM = "HS256"
REDIRECT_URL = config("REDIRECT_URL")
FRONTEND_URL = config("FRONTEND_URL")
BACKEND_URL = config("BACKEND_URL", default="http://localhost:8000")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PREVIEW = os.getenv("IS_PREVIEW", "false").lower() == "true"
PREVIEW_AUTH_BYPASS = os.getenv("PREVIEW_AUTH_BYPASS", "false").lower() == "true"


class EmailLoginRequest(BaseModel):
    email: str
    password: str


class EmailRegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Cookie(None)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_email: str = payload.get("email")

        if user_email is None:
            raise credentials_exception

        # Get user data from database using email from JWT
        user_data = get_user_by_email(user_email)
        if user_data is None:
            raise HTTPException(status_code=401, detail="User not found")

        return {
            "user_id": user_data["id"],
            "user_email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data["picture"],
            "location": user_data.get("location"),
            "latitude": user_data.get("latitude"),
            "longitude": user_data.get("longitude"),
            "role": user_data.get("role"),
            "created_at": user_data.get("created_at"),
        }

    except ExpiredSignatureError:
        # Specifically handle expired tokens
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please login again.")
    except JWTError:
        # Handle other JWT-related errors
        traceback.print_exc()
        raise credentials_exception
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=401, detail="Not Authenticated")


@router.get("/status")
async def auth_status(request: Request, token: str = Cookie(None)):
    if not token:
        return {"authenticated": False}

    try:
        user = get_current_user(token)
        return {
            "authenticated": True,
            "user": {
                "user_id": user["user_id"],
                "user_email": user["user_email"],
                "name": user.get("name"),
                "picture": user.get("picture"),
                "location": user.get("location"),
                "latitude": user.get("latitude"),
                "longitude": user.get("longitude"),
                "role": user.get("role"),
                "created_at": user.get("created_at"),
            },
        }
    except HTTPException:
        return {"authenticated": False}


@router.get("/google/login")
async def login(request: Request):
    request.session.clear()
    request.session["login_redirect"] = REDIRECT_URL
    callback_url = f"{BACKEND_URL}/auth/google/callback"

    # Log OAuth initiation
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    
    await logging_service.log_auth_event(
        user_id=None,
        action="OAUTH_LOGIN_INITIATED",
        status="pending",
        details={"provider": "google", "callback_url": callback_url},
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return await oauth.auth_demo.authorize_redirect(
        request, callback_url, prompt="consent"
    )


@router.get("/demo/login")
async def demo_login(request: Request):
    """Demo authentication for preview/testing environments (non-production only)"""
    if not IS_PREVIEW:
        raise HTTPException(
            status_code=403, detail="Demo auth not available in production"
        )

    demo_user = {
        "id": "demo-user-001",
        "email": "demo@bluerelief.app",
        "name": "Demo User",
        "picture": "https://api.dicebear.com/9.x/micah/svg?seed=Destiny&facialHairProbability=0&glassesColor=000000&glassesProbability=0&hairColor=000000&mouth=laughing&shirt=collared&shirtColor=000000",
    }

    upsert_user(
        demo_user["id"], demo_user["email"], demo_user["name"], demo_user["picture"]
    )

    access_token_expires = timedelta(days=7)
    access_token = create_access_token(
        data={"email": demo_user["email"]}, expires_delta=access_token_expires
    )

    # Log demo login
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    await logging_service.log_auth_event(
        user_id=demo_user["id"],
        action="DEMO_LOGIN_SUCCESS",
        status="success",
        details={"environment": "preview", "email": demo_user["email"]},
        ip_address=client_ip,
        user_agent=user_agent,
    )

    response = RedirectResponse(REDIRECT_URL)
    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=604800,
        path="/",
    )

    return response


@router.post("/register")
async def register(request: EmailRegisterRequest, req: Request):
    """Register a new user with email and password"""
    db = SessionLocal()
    client_ip = req.client.host if req.client else None
    user_agent = req.headers.get("User-Agent")

    try:
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        if len(request.password) < 8:
            raise HTTPException(
                status_code=400, detail="Password must be at least 8 characters"
            )

        password_hash = hash_password(request.password)
        user_id = f"user-{uuid.uuid4()}"

        new_user = User(
            id=user_id,
            email=request.email,
            name=request.name,
            password=password_hash,
            role="user",
            is_admin=False,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        access_token_expires = timedelta(days=7)
        access_token = create_access_token(
            data={"email": new_user.email}, expires_delta=access_token_expires
        )

        await logging_service.log_auth_event(
            user_id=user_id,
            action="REGISTER_SUCCESS",
            status="success",
            details={
                "email": request.email,
                "name": request.name,
                "auth_method": "email_password",
            },
            ip_address=client_ip,
            user_agent=user_agent,
        )

        response = JSONResponse(
            content={
                "message": "Registration successful",
                "user": {
                    "user_id": new_user.id,
                    "user_email": new_user.email,
                    "name": new_user.name,
                },
            }
        )

        is_production = os.getenv("ENVIRONMENT", "development") == "production"
        response.set_cookie(
            key="token",
            value=access_token,
            httponly=True,
            secure=is_production,
            samesite="lax",
            max_age=604800,
            path="/",
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        await logging_service.log_auth_event(
            user_id=None,
            action="REGISTER_FAILED",
            status="failure",
            details={"email": request.email, "error": str(e)},
            ip_address=client_ip,
            user_agent=user_agent,
            error_message=str(e),
        )
        raise HTTPException(status_code=500, detail="Registration failed")
    finally:
        db.close()


@router.post("/login")
async def login(request: EmailLoginRequest, req: Request):
    """Login with email and password"""
    db = SessionLocal()
    client_ip = req.client.host if req.client else None
    user_agent = req.headers.get("User-Agent")

    try:
        user = db.query(User).filter(
            User.email == request.email,
            User.deleted_at == None
        ).first()

        if not user or not user.password:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not verify_password(request.password, user.password):
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            db.commit()

            await logging_service.log_auth_event(
                user_id=user.id,
                action="LOGIN_FAILED",
                status="failure",
                details={"email": request.email, "reason": "invalid_password"},
                ip_address=client_ip,
                user_agent=user_agent,
            )

            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is inactive")

        if user.account_locked_until and user.account_locked_until > datetime.utcnow():
            raise HTTPException(status_code=423, detail="Account is locked")

        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        db.commit()

        access_token_expires = timedelta(days=7)
        access_token = create_access_token(
            data={"email": user.email}, expires_delta=access_token_expires
        )

        await logging_service.log_auth_event(
            user_id=user.id,
            action="LOGIN_SUCCESS",
            status="success",
            details={
                "email": request.email,
                "auth_method": "email_password",
            },
            ip_address=client_ip,
            user_agent=user_agent,
        )

        response = JSONResponse(
            content={
                "message": "Login successful",
                "user": {
                    "user_id": user.id,
                    "user_email": user.email,
                    "name": user.name,
                },
            }
        )

        is_production = os.getenv("ENVIRONMENT", "development") == "production"
        response.set_cookie(
            key="token",
            value=access_token,
            httponly=True,
            secure=is_production,
            samesite="lax",
            max_age=604800,
            path="/",
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")
    finally:
        db.close()


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest, req: Request):
    """Send password reset email"""
    db = SessionLocal()
    client_ip = req.client.host if req.client else None

    try:
        user = db.query(User).filter(User.email == request.email).first()

        # Don't reveal if user exists or not for security
        if not user or not user.password:
            # Return success even if user doesn't exist
            return {
                "message": "If an account exists with this email, you will receive a password reset link."
            }

        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        user.password_reset_token = reset_token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()

        # Send reset email
        try:
            reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
            send_password_reset_email(
                to_email=user.email,
                user_name=user.name,
                reset_link=reset_link,
                expires_in="1 hour",
                user_id=user.id,
            )
        except Exception as e:
            logger.error(f"Error sending reset email: {str(e)}")
            # Don't fail the request even if email fails
            pass

        await logging_service.log_auth_event(
            user_id=user.id,
            action="PASSWORD_RESET_REQUESTED",
            status="success",
            details={"email": user.email},
            ip_address=client_ip,
            user_agent=req.headers.get("User-Agent"),
        )

        return {
            "message": "If an account exists with this email, you will receive a password reset link."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forgot password error: {str(e)}")
        return {
            "message": "If an account exists with this email, you will receive a password reset link."
        }
    finally:
        db.close()


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, req: Request):
    """Reset password using token"""
    db = SessionLocal()
    client_ip = req.client.host if req.client else None

    try:
        user = db.query(User).filter(User.password_reset_token == request.token).first()

        if not user:
            raise HTTPException(
                status_code=400, detail="Invalid or expired reset token"
            )

        if (
            not user.password_reset_expires
            or user.password_reset_expires < datetime.utcnow()
        ):
            user.password_reset_token = None
            user.password_reset_expires = None
            db.commit()
            raise HTTPException(status_code=400, detail="Reset token has expired")

        if len(request.new_password) < 8:
            raise HTTPException(
                status_code=400, detail="Password must be at least 8 characters"
            )

        # Update password
        user.password = hash_password(request.new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        user.failed_login_attempts = 0
        user.account_locked_until = None
        user.updated_at = datetime.utcnow()
        db.commit()

        await logging_service.log_auth_event(
            user_id=user.id,
            action="PASSWORD_RESET_SUCCESS",
            status="success",
            details={"email": user.email},
            ip_address=client_ip,
            user_agent=req.headers.get("User-Agent"),
        )

        return {
            "message": "Password reset successful. You can now log in with your new password."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset password")
    finally:
        db.close()


@router.get("/google/callback")
async def auth(request: Request):
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    
    try:
        token = await oauth.auth_demo.authorize_access_token(request)
    except Exception as e:
        logger.error(f"OAuth token error: {str(e)}")
        
        # Log failed OAuth token exchange
        await logging_service.log_auth_event(
            user_id=None,
            action="OAUTH_TOKEN_FAILED",
            status="failure",
            details={"provider": "google", "error": str(e)},
            ip_address=client_ip,
            user_agent=user_agent,
            error_message=str(e),
        )
        
        raise HTTPException(status_code=401, detail="Google authentication failed")

    try:
        user_info_endpoint = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f'Bearer {token["access_token"]}'}
        google_response = requests.get(user_info_endpoint, headers=headers)
        user_info = google_response.json()
    except Exception as e:
        logger.error(f"User info fetch error: {str(e)}")
        raise HTTPException(status_code=401, detail="Failed to get user info")

    user = token.get("userinfo")
    expires_in = token.get("expires_in", 3600)  # Default to 1 hour
    user_id = user.get("sub") if user else user_info.get("id")
    iss = user.get("iss") if user else "https://accounts.google.com"
    user_email = user.get("email") if user else user_info.get("email")

    # Get profile data from Google API response
    user_name = user_info.get("name")
    user_pic = user_info.get("picture")

    if iss not in ["https://accounts.google.com", "accounts.google.com"]:
        raise HTTPException(status_code=401, detail="Google authentication failed.")

    if user_id is None or user_email is None:
        raise HTTPException(status_code=401, detail="Missing user information from Google.")

    # Store user data in database
    try:
        user_data = upsert_user(user_id, user_email, user_name, user_pic)
        if user_data is None:
            logger.error(f"upsert_user returned None for email: {user_email}")
            raise HTTPException(status_code=500, detail="Failed to store user data")
    except Exception as e:
        logger.error(f"Error storing user data for {user_email}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to store user data: {str(e)}")

    # Create JWT token with 7 day expiration
    access_token_expires = timedelta(days=7)
    access_token = create_access_token(
        data={
            "email": user_email
        }, 
        expires_delta=access_token_expires
    )

    # Log successful login
    await logging_service.log_auth_event(
        user_id=user_id,
        action="LOGIN_SUCCESS",
        status="success",
        details={
            "provider": "google",
            "email": user_email,
            "name": user_name,
            "token_expires_days": 7,
        },
        ip_address=client_ip,
        user_agent=user_agent,
    )

    redirect_url = request.session.pop("login_redirect", REDIRECT_URL)
    response = RedirectResponse(redirect_url)

    is_production = os.getenv("ENVIRONMENT", "development") == "production"
    response.set_cookie(
        key="token",
        value=access_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=expires_in,
        path="/",
    )

    return response


@router.get("/logout")
async def logout(request: Request, token: str = Cookie(None)):
    # Get user info before clearing session
    user_id = None
    if token:
        try:
            user = get_current_user(token)
            user_id = user.get("user_id")
        except:
            pass
    
    request.session.clear()
    
    # Log logout
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")
    
    await logging_service.log_auth_event(
        user_id=user_id,
        action="LOGOUT",
        status="success",
        details={},
        ip_address=client_ip,
        user_agent=user_agent,
    )
    
    response = JSONResponse(content={"message": "Logged out successfully."})
    response.delete_cookie("token")
    return response


@router.post("/setup-location")
async def setup_location(request: Request, token: str = Cookie(None)):
    """Setup user location during signup (called from frontend)

    Frontend will call this with geolocation data from browser/IP API
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user = get_current_user(token)
        user_id = user["user_id"]
    except HTTPException:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        body = await request.json()
        location = body.get("location")
        latitude = body.get("latitude")
        longitude = body.get("longitude")

        # Allow null values for global alerts mode (skip location setup)
        is_global_alerts = location is None and latitude is None and longitude is None

        if not is_global_alerts and (not location or latitude is None or longitude is None):
            raise HTTPException(status_code=400, detail="Missing location data")

        from db_utils.db import SessionLocal, User

        db = SessionLocal()
        try:
            user_obj = db.query(User).filter(User.id == user_id).first()
            if not user_obj:
                raise HTTPException(status_code=404, detail="User not found")

            if is_global_alerts:
                # Set to null for global alerts mode
                user_obj.location = None
                user_obj.latitude = None
                user_obj.longitude = None
                logger.info(f"✅ User {user_id} opted for global alerts (no location)")
                change_summary = "User opted for global alerts (no location)"
            else:
                user_obj.location = location
                user_obj.latitude = float(latitude)
                user_obj.longitude = float(longitude)
                logger.info(f"✅ Set location for user {user_id}: {location}")
                change_summary = f"User set location to {location}"

            db.commit()

            # Log location setup
            client_ip = request.client.host if request.client else None
            user_agent = request.headers.get("User-Agent")
            
            await logging_service.log_audit(
                user_id=user_id,
                action="LOCATION_SETUP",
                resource_type="user",
                resource_id=user_id,
                new_value={"location": location, "latitude": latitude, "longitude": longitude},
                change_summary=change_summary,
                ip_address=client_ip,
                user_agent=user_agent,
                is_admin_action=False,
            )

            return {
                "status": "success",
                "location": location,
                "latitude": latitude,
                "longitude": longitude,
            }
        finally:
            db.close()

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid latitude/longitude")
    except Exception as e:
        logger.error(f"Error setting location: {e}")
        raise HTTPException(status_code=500, detail="Failed to set location")


class UpdateNameRequest(BaseModel):
    name: str


@router.put("/update-name")
async def update_name(request: Request, name_data: UpdateNameRequest, token: str = Cookie(None)):
    """Update user's name"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user = get_current_user(token)
        user_id = user["user_id"]
    except HTTPException:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if not name_data.name or not name_data.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    from db_utils.db import SessionLocal, User

    db = SessionLocal()
    try:
        user_obj = db.query(User).filter(User.id == user_id).first()
        if not user_obj:
            raise HTTPException(status_code=404, detail="User not found")

        old_name = user_obj.name
        user_obj.name = name_data.name.strip()
        user_obj.updated_at = datetime.utcnow()

        db.commit()

        # Log name update
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")
        
        await logging_service.log_audit(
            user_id=user_id,
            action="NAME_UPDATED",
            resource_type="user",
            resource_id=user_id,
            old_value={"name": old_name},
            new_value={"name": name_data.name.strip()},
            change_summary=f"User updated name from '{old_name}' to '{name_data.name.strip()}'",
            ip_address=client_ip,
            user_agent=user_agent,
            is_admin_action=False,
        )

        return {
            "status": "success",
            "name": user_obj.name,
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating name: {e}")
        raise HTTPException(status_code=500, detail="Failed to update name")
    finally:
        db.close()


@router.delete("/delete-account")
async def delete_account(request: Request, token: str = Cookie(None)):
    """Delete user's own account (soft delete)"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user = get_current_user(token)
        user_id = user["user_id"]
    except HTTPException:
        raise HTTPException(status_code=401, detail="Not authenticated")

    from db_utils.db import SessionLocal, User

    db = SessionLocal()
    try:
        user_obj = db.query(User).filter(User.id == user_id).first()
        if not user_obj:
            raise HTTPException(status_code=404, detail="User not found")

        # Soft delete by setting deleted_at
        user_obj.deleted_at = datetime.utcnow()
        user_obj.is_active = False
        user_obj.updated_at = datetime.utcnow()

        db.commit()

        # Log account deletion
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("User-Agent")
        
        await logging_service.log_audit(
            user_id=user_id,
            action="ACCOUNT_DELETED",
            resource_type="user",
            resource_id=user_id,
            change_summary="User deleted their own account",
            ip_address=client_ip,
            user_agent=user_agent,
            is_admin_action=False,
        )

        # Clear the session cookie
        response = JSONResponse({
            "status": "success",
            "message": "Account deleted successfully"
        })
        # Delete cookie with same parameters as set_cookie (httponly=True, secure=False, samesite="lax")
        response.delete_cookie(
            "token",
            path="/",
            samesite="lax"
        )

        return response
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting account: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete account")
    finally:
        db.close()
