from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.models.connection import DBType 

class ConnectionBase(BaseModel):
    name: str
    host: str
    port: int = 5432
    database_name: str 
    username: str
    ssl_mode: Optional[str] = "require"
    db_type: DBType = DBType.postgresql 

class ConnectionCreate(ConnectionBase):
    password: str 

class ConnectionUpdate(BaseModel):
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssl_mode: Optional[str] = None
    is_active: Optional[bool] = None
    db_type: Optional[DBType] = None 

class ConnectionTest(ConnectionBase):
    password: str
    name: Optional[str] = "Test" 

class Connection(ConnectionBase):
    id: UUID
    user_id: UUID
    is_active: bool
    # Added db_type here so the frontend list shows icons correctly
    db_type: DBType 
    last_connected_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True