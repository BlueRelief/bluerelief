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
from google.oauth2 import service_account
import google.auth.transport.requests
from google.oauth2.id_token import verify_oauth2_token
from db_utils.db import upsert_user, get_user_by_email
import logging as logger

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
            "picture": user_data["picture"]
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
                "picture": user.get("picture")
            }
        }
    except HTTPException:
        return {"authenticated": False}


@router.get("/google/login")
async def login(request: Request):
    request.session.clear()
    request.session["login_redirect"] = REDIRECT_URL
    callback_url = f"{BACKEND_URL}/auth/google/callback"

    return await oauth.auth_demo.authorize_redirect(
        request, callback_url, prompt="consent"
    )


@router.get("/google/callback")
async def auth(request: Request):
    try:
        token = await oauth.auth_demo.authorize_access_token(request)
    except Exception as e:
        logger.error(f"OAuth token error: {str(e)}")
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
    user_data = upsert_user(user_id, user_email, user_name, user_pic)
    if user_data is None:
        raise HTTPException(status_code=500, detail="Failed to store user data")

    # Create JWT token with 7 day expiration
    access_token_expires = timedelta(days=7)
    access_token = create_access_token(
        data={
            "email": user_email
        }, 
        expires_delta=access_token_expires
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
async def logout(request: Request):
    request.session.clear()
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

        if not location or latitude is None or longitude is None:
            raise HTTPException(status_code=400, detail="Missing location data")

        from db_utils.db import SessionLocal, User

        db = SessionLocal()
        try:
            user_obj = db.query(User).filter(User.id == user_id).first()
            if not user_obj:
                raise HTTPException(status_code=404, detail="User not found")

            user_obj.location = location
            user_obj.latitude = float(latitude)
            user_obj.longitude = float(longitude)
            db.commit()

            logger.info(f"✅ Set location for user {user_id}: {location}")

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
