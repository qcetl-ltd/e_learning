from authlib.integrations.starlette_client import OAuth
from fastapi import Request
from app.core.config import settings

oauth = OAuth()

# Google OAuth
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid profile email",
        "prompt": "select_account",
        "nonce": True
    }

)

# Facebook OAuth
oauth.register(
    name="facebook",
    client_id=settings.FACEBOOK_CLIENT_ID,
    client_secret=settings.FACEBOOK_CLIENT_SECRET,
    authorize_url="https://www.facebook.com/v10.0/dialog/oauth",
    access_token_url="https://graph.facebook.com/v10.0/oauth/access_token",
    userinfo_url="https://graph.facebook.com/me?fields=id,name,email",
    client_kwargs={"scope": "email"},

)


# Microsoft OAuth
oauth.register(
    name="microsoft",
    client_id=settings.MICROSOFT_CLIENT_ID,
    client_secret=settings.MICROSOFT_CLIENT_SECRET,
    authorize_url="https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize",
    access_token_url="https://login.microsoftonline.com/organizations/oauth2/v2.0/token",
    userinfo_url="https://graph.microsoft.com/v1.0/me",
    client_kwargs={
        "scope": "openid profile email User.Read",
        "prompt": "select_account",
        "tenant": "organizations" 
    },
)
