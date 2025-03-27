from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, Boolean, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
import smtplib
import random
from starlette.requests import Request
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
import secrets
import os
import jwt
from pydantic import BaseModel
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
import logging
import uuid
from fastapi import BackgroundTasks
import pyotp
import qrcode
from io import BytesIO
from fastapi.responses import StreamingResponse

# Function to send the verification email
def send_verification_email(email: str, token: str):
    try:
        verification_link = f"http://localhost:3000/verify-email?token={token}"
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            message = f"Subject: Email Verification\n\nPlease verify your email by clicking the link below:\n{verification_link}"
            server.sendmail(EMAIL_SENDER, email, message)
    except Exception as e:
        print(f"Error sending verification email: {e}")

# Dictionary to store temporary OTPs
otp_storage = {}

# Email Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_SENDER = "hashila999@gmail.com"  
EMAIL_PASSWORD = "sqgo ipmv hawt ehiu" #app password

# Function to send OTP via email
def send_otp_email(email: str, otp: str):
    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            message = f"Subject: Your OTP Code\n\nYour OTP code is: {otp}"
            server.sendmail(EMAIL_SENDER, email, message)
    except Exception as e:
        print(f"Error sending email: {e}")

# Load environment variables
load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:HashI1957@localhost:5432/registrationdb")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# FastAPI instance
app = FastAPI()

# Serve the favicon.ico from the 'static' directory
@app.get("/favicon.ico")
async def favicon():
    return FileResponse(os.path.join("static", "favicon.ico"))

# CORS Middleware 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secret key for JWT & session
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# session middleware
SECRET_KEY= secrets.token_hex(32)
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

# Database Model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    verified = Column(Boolean, default=False)  # Boolean field to track verification status
    two_factor_enabled = Column(Boolean, default=False)  #  New column for Google Auth
    secret_key = Column(String, nullable=True)  # Store the Google Authenticator secret key

# Create tables in PostgreSQL
Base.metadata.create_all(bind=engine)

# Pydantic Schema for User Registration
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

