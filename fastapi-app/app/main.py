from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI application!"}

# Include routers here
# from app.routers import some_router
# app.include_router(some_router)