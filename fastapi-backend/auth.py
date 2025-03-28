import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional

from core.config import settings
from core.security import verify_password
from database import get_db
from models import User
from schemas import TokenData

# Configure logging
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False  # Don't auto-raise exception for missing token
)

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not user.hashed_password:
        # User exists but has no password (social login only)
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    logger.debug(f"Token received: {token and token[:10]}...")
    
    if token is None:
        logger.warning("No token provided")
        return None
        
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        logger.debug(f"Attempting to decode token with secret key: {settings.SECRET_KEY[:5]}...")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        logger.debug(f"Token decoded successfully, email: {email}")
        
        if email is None:
            logger.warning("No email found in token")
            raise credentials_exception
            
        token_data = TokenData(email=email)
    except JWTError as e:
        logger.error(f"JWT Error: {str(e)}")
        raise credentials_exception
    
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        logger.warning(f"No user found with email: {token_data.email}")
        raise credentials_exception
        
    logger.debug(f"User authenticated: {user.email}")
    return user

async def get_current_active_user(current_user: Optional[User] = Depends(get_current_user)):
    if current_user is None:
        logger.warning("No current user from token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not current_user.is_active:
        logger.warning(f"Inactive user: {current_user.email}")
        raise HTTPException(status_code=400, detail="Inactive user")
        
    logger.debug(f"Active user: {current_user.email}")
    return current_user