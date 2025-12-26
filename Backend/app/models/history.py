import uuid
import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Enum, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class BackupStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"

class BackupHistory(Base):
    __tablename__ = "backup_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    connection_id = Column(UUID(as_uuid=True), ForeignKey("database_connections.id", ondelete="SET NULL"))
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("backup_schedules.id", ondelete="SET NULL"))
    storage_id = Column(UUID(as_uuid=True), ForeignKey("storage_configurations.id", ondelete="SET NULL"))
    
    status = Column(Enum(BackupStatus), default=BackupStatus.pending, nullable=False)
    backup_type = Column(String, nullable=False) 
    backup_format = Column(String, nullable=False) 
    
    file_name = Column(Text)
    file_path = Column(Text)
    file_size_bytes = Column(BigInteger)
    checksum = Column(Text)
    compression_enabled = Column(Boolean, default=False)
    encryption_enabled = Column(Boolean, default=False)
    
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    tables_backed_up = Column(Integer)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RestoreHistory(Base):
    __tablename__ = "restore_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    backup_id = Column(UUID(as_uuid=True), ForeignKey("backup_history.id", ondelete="SET NULL"))
    connection_id = Column(UUID(as_uuid=True), ForeignKey("database_connections.id", ondelete="SET NULL"))
    
    status = Column(Enum(BackupStatus), default=BackupStatus.pending, nullable=False)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# REMOVED THE NOTIFICATION CLASS FROM HERE