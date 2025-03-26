import secrets
import traceback
import re

from app.db.models import User, Tenant
from app.db.session import SessionLocal
from app.core.email import send_email
from app.core.security import create_confirmation_token
from app.services.auth import log_registration_attempt


from fastapi import APIRouter, Depends, HTTPException, Request, Query ,status
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta
from authlib.integrations.starlette_client import OAuthError
from passlib.context import CryptContext
from typing import Optional
from datetime import datetime
from app.schemas.user import RegisterRequest
from sqlalchemy.exc import IntegrityError

from app.services.auth import authenticate_user
from app.core.config import settings
from pydantic import BaseModel
from app.db.session import get_db
from app.core.oauth import oauth
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_jwt_token,
)
from app.db.models import User, Tenant, AuthLog
from app.schemas.user import UserOut
from app.api.routes.dependencies import get_current_user
from app.core.config import settings


router = APIRouter(prefix="/api/v1/auth" ,tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

# Helper functions
async def get_or_create_user(db: AsyncSession, email: str, provider: str, user_info: dict):
    
    try:
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                email=email,
                username=user_info.get("name", email.split("@")[0]),
                auth_source=provider.upper(),
                password_hash="",
                status_id=1,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        return user
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# Unified social auth handler
async def handle_social_auth(provider: str, request: Request, db: AsyncSession):
    try:
        client = oauth.create_client(provider)
        token = await client.authorize_access_token(request)
        user_info = await client.parse_id_token(request, token)
        
        if not user_info.get("email"):
            raise HTTPException(status_code=400, detail="Email not provided by provider")

        async with db.begin():
            user = await get_or_create_user(db, user_info["email"], provider, user_info)
        
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?"
                f"access_token={access_token}&"
                f"refresh_token={refresh_token}&"
                f"expires_in={settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60}"
        )
    except OAuthError as e:
        raise HTTPException(status_code=400, detail=f"{provider} authentication failed: {str(e)}")

# Auth endpoints
@router.post("/login", response_model=TokenResponse)
async def email_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "refresh_token": create_refresh_token({"sub": str(user.id)}),
        "token_type": "bearer",
    }

@router.get("/{provider}")
async def social_login(
    request: Request,
    provider: str,):
    if provider not in ["google", "facebook", "microsoft"]:
        raise HTTPException(status_code=404, detail="Provider not found")
    
   
    try:
        redirect_uri =  f"{settings.BACKEND_URL}/api/v1/auth/{provider}/callback"
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Route configuration error: {str(e)}"
        )
    
    return await oauth.create_client(provider).authorize_redirect(request, redirect_uri)


@router.get("/{provider}/callback" , name="social_callback")
async def social_callback(
    provider: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
   

    try:
        print(f"Received callback from {provider}")
        client = oauth.create_client(provider)
        token = await client.authorize_access_token(request)
        print(f"Token received: {token}")

      
        user_info = await client.userinfo(token=token)
        
        print(f"User info: {user_info}")

        if not user_info.get("email"):
            raise HTTPException(status_code=400, detail="Email not provided by provider")

        async with db.begin():
            user = await get_or_create_user(db, user_info["email"], provider, user_info)
        
        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?"
                f"access_token={access_token}&"
                f"refresh_token={refresh_token}&"
                f"expires_in={settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60}"
        )
    except OAuthError as e:
        print(f"OAuth error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"{provider} authentication failed: {str(e)}")

    
@router.get("/me", response_model=UserOut)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user



def validate_password(password: str) -> tuple[bool, str]:
    """Validate password strength and return (is_valid, error_message)"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number"
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"
    return True, ""



async def get_db():
    async with SessionLocal() as db:
        yield db

@router.post("/register")
async def register_user(
    request: Request, 
    user_data: RegisterRequest,  # Using Pydantic model
    db: AsyncSession = Depends(get_db)
):
    try:
        async with db.begin():  # Atomic transaction
            # Password validation
            is_valid, error_msg = validate_password(user_data.password)
            if not is_valid:
                raise HTTPException(400, detail=error_msg)

            # Check if user exists
            user_result = await db.execute(select(User).filter(User.email == user_data.email))
            if user_result.scalar_one_or_none():
                raise HTTPException(400, detail="Email already registered")

            # Tenant handling
            tenant_result = await db.execute(
                select(Tenant).filter(Tenant.name == user_data.tenant_name)
            )
            tenant = tenant_result.scalar_one_or_none()
            
            if not tenant:
                tenant = Tenant(name=user_data.tenant_name)
                db.add(tenant)
                await db.flush()  # Get ID without commit

            # Create user
            hashed_password = User.hash_password(user_data.password)
            user = User(
                username=user_data.username,
                email=user_data.email,
                password_hash=hashed_password,
                tenant_id=tenant.id,
                status_id=2,
            )
            db.add(user)
            await db.flush()

            # Generate confirmation token (outside transaction)
            confirmation_token = create_confirmation_token(user.email)
            confirmation_url = f"{settings.FRONTEND_URL}/confirm-email/{confirmation_token}"

            # Commit transaction
            await db.commit()

        # Send email (outside transaction)
        send_email(...)

        # Log success
        await log_registration_attempt(...)

        return JSONResponse(201, {"message": "User created - confirmation email sent"})

    except IntegrityError as e:
        await db.rollback()
        if "duplicate key" in str(e):
            raise HTTPException(400, "Tenant/User already exists")
        raise HTTPException(500, "Database error")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        await log_registration_attempt(...)
        raise HTTPException(500, "Internal Server Error")


async def log_registration_attempt(
    db: AsyncSession, 
    user_id: int, 
    success: bool, 
    request: Request, 
    failure_reason: Optional[str] = None
):
    try:
        log_entry = AuthLog(
            user_id=user_id,
            event_id=1,  # Assuming 1 corresponds to User Registration
            ip_address=request.client.host,
            user_agent=request.headers.get("user-agent", "Unknown"),
            event_time=datetime.utcnow(),
            failure_reason=failure_reason,
            success=success
        )

        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)  # Refresh the object to get the auto-generated ID

        # Optionally log or return the entry to confirm successful commit
        print(f"Log entry committed with ID: {log_entry.id}")

    except Exception as e:
        # await db.rollback()  # Roll back in case of failure
        print(f"Error logging registration attempt: {e}")
        raise HTTPException(status_code=500, detail="Error logging registration attempt")
