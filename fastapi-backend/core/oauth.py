# core/oauth.py
from authlib.integrations.starlette_client import OAuth
from fastapi import Request, HTTPException, status
from core.config import settings
import secrets
import logging

logger = logging.getLogger(__name__)

logger.info("SessionMiddleware initialized with a secure secret key.")

oauth = OAuth()

# Google OAuth setup
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
    },
)

# Microsoft OAuth setup
oauth.register(
    name="microsoft",
    client_id=settings.MICROSOFT_CLIENT_ID,
    client_secret=settings.MICROSOFT_CLIENT_SECRET,
    server_metadata_url="https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile",
        "redirect_uri": settings.MICROSOFT_REDIRECT_URI,
    },
)

# Facebook OAuth setup
oauth.register(
    name="facebook",
    client_id=settings.FACEBOOK_CLIENT_ID,
    client_secret=settings.FACEBOOK_CLIENT_SECRET,
    access_token_url="https://graph.facebook.com/v12.0/oauth/access_token",
    authorize_url="https://www.facebook.com/v12.0/dialog/oauth",
    api_base_url="https://graph.facebook.com/v12.0/",
    client_kwargs={
        "scope": "email",
        "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
    },
)

# Helper functions to build auth and callback URLs


def generate_state():
    state = secrets.token_urlsafe(16)
    logger.info(f"Generated state nonce: {state}")
    return state


async def get_authorization_url(request: Request, provider: str):
    # Generate and store a new state
    state = secrets.token_urlsafe(32)
    request.session["oauth_state_google"] = state  # Use consistent key
    logger.info(f"Generated state for {provider}: {state}")
    logger.info(f"Session data after storing state: {request.session}")

    redirect_uri = getattr(settings, f"{provider.upper()}_REDIRECT_URI")
    return await getattr(oauth, provider).authorize_redirect(request, redirect_uri)


async def get_user_info(request: Request, provider: str):
    # Validate the state parameter
    logger.info(f"Session data during callback: {request.session}")
    session_state = request.session.get(
        "oauth_state_google")  # Use consistent key
    request_state = request.query_params.get("state")

    if not session_state:
        logger.error("Session state is missing or expired.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session state is missing or expired."
        )

    if session_state != request_state:
        logger.error(
            f"State mismatch: session={session_state}, request={request_state}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="State mismatch: possible CSRF attack"
        )

    # Clear the state after validation
    del request.session["oauth_state_google"]

    token = await getattr(oauth, provider).authorize_access_token(request)

    if provider in ["google", "microsoft"]:
        user_info = await getattr(oauth, provider).parse_id_token(request, token)
    else:
        # For Facebook, we need to make an API call
        resp = await oauth.facebook.get("me", token=token, params={"fields": "id,name,email,first_name,last_name,picture"})
        user_info = resp.json()

    return user_info
