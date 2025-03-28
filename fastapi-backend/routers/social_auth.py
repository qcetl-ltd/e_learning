# routers/social_auth.py
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import timedelta
import logging
import traceback
import os
from typing import Optional  # Add this import
import secrets  # Add this import
from urllib.parse import urlencode  # Add this import

from database import get_db
from core.config import settings
from core.oauth import get_authorization_url, get_user_info
from core.security import create_access_token
from schemas import SocialLoginResponse, UserResponse
from models import User, OAuthAccount

# Set up logging
logger = logging.getLogger("routers.social_auth")

GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

router = APIRouter(prefix=f"{settings.API_V1_STR}/auth",
                   tags=["social_authentication"])

# Helper function to process social login


async def process_social_login(db: Session, provider: str, user_info: dict):
    # Extract user data from provider-specific format
    provider_user_id = user_info.get("sub") or user_info.get("id")

    if not provider_user_id:
        logger.error(
            f"Failed to get provider_user_id from {provider}. User info: {user_info}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not retrieve user ID from {provider}"
        )

    # Check if this social account exists
    oauth_account = db.query(OAuthAccount).filter(
        OAuthAccount.provider == provider,
        OAuthAccount.provider_user_id == str(
            provider_user_id)  # Ensure it's a string
    ).first()

    # Extract email and names based on provider
    email = user_info.get("email")
    first_name = user_info.get(
        "given_name") or user_info.get("first_name") or ""
    last_name = user_info.get(
        "family_name") or user_info.get("last_name") or ""

    logger.info(f"Processing login for {provider} user: {email}")

    # If Facebook doesn't provide email separately
    if provider == "facebook" and not email and "name" in user_info:
        names = user_info["name"].split(" ", 1)
        if len(names) > 0 and not first_name:
            first_name = names[0]
        if len(names) > 1 and not last_name:
            last_name = names[1]

    # User exists with this social account
    if oauth_account:
        logger.info(
            f"Found existing OAuth account for {provider} user: {provider_user_id}")
        user = oauth_account.user
    else:
        # Check if user exists with this email
        if email:
            user = db.query(User).filter(User.email == email).first()
        else:
            user = None
            logger.warning(
                f"No email provided by {provider} for user: {provider_user_id}")

        if not user:
            # Create new user
            if not email:
                # Generate a placeholder email if none provided
                email = f"{provider}_{provider_user_id}@example.com"

            logger.info(f"Creating new user for {provider} login: {email}")
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_verified=True  # Auto-verify social logins
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Link social account to user
        logger.info(
            f"Linking {provider} account {provider_user_id} to user {user.id}")
        oauth_account = OAuthAccount(
            user_id=user.id,
            provider=provider,
            provider_user_id=str(provider_user_id),
            # Removed provider_access_token field
        )
        db.add(oauth_account)
        db.commit()

    # Create access token
    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# Google Auth Routes


@router.get("/google/login")
async def google_login(request: Request):
    # Generate state
    state = secrets.token_urlsafe(32)
    request.session["oauth_state"] = state

    # Use GOOGLE_REDIRECT_URI from environment variables
    redirect_uri = GOOGLE_REDIRECT_URI  # Updated to use the correct redirect URI
    params = {
        "response_type": "code",
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": "openid email profile",
        "state": state
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(auth_url)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    state: str = Query(...),
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None)
):
    # Verify state
    stored_state = request.session.get("oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(
            status_code=400,
            detail="Invalid state parameter"
        )

    # Clear the state from session after verification
    request.session.pop("oauth_state", None)
# Microsoft Auth Routes


@router.get("/microsoft/login")
async def microsoft_login(request: Request):
    """Initiate Microsoft OAuth flow"""
    try:
        logger.info("Starting Microsoft OAuth login flow")
        return await get_authorization_url(request, "microsoft")
    except Exception as e:
        logger.error(f"Error in microsoft_login: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth initialization error: {str(e)}"
        )


@router.get("/microsoft/callback")
async def microsoft_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Microsoft OAuth callback"""
    try:
        logger.info("Handling Microsoft OAuth callback")

        # Directly fetch user info without state validation
        user_info = await get_user_info(request, "microsoft")
        result = await process_social_login(db, "microsoft", user_info)

        # Redirect to the frontend after successful login
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={result['access_token']}"
        return RedirectResponse(url=redirect_url)
    except Exception as e:
        logger.error(f"Error in microsoft_callback: {str(e)}")
        logger.error(traceback.format_exc())
        error_redirect = f"{settings.FRONTEND_URL}/auth/error?message={str(e)}"
        return RedirectResponse(url=error_redirect)

# Facebook Auth Routes


@router.get("/facebook/login")
async def facebook_login(request: Request):
    """Initiate Facebook OAuth flow"""
    try:
        logger.info("Starting Facebook OAuth login flow")
        return await get_authorization_url(request, "facebook")
    except Exception as e:
        logger.error(f"Error in facebook_login: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth initialization error: {str(e)}"
        )


@router.get("/facebook/callback")
async def facebook_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Facebook OAuth callback"""
    try:
        logger.info("Handling Facebook OAuth callback")

        # Directly fetch user info without state validation
        user_info = await get_user_info(request, "facebook")
        result = await process_social_login(db, "facebook", user_info)

        # Redirect to the frontend after successful login
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={result['access_token']}"
        return RedirectResponse(url=redirect_url)
    except Exception as e:
        logger.error(f"Error in facebook_callback: {str(e)}")
        logger.error(traceback.format_exc())
        error_redirect = f"{settings.FRONTEND_URL}/auth/error?message={str(e)}"
        return RedirectResponse(url=error_redirect)
