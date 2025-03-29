import logging
import re
from fastapi import APIRouter, Depends, HTTPException, Request, status ,Body
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta
from authlib.integrations.starlette_client import OAuthError
from passlib.context import CryptContext
from typing import Optional
from datetime import datetime
from app.db.session import get_db, SessionLocal
from app.db.models import User, Tenant, AuthLog, Status
from app.core.email import send_email
from app.core.security import create_confirmation_token, create_access_token, create_refresh_token 
from app.core.oauth import oauth
from app.schemas.user import RegisterRequest, UserOut ,UserLogin
from app.api.routes.dependencies import get_current_user
from app.core.config import settings
from app.services.auth import authenticate_user, log_registration_attempt
from pydantic import BaseModel, EmailStr
from app.core.security import authenticate_user_by_email
from app.db.models import User

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

logger = logging.getLogger(__name__)

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

class EmailLoginRequest(BaseModel):
    email: str
    password: str

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


@router.post("/login", response_model=TokenResponse)
async def email_login(
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    try:
       
        user = await authenticate_user_by_email(db, user_data.email, user_data.password)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        access_token = create_access_token({"sub": str(user.id)})
        refresh_token = create_refresh_token({"sub": str(user.id)})

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/{provider}")
async def social_login(
    request: Request,
    provider: str,
):
    if provider not in ["google", "facebook", "microsoft"]:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    try:
        redirect_uri = f"{settings.BACKEND_URL}/api/v1/auth/{provider}/callback"
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Route configuration error: {str(e)}"
        )
    
    return await oauth.create_client(provider).authorize_redirect(request, redirect_uri)


@router.get("/{provider}/callback", name="social_callback")
async def social_callback(
    provider: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    try:
        client = oauth.create_client(provider)
        token = await client.authorize_access_token(request)
        user_info = await client.userinfo(token=token)

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

# Ensure this function accepts the db argument
async def log_registration_attempt(
    db: AsyncSession,  
    user_id: Optional[int] = None,
    success: bool = False,
    request: Request = None,
    failure_reason: Optional[str] = None
):
    
    try:
       
        log_entry = AuthLog(
            user_id=user_id,
            success=success,
            failure_reason=failure_reason,
            ip_address=request.client.host if request else None,
            user_agent=request.headers.get("user-agent", "unknown"),
            event_time=datetime.utcnow(),
        )
        db.add(log_entry)
        await db.commit()
    except Exception as e:
       
        await db.rollback()
        print(f"Error logging auth attempt: {str(e)}")


@router.post("/register")
async def register_user(
    request: Request, 
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        async with db.begin():
            # Password validation
            is_valid, error_msg = validate_password(user_data.password)
            if not is_valid:
                raise HTTPException(status_code=400, detail=error_msg)

            # Check existing user
            user_email_result = await db.execute(
                select(User).filter(User.email == user_data.email)
            )
            if user_email_result.scalar_one_or_none():
                raise HTTPException(400, "Email already registered")

            user_username_result = await db.execute(
                select(User).filter(User.username == user_data.username)
            )
            if user_username_result.scalar_one_or_none():
                raise HTTPException(400, "Username already taken")

            # Tenant handling
            tenant_id = None
            if user_data.tenant_name:
                tenant_result = await db.execute(
                    select(Tenant).filter(Tenant.name == user_data.tenant_name)
                )
                tenant = tenant_result.scalar_one_or_none()
                
                if not tenant:
                    tenant = Tenant(name=user_data.tenant_name)
                    db.add(tenant)
                    await db.flush()
                
                tenant_id = tenant.id

            # Ensure status_id 1 exists in the status table
            status_result = await db.execute(
                select(Status).filter(Status.id == 1)
            )
            if not status_result.scalar_one_or_none():
                db.add(Status(id=1, name='Active'))
                await db.flush()

            # Create user
            user = User(
                username=user_data.username,
                email=user_data.email,
                password_hash=User.hash_password(user_data.password),
                tenant_id=tenant_id,
                status_id=1,
                
            )

            
                                         
            db.add(user)
        
        # After successful commit
        confirmation_token = create_confirmation_token(user.email)
        confirmation_url = f"{settings.FRONTEND_URL}/confirm-email/{confirmation_token}"
        
        send_email(
            to_email=user.email,
            subject="Confirm Your Email",
            body=f"Confirm email: {confirmation_url}"
        )
        

    except Exception as e:
        await db.rollback()
        await log_registration_attempt(
            db=db,
            user_id=None,
            success=False,
            request=request,
            failure_reason=str(e)
        )
        raise HTTPException(status_code=500, detail="Internal server error")
