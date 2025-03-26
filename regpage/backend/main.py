from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from starlette.requests import Request
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
import secrets
import os
import jwt
import bcrypt
from pydantic import BaseModel
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse


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
    

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# JWT Token Generation
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# User Registration
@app.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    new_user = User(email=user.email, username=user.username, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


#  Login (Email & Password)
@app.post("/login")
async def login(user: LoginRequest, db: Session = Depends(get_db)):
    # Fetch user from database
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user or not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Generate JWT token
    token_data = {"sub": db_user.email}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    return {"email": db_user.email, "token": token}

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

# OAuth Routes
@app.get("/login/{provider}")
async def login(provider: str, request: Request):
    redirect_uri = request.url_for("auth_callback", provider=provider)
    return await oauth.create_client(provider).authorize_redirect(request, redirect_uri)

@app.get("/auth/{provider}")
async def auth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    token = await oauth.create_client(provider).authorize_access_token(request)
    user_info = await oauth.create_client(provider).userinfo(token=token)
    
    user_email = user_info.get("email")
    user_name = user_info.get("name")
    user_picture = user_info.get("picture")

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
        "picture": user_picture,
        "jwt_token": jwt_token,  # Send JWT token in the response
        "provider": provider,
    }




