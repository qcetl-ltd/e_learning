# schemas.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, timedelta

class UserBase(BaseModel):
    email: EmailStr

# Add a new model for email verification
class EmailVerification(BaseModel):
    email: EmailStr
    token: str
    created_at: datetime
    expires_at: datetime
    
class UserCreate(UserBase):
    first_name: str
    last_name: str
    password: str = Field(..., min_length=8)
    confirm_password: str
    is_verified: bool = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class OAuthAccountResponse(BaseModel):
    provider: str
    provider_user_id: str
    
    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    first_name: str
    last_name: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    oauth_accounts: List[OAuthAccountResponse] = []
    
    class Config:
        from_attributes = True

class SocialLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse