from app.db.base_class import Base
from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, Boolean
from datetime import datetime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import INET
import bcrypt

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(Text, nullable=True)
    status_id = Column(Integer, ForeignKey("status.id", ondelete="CASCADE"), nullable=False, index=True)
    auth_source = Column(String(50))
    failed_attempts = Column(Integer, default=0)
    last_failed_attempt = Column(TIMESTAMP)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP, default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, default=func.now(), onupdate=func.now(), nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)

    tenant = relationship("Tenant", back_populates="users")
    status = relationship("Status", back_populates="users")
    auth_logs = relationship("AuthLog", back_populates="user", cascade="all, delete-orphan")

    @classmethod
    def hash_password(cls, password: str) -> str:
        if not password:
            raise ValueError("Password cannot be empty")
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    @classmethod
    def verify_password(cls, password: str, password_hash: str) -> bool:
        if not password_hash:
            return False
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


class Status(Base):
    __tablename__ = "status"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    created_at = Column(TIMESTAMP, default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, default=func.now(), onupdate=func.now(), nullable=False)

    users = relationship("User", back_populates="status")


class AuthLog(Base):
    __tablename__ = "auth_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(String(255), nullable=False)
    event_time = Column(TIMESTAMP, default=func.now(), nullable=False)
    failure_reason = Column(String(255), nullable=True)
    success = Column(Boolean, nullable=False, default=False)

    user = relationship("User", back_populates="auth_logs")
    event = relationship("Event", back_populates="auth_logs")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    created_at = Column(TIMESTAMP, default=func.now(), nullable=False)
    
    auth_logs = relationship("AuthLog", back_populates="event", cascade="all, delete-orphan")


class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)

    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
