# models.py
import sqlalchemy
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Made nullable for social logins
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    email_verification_token = Column(String, nullable=True)
    email_verification_token_expires = Column(DateTime(timezone=True), nullable=True)
    is_verified = Column(Boolean, default=False)
   
    # Social auth related fields
    oauth_accounts = relationship("OAuthAccount", back_populates="user")

  
class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    provider = Column(String, nullable=False)  # "google", "microsoft", "facebook"
    provider_user_id = Column(String, nullable=False)
    # Removed provider_access_token to match the database schema
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Create unique constraint for provider + provider_user_id
    __table_args__ = (
        sqlalchemy.UniqueConstraint("provider", "provider_user_id", name="uq_oauth_account_provider_id"),
    )
    
    user = relationship("User", back_populates="oauth_accounts")