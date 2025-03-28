# core/email_utils.py
import secrets
from datetime import datetime, timedelta
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from sqlalchemy.orm import Session
from jose import jwt
import logging
from core.config import settings
from models import User

# Configure logging
logger = logging.getLogger(__name__)

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME = settings.EMAIL_USERNAME,
    MAIL_PASSWORD = settings.EMAIL_PASSWORD,
    MAIL_FROM = settings.EMAIL_FROM,
    MAIL_PORT = settings.EMAIL_PORT,
    MAIL_SERVER = settings.EMAIL_HOST,
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def send_verification_email(user: User, db: Session):
    """
    Generate and send email verification token
    
    Args:
        user (User): User model instance
        db (Session): Database session
    """
    # Generate a new verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Calculate token expiration (1 hour from now) with timezone awareness
    token_expires = datetime.utcnow().replace(tzinfo=None) + timedelta(hours=1)
    
    # Store token in database
    user.email_verification_token = verification_token
    user.email_verification_token_expires = token_expires
    db.commit()
    db.refresh(user)
    
    # Create verification link
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
    
    # Prepare email message
    message = MessageSchema(
        subject="Verify Your Email",
        recipients=[user.email],
        body=f"""
        Welcome to our application! 
        
        Please verify your email by clicking the link below:
        {verification_link}
        
        This link will expire in 1 hour.
        
        If you did not create an account, please ignore this email.
        """,
        subtype="plain"
    )
    
    # Send email
    fm = FastMail(conf)
    await fm.send_message(message)

def verify_email_token(db: Session, token: str):
    """
    Verify email token and activate user account
    
    Args:
        db (Session): Database session
        token (str): Verification token
    
    Returns:
        dict: Verification result with status and message
    """
    logger.info(f"Attempting to verify token: {token}")
    
    try:
        # Find user with matching token, considering both expiration and verification status
        user = db.query(User).filter(
            User.email_verification_token == token
        ).first()
        
        # If no user found with this token
        if not user:
            logger.warning(f"No user found with token: {token}")
            return {
                "status": "error",
                "message": "Invalid verification token"
            }
        
        # Ensure both datetimes are naive (without timezone)
        current_time = datetime.utcnow().replace(tzinfo=None)
        token_expires = user.email_verification_token_expires.replace(tzinfo=None) if user.email_verification_token_expires else None
        
        # Check if token has expired
        if (token_expires is None or token_expires < current_time):
            logger.warning(f"Token expired for user: {user.email}")
            return {
                "status": "error",
                "message": "Verification token has expired"
            }
        
        # Check if user is already verified
        if user.is_verified:
            logger.info(f"User {user.email} already verified")
            return {
                "status": "success",
                "message": "Email already verified",
                "user": user
            }
        
        # Mark user as verified
        user.is_verified = True
        
        # Only clear token after successful verification
        if not user.is_verified:
            user.email_verification_token = None
            user.email_verification_token_expires = None
        
        db.commit()
        db.refresh(user)
        
        logger.info(f"User {user.email} successfully verified")
        return {
            "status": "success", 
            "message": "Email verified successfully",
            "user": user
        }
    
    except Exception as e:
        logger.error(f"Error during email verification: {str(e)}")
        db.rollback()
        return {
            "status": "error",
            "message": "An unexpected error occurred during email verification"
        }

async def resend_verification_email(user: User, db: Session):
    """
    Resend verification email to user
    
    Args:
        user (User): User model instance
        db (Session): Database session
    """
    # Clear any existing verification token
    user.email_verification_token = None
    user.email_verification_token_expires = None
    db.commit()
    
    # Send new verification email
    await send_verification_email(user, db)