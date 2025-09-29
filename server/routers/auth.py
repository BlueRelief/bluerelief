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
from db_utils.db import log_user, log_token
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

        user_id: str = payload.get("sub")
        user_email: str = payload.get("email")

        if user_id is None or user_email is None:
            raise credentials_exception

        return {"user_id": user_id, "user_email": user_email}

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
            "user": {"user_id": user["user_id"], "user_email": user["user_email"]},
        }
    except HTTPException:
        return {"authenticated": False}


@router.get("/google/login")
async def login(request: Request):
    request.session.clear()
    redirect_url = os.getenv("REDIRECT_URL", "http://localhost:3000/dashboard")
    request.session["login_redirect"] = redirect_url
    callback_url = "http://localhost:8000/auth/google/callback"

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
    expires_in = token.get("expires_in")
    user_id = user.get("sub")
    iss = user.get("iss")
    user_email = user.get("email")
    first_logged_in = datetime.utcnow()
    last_accessed = datetime.utcnow()

    user_name = user_info.get("name")
    user_pic = user_info.get("picture")

    if iss not in ["https://accounts.google.com", "accounts.google.com"]:
        raise HTTPException(status_code=401, detail="Google authentication failed.")

    if user_id is None:
        raise HTTPException(status_code=401, detail="Google authentication failed")

    access_token_expires = timedelta(seconds=expires_in)
    access_token = create_access_token(
        data={"sub": user_id, "email": user_email}, expires_delta=access_token_expires
    )

    session_id = str(uuid.uuid4())
    log_user(user_id, user_email, user_name, user_pic, first_logged_in, last_accessed)
    log_token(access_token, user_email, session_id)

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
