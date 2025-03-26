import smtplib
import random
from datetime import datetime, timedelta
from fastapi import HTTPException
import jwt

# Add this to your existing imports and config
from email.mime.text import MIMEText

# Email Confirmation URL (you might want to adjust this for your actual frontend route)
EMAIL_CONFIRMATION_URL = "http://localhost:3000/verify-email"

# Function to send the verification email
def send_confirmation_email(email: str, token: str):
    try:
        subject = "Email Confirmation"
        body = f"Please click the link to confirm your email: {EMAIL_CONFIRMATION_URL}/?token={token}"
        message = MIMEText(body)
        message['From'] = EMAIL_SENDER
        message['To'] = email
        message['Subject'] = subject

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, email, message.as_string())
    except Exception as e:
        print(f"Error sending email: {e}")

# User Registration with email confirmation
@app.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password
    hashed_password = pwd_context.hash(user.password)
    
    # Create new user entry
    new_user = User(email=user.email, username=user.username, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate email confirmation token (valid for 1 hour)
    token_data = {"sub": new_user.email, "exp": datetime.utcnow() + timedelta(hours=1)}
    confirmation_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

    # Send confirmation email
    send_confirmation_email(user.email, confirmation_token)

    return {"message": "User registered successfully. Please check your email to confirm your account."}

# Email verification route
@app.get("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        # Decode the token
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = decoded_token.get("sub")

        if not email:
            raise HTTPException(status_code=400, detail="Invalid token.")

        # Find the user
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        # Update the user's status to confirmed (you can add a new column in your DB for 'is_confirmed')
        user.is_confirmed = True
        db.commit()

        return {"message": "Email successfully confirmed!"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Token expired. Please request a new confirmation email.")
    except jwt.JWTError:
        raise HTTPException(status_code=400, detail="Invalid token.")
