# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.api.v1.api import api_router
# from app.core.config import settings
# from app.db import base 


# app = FastAPI(
#     title=settings.PROJECT_NAME,
#     openapi_url=f"{settings.API_V1_STR}/openapi.json"
# )

# # Set all CORS enabled origins
# # Your React frontend (Vite) usually runs on http://localhost:5173
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:8080", 
#         "http://127.0.0.1:8080",
#         "http://localhost:5173", 
#         "http://127.0.0.1:5173"
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Include the main API router
# app.include_router(api_router, prefix=settings.API_V1_STR)

# @app.get("/health")
# def health_check():
#     return {"status": "healthy", "service": settings.PROJECT_NAME}

# @app.get("/")
# def read_root():
#     return {"message": "Welcome to PG Backup Pro API", "docs": "/docs"}


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings
from app.db import base 

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS matches your frontend port 8080
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080", 
        "http://127.0.0.1:8080",
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "healthy", "mode": "BackgroundTasks"}

@app.get("/")
def read_root():
    return {"message": "Welcome to DB Backup Pro API", "docs": "/docs"}