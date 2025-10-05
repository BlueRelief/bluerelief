from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from routers import auth
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="BlueRelief API",
    description="A simple FastAPI starter application",
    version="1.0.0"
)

# Add session middleware for OAuth state management
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY", "your-secret-key-here")
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "Welcome to BlueRelief API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/test")
async def test_endpoint():
    return {"message": "API is working!", "data": {"test": True}}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
