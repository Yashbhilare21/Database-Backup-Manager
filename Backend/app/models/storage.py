import uuid
import enum
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class StorageType(str, enum.Enum):
    local = "local"
    s3 = "s3"
    gcs = "gcs"
    azure = "azure"

class StorageConfiguration(Base):
    __tablename__ = "storage_configurations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(Text, nullable=False)
    storage_type = Column(Enum(StorageType), default=StorageType.local, nullable=False)
    
    bucket_name = Column(Text)
    region = Column(Text)
    access_key_encrypted = Column(Text)
    secret_key_encrypted = Column(Text)
    endpoint_url = Column(Text)
    is_default = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())