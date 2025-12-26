import uuid
from sqlalchemy import Column, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.session import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Text, default="info") 
    is_read = Column(Boolean, default=False)
    backup_id = Column(UUID(as_uuid=True), ForeignKey("backup_history.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())