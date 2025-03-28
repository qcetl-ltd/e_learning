# main.py
import uvicorn
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
import logging
import secrets

from database import engine, Base, get_db
from core.config import settings
from routers import auth, users, social_auth
from core.oauth import oauth

# Create all tables in the database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Set up templates directory
templates_dir = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), "templates")
os.makedirs(templates_dir, exist_ok=True)

# Create a simple HTML file for testing OAuth
test_page_path = os.path.join(templates_dir, "test_oauth.html")
with open(test_page_path, "w") as f:
    f.write("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>OAuth Test Page</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; }
            .btn {
                display: inline-block;
                padding: 10px 20px;
                background-color: #4285f4;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                margin-right: 10px;
                margin-bottom: 10px;
            }
            .btn-microsoft { background-color: #00a4ef; }
            .btn-facebook { background-color: #3b5998; }
            .result {
                margin-top: 20px;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background-color: #f9f9f9;
                white-space: pre-wrap;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>OAuth Test Page</h1>
            <p>Use the buttons below to test the OAuth flow with different providers:</p>

            <div>
                <a href="/api/v1/auth/google/login" class="btn">Sign in with Google</a>
                <a href="/api/v1/auth/microsoft/login" class="btn btn-microsoft">Sign in with Microsoft</a>
                <a href="/api/v1/auth/facebook/login" class="btn btn-facebook">Sign in with Facebook</a>
            </div>

            <div id="result" class="result">Results will appear here after authentication</div>

            <script>
                // Check for token in URL after redirect
                window.onload = function() {
                    const urlParams = new URLSearchParams(window.location.search);
                    const token = urlParams.get('token');
                    const error = urlParams.get('message');

                    if (token) {
                        document.getElementById(
                            'result').textContent = 'Success! Token: ' + token;

                        // You can also make a test API call with the token
                        fetch('/api/v1/users/me', {
                            headers: {
                                'Authorization': 'Bearer ' + token
                            }
                        })
                        .then(response => response.json())
                        .then(data => {
                            document.getElementById(
                                'result').textContent += '\\n\\nUser Info: ' + JSON.stringify(data, null, 2);
                        })
                        .catch(error => {
                            document.getElementById(
                                'result').textContent += '\\n\\nAPI Error: ' + error;
                        });
                    } else if (error) {
                        document.getElementById(
                            'result').textContent = 'Error: ' + error;
                    }
                };
            </script>
        </div>
    </body>
    </html>
    """)

# Set up templates
templates = Jinja2Templates(directory=templates_dir)

# Add session middleware (required for OAuth)
secure_secret_key = secrets.token_urlsafe(32)  # Generate a secure secret key
app.add_middleware(
    SessionMiddleware,
    secret_key=secure_secret_key,
    max_age=3600,  # 1 hour in seconds
    same_site="lax",  # Helps with CSRF protection in requests
    session_cookie="session"  # Optional: Explicitly set the session cookie name
)

# Add logging to confirm middleware initialization
logging.info("SessionMiddleware initialized with secret_key and max_age=3600")

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use the corrected origins list
    allow_credentials=True,  # Allow cookies to be sent
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(social_auth.router)

# Initialize OAuth with the app


@app.on_event("startup")
async def startup():
    print("Application startup complete")  # Optional: To confirm startup

# Add a route for testing OAuth


@app.get("/")
async def root():
    return {"message": "Welcome to FastAPI Auth API"}


@app.get("/test-oauth")
async def test_oauth(request: Request):
    return templates.TemplateResponse("test_oauth.html", {"request": request})


@app.get("/health")
async def health_check(db=Depends(get_db)):
    try:
        # Test DB connection
        db.execute(text("SELECT 1"))
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
