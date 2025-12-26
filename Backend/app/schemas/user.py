from typing import Optional
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserUpdate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: UUID
    
    class Config:
        from_attributes = True

class Profile(BaseModel):
    id: UUID
    user_id: UUID
    email: Optional[str]
    full_name: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True