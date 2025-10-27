from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from routers import auth
from routers import incidents
from routers import bluesky
from routers import dashboard
from routers import notifications
from routers import data_feed
from routers import alerts
from routers import admin_auth
from routers import admin_users
from routers import admin_settings
from routers import admin_dashboard
from routers import analysis
from routers import archive
from routers import admin_relevancy
from db_utils.db import init_db
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# Database migrations handled by Alembic
# Run: ./scripts/docker-dev.sh migrate


def get_version():
    # Priority: env var (set during build) > VERSION file > default
    env_version = os.getenv("VERSION")
    if env_version:
        return env_version

    version_file = Path(__file__).parent.parent / "VERSION"
    if version_file.exists():
        return version_file.read_text().strip()

    return "dev"


def get_commit_sha():
    return os.getenv("COMMIT_SHA", "unknown")


APP_VERSION = get_version()
COMMIT_SHA = get_commit_sha()

app = FastAPI(
    title="BlueRelief API",
    description="BlueRelief API with BlueSky Integration",
    version=APP_VERSION,
)

# Add session middleware for OAuth state management
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY", "your-secret-key-here")
)

# Add CORS middleware to allow frontend connections
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://localhost:8000",
]

if frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(incidents.router)
app.include_router(bluesky.router)
app.include_router(dashboard.router)
app.include_router(notifications.router)
app.include_router(data_feed.router)
app.include_router(alerts.router)
app.include_router(admin_auth.router)
app.include_router(admin_users.router)
app.include_router(admin_settings.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_relevancy.router)
app.include_router(analysis.router)
app.include_router(archive.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to BlueRelief API",
        "version": APP_VERSION,
        "commit": COMMIT_SHA,
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": APP_VERSION, "commit": COMMIT_SHA}


@app.get("/api/version")
async def version_info():
    return {
        "version": APP_VERSION,
        "commit": COMMIT_SHA,
        "environment": os.getenv("ENVIRONMENT", "development"),
    }


@app.get("/api/test")
async def test_endpoint():
    return {"message": "API is working!", "data": {"test": True}}


@app.get("/api/debug/config")
async def debug_config():
    return {
        "environment": os.getenv("ENVIRONMENT", "not_set"),
        "backend_url": os.getenv("BACKEND_URL", "not_set"),
        "frontend_url": os.getenv("FRONTEND_URL", "not_set"),
        "redirect_url": os.getenv("REDIRECT_URL", "not_set"),
        "google_client_id": (
            os.getenv("GOOGLE_CLIENT_ID", "not_set")[:20] + "..."
            if os.getenv("GOOGLE_CLIENT_ID")
            else "not_set"
        ),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