# User Login Schema
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OTPVerification(BaseModel):
    email: EmailStr
    otp: str

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Login and send OTP
@app.post("/login")
async def login(user: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user or not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Generate OTP
    otp = str(random.randint(100000, 999999))
    otp_storage[user.email] = otp

    # Send OTP via email
    send_otp_email(user.email, otp)

    # Check if 2FA is enabled and require TOTP
    if db_user.two_factor_enabled:
        return {"message": "OTP sent to your email. Please enter your TOTP code from Google Authenticator.", "require_totp": True}

    return {"message": "OTP sent to your email"}

# Verify OTP and complete login
@app.post("/verify-otp")
async def verify_otp(otp_data: OTPVerification):
    stored_otp = otp_storage.get(otp_data.email)
    
    if not stored_otp or stored_otp != otp_data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # Generate JWT token
    token_data = {"sub": otp_data.email}
    token = create_access_token(data=token_data)

    # Remove OTP after verification
    del otp_storage[otp_data.email]

    return {"email": otp_data.email, "token": token}
    
# Enable Google Authenticator 2FA
@app.post('/enable-2fa/{user_id}')
def enable_2fa(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate a new secret key using pyotp
    secret_key = pyotp.random_base32()  # Generate a base32 secret key
    user.secret_key = secret_key
    user.two_factor_enabled = True  # Enable 2FA
    db.commit()
    
    # Generate a URI for the QR code
    uri = pyotp.totp.TOTP(secret_key).provisioning_uri(name=user.email, issuer_name="MyApp")
    
    # Create a QR code
    img = qrcode.make(uri)
    
    # Return the QR code as a PNG image
    img_byte_array = BytesIO()
    img.save(img_byte_array, format='PNG')
    img_byte_array.seek(0)
    
    return StreamingResponse(img_byte_array, media_type="image/png")


# JWT Token Generation
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.get('/generate-qr/{user_id}')
def generate_qr(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.secret_key:
        raise HTTPException(status_code=404, detail="User not found or 2FA not enabled")

    uri = f"otpauth://totp/MyApp:{user.email}?secret={user.secret_key}&issuer=MyApp"
    img = qrcode.make(uri)
    
    img_byte_array = io.BytesIO()
    img.save(img_byte_array, format='PNG')
    img_byte_array.seek(0)
    
    return StreamingResponse(img_byte_array, media_type="image/png")

@app.post("/verify-otp")
async def verify_otp(otp_data: OTPVerification, db: Session = Depends(get_db)):
    stored_otp = otp_storage.get(otp_data.email)
    
    if not stored_otp or stored_otp != otp_data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = db.query(User).filter(User.email == otp_data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    # If Google Authenticator is enabled, require TOTP
    if user.two_factor_enabled:
        return {"message": "Enter TOTP code", "require_totp": True}

    # If no TOTP, generate JWT token
    token_data = {"sub": otp_data.email}
    token = create_access_token(data=token_data)
    
    del otp_storage[otp_data.email]  # Remove OTP after verification

    return {"email": otp_data.email, "token": token}



# Update register endpoint to include email verification token
@app.post("/register")
async def register(user: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    new_user = User(email=user.email, username=user.username, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate a unique email confirmation token (UUID)
    email_token = str(uuid.uuid4())

    # Store the email token (e.g., in a temporary table or in-memory cache)
    # This is where you would save the token to a table or cache. Here we'll store it temporarily
    otp_storage[email_token] = new_user.email

    # Send the email verification link in the background
    background_tasks.add_task(send_verification_email, user.email, email_token)

    return {"message": "User registered successfully, please verify your email."}

@app.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    # Check if the token exists
    email = otp_storage.get(token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    # Mark the email as verified (you can add a `verified` column in the User model if you want)
    db_user = db.query(User).filter(User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="User not found")

    # Email verified, you can update the user's status in the database if needed
    db_user.verified = True  # Assuming you have added a `verified` column in your User model
    db.commit()

    return {"message": "Email verified successfully, you can now log in."}


# OAuth Configuration (Google, Facebook, Microsoft)
oauth = OAuth()

oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    authorize_params={"scope": "openid email profile"},
    access_token_url="https://oauth2.googleapis.com/token",
    userinfo_endpoint="https://www.googleapis.com/oauth2/v3/userinfo",
    jwks_uri="https://www.googleapis.com/oauth2/v3/certs",
    client_kwargs={"scope": "openid email profile"},
)

oauth.register(
    name="facebook",
    client_id=os.getenv("FACEBOOK_CLIENT_ID"),
    client_secret=os.getenv("FACEBOOK_CLIENT_SECRET"),
    authorize_url="https://www.facebook.com/v10.0/dialog/oauth",
    access_token_url="https://graph.facebook.com/v10.0/oauth/access_token",
    userinfo_endpoint="https://graph.facebook.com/me?fields=id,name,email",
    jwks_uri="https://www.facebook.com/.well-known/openid-configuration", 
    client_kwargs={"scope": "email"},
)

oauth.register(
    name="microsoft",
    client_id=os.getenv("MICROSOFT_CLIENT_ID"),
    client_secret=os.getenv("MICROSOFT_CLIENT_SECRET"),
    authorize_url="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    access_token_url="https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userinfo_endpoint="https://graph.microsoft.com/v1.0/me",
    jwks_uri="https://login.microsoftonline.com/common/discovery/v2.0/keys", 
    client_kwargs={"scope": "openid email profile"},
)


@app.post("/verify-totp/{user_id}")
def verify_totp(totp_code: str, user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.secret_key:
        raise HTTPException(status_code=400, detail="User not found or 2FA not enabled")

    totp = pyotp.TOTP(user.secret_key)
    
    if not totp.verify(totp_code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")

    # Generate JWT token after successful TOTP verification
    token_data = {"sub": user.email}
    token = create_access_token(data=token_data)

    return {"email": user.email, "token": token}



# OAuth Routes
@app.get("/login/{provider}")
async def login(provider: str, request: Request):
    redirect_uri = request.url_for("auth_callback", provider=provider)
    logging.info(f"Redirecting to: {redirect_uri}")  # Debugging
    return await oauth.create_client(provider).authorize_redirect(request, redirect_uri)

@app.get("/auth/{provider}")
async def auth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    token = await oauth.create_client(provider).authorize_access_token(request)
    user_info = await oauth.create_client(provider).userinfo(token=token)
    
    user_email = user_info.get("email")
    user_name = user_info.get("name")

    existing_user = db.query(User).filter(User.email == user_email).first()

    if not existing_user:
        new_user = User(email=user_email, username=user_name, password="")  # OAuth users don't need passwords
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    else:
        new_user = existing_user

    # Generate JWT token
    jwt_token = create_access_token(data={"sub": user_email})

    # Return JWT token to frontend
    return {
        "email": new_user.email,
        "username": new_user.username,
        "jwt_token": jwt_token,  # Send JWT token in the response
    
    }


