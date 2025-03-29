import jwt
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import decode_token
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import User
from app.schemas.user import UserCreate, UserOut
from app.core.security import create_confirmation_token
from app.core.email import send_email
from app.core.config import settings


router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=UserOut)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash the password
    hashed_password = User.hash_password(user.password)

    # Create new user
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        status_id=1  
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create the confirmation token
    confirmation_token = create_confirmation_token(user.email)
    print(f"🔹 Confirmation Token: {confirmation_token}")

    # Prepare the confirmation email body
    confirmation_url = f"http://127.0.0.1:8000/users/confirm/{confirmation_token}"
    email_body = f"Click the link below to confirm your email address:\n{confirmation_url}"

    # Send the confirmation email
    send_email(user.email, "Email Confirmation", email_body)

    return db_user

@router.get("/confirm-email/{token}")
async def confirm_email(token: str, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(token)
        if not payload:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        email = payload.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token")

        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.status_id == 1:
            raise HTTPException(status_code=400, detail="Email already confirmed")

        # Update user status to active
        user.status_id = 1 
        await db.commit()
        
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/dashboard")
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))