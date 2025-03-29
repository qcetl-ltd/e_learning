from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from app.core.config import settings
from app.api.v1.endpoints.auth import router as auth_router
import secrets

# Import API Endpoints
from app.api.v1.endpoints import user, auth ,logs

# Create FastAPI Instance
app = FastAPI()

# Add Session Middleware
SECRET_KEY = secrets.token_hex(32)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie="session_cookie",
    same_site="lax",
    https_only=False 
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Redirect to HTTPS
# if settings.ENVIRONMENT == "development":
#     app.add_middleware(HTTPSRedirectMiddleware)

# Include Routers
app.include_router(user.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(logs.router, prefix="/logs", tags=["logs"])
app.include_router(auth.router )