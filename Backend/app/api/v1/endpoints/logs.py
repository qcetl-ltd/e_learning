from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from app.db.session import SessionLocal
from app.db.models import AuthLog

router = APIRouter()

@router.get("/auth-logs")
async def get_auth_logs():
    """Fetches authentication logs."""
    async with SessionLocal() as db:
        result = await db.execute(select(AuthLog))
        logs = result.scalars().all()
    return logs    