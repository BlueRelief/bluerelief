from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/status")
async def auth_status():
    return {"message": "Auth service is running", "authenticated": False}
