# routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.config import settings
from database import get_db
from auth import get_current_active_user
from models import User
from schemas import UserResponse

router = APIRouter(prefix=f"{settings.API_V1_STR}/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    # Debugging: Log the current user
    print("Current user:", current_user)
    return current_user
