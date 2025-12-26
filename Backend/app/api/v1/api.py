from fastapi import APIRouter
from app.api.v1 import auth, connections, schedules, history

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(connections.router, prefix="/connections", tags=["connections"])
api_router.include_router(schedules.router, prefix="/schedules", tags=["schedules"])
api_router.include_router(history.router, prefix="/history", tags=["history"])