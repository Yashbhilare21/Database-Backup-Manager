import enum
import uuid
# 1. Added "Enum" to the sqlalchemy imports
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Enum 
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class DBType(str, enum.Enum):
    postgresql = "postgresql"
    sqlserver = "sqlserver"


class DatabaseConnection(Base):
    __tablename__ = "database_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    host = Column(Text, nullable=False)
    port = Column(Integer, nullable=False, default=5432)
    database_name = Column(Text, nullable=False)
    username = Column(Text, nullable=False)
    password_encrypted = Column(Text, nullable=False)
    ssl_mode = Column(Text, default="require")
    is_active = Column(Boolean, default=True)
    last_connected_at = Column(DateTime(timezone=True))
    
    # 2. FIXED THIS LINE: Changed enum.Enum(DBType) to Enum(DBType)
    db_type = Column(Enum(DBType), default=DBType.postgresql, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="connections")
    schedules = relationship("BackupSchedule", back_populates="connection", cascade="all, delete")