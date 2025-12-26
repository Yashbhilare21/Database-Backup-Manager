import uuid
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Enum, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class ScheduleFrequency(str, enum.Enum):
    manual = "manual"
    hourly = "hourly"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    custom = "custom"

class BackupType(str, enum.Enum):
    full = "full"
    schema = "schema"
    tables = "tables"

class BackupFormat(str, enum.Enum):
    sql = "sql"
    dump = "dump"
    backup = "backup"

class BackupSchedule(Base):
    __tablename__ = "backup_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    connection_id = Column(UUID(as_uuid=True), ForeignKey("database_connections.id", ondelete="CASCADE"), nullable=False)
    storage_id = Column(UUID(as_uuid=True), ForeignKey("storage_configurations.id", ondelete="SET NULL"))
    
    name = Column(Text, nullable=False)
    frequency = Column(Enum(ScheduleFrequency), default=ScheduleFrequency.daily, nullable=False)
    cron_expression = Column(Text)
    backup_type = Column(Enum(BackupType), default=BackupType.full, nullable=False)
    backup_format = Column(Enum(BackupFormat), default=BackupFormat.sql, nullable=False)
    
    compression_enabled = Column(Boolean, default=True)
    encryption_enabled = Column(Boolean, default=False)
    selected_schemas = Column(ARRAY(Text))
    selected_tables = Column(ARRAY(Text))
    retention_days = Column(Integer, default=30)
    max_backups = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    
    next_run_at = Column(DateTime(timezone=True))
    last_run_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    connection = relationship("DatabaseConnection", back_populates="schedules")