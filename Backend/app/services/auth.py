from fastapi import HTTPException, status,Depends
from app.db.session import SessionLocal
from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.db.models import Event ,AuthLog,User
from app.core.security import create_access_token ,create_refresh_token
from app.core.security import decode_token
from passlib.context import CryptContext 
from datetime import datetime


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password ,hashed_password):
    return pwd_context.verify(plain_password,hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)
async def authenticate_user(
        db:AsyncSession,
        email:str,
        password:str
):
    
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user or not User.verify_password(password, user.password_hash):
        return None
    return user

async def login_user(user: User):
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

async def log_registration_attempt(user_id: int, success: bool, ip_address: str, user_agent: str, failure_reason: str = None):
    async with SessionLocal() as db:
        try:
            event = await db.execute(select(Event).filter_by(name="User Registration"))
            event = event.scalar_one_or_none()
            
            if not event:
                event = Event(name="User Registration", description="User registration attempts")
                db.add(event)
                await db.commit()
                await db.refresh(event)

            log_entry = AuthLog(
                user_id=user_id if success else None,
                event_id=event.id,
                ip_address=ip_address,
                user_agent=user_agent,
                success=success,
                failure_reason=failure_reason
            )
            
            db.add(log_entry)
            await db.commit()
        except Exception as e:
            print(f"Error logging registration attempt: {str(e)}")

async def log_auth_attempt(user_id:int,success:bool,ip_address:str,user_agent:str,failture_reason:str=None):
     """Logs authentication attempts including failures and successes."""
     async with SessionLocal() as db:
         result = await db.execute(select(Event).filter_by(name="User Authentication"))
         event = result.scalar_one_or_none()

         if not event:
             event = Event(name="User Authentication",description="Logs user authentication attempts")
             db.add(event)
             await db.commit()
             await db.refresh(event)

        # create a log entry
             log_entry =AuthLog(
              user_id=user_id,
              event_id =event.id,
              ip_address=ip_address,
              user_agent=user_agent,
              success=success,
              failture_reason=failture_reason
          )
         
             db.add(log_entry)
             await db.commit()


async def handle_social_login(email: str, name: str, provider: str, db: AsyncSession):
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            username=name,
            auth_source=provider.upper(),
            status_id=1, 
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return await login_user(user)