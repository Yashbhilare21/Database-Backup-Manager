import enum
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

# --- ENUMS (Matching your SQL Schema) ---
class AppRole(str, enum.Enum):
    admin = "admin"
    user = "user"

class BackupStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"

class BackupType(str, enum.Enum):
    full = "full"
    schema = "schema"
    tables = "tables"

class BackupFormat(str, enum.Enum):
    sql = "sql"
    dump = "dump"
    backup = "backup"

class ScheduleFrequency(str, enum.Enum):
    manual = "manual"
    hourly = "hourly"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    custom = "custom"

# --- TABLES ---

class User(Base):
    __tablename__ = "users" # Standalone replacement for auth.users
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    profile = relationship("Profile", back_populates="user", uselist=False)
    roles = relationship("UserRole", back_populates="user")
    connections = relationship("DatabaseConnection", back_populates="user", cascade="all, delete")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    email = Column(Text)
    full_name = Column(Text)
    avatar_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="profile")

class UserRole(Base):
    __tablename__ = "user_roles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    role = Column(Enum(AppRole), default=AppRole.user, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="roles")