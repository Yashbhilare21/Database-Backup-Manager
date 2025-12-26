from typing import Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.models.history import BackupStatus

class HistoryBase(BaseModel):
    backup_type: str
    backup_format: str
    status: BackupStatus

class History(HistoryBase):
    id: UUID
    user_id: UUID
    connection_id: Optional[UUID]
    schedule_id: Optional[UUID]
    
    # --- NEW FIELDS FOR FILTERING & UI ---
    connection_name: Optional[str] = None
    user_email: Optional[str] = None
    
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_size_bytes: Optional[int] = None
    checksum: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    tables_backed_up: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class HistoryDownload(BaseModel):
    download_url: str
    file_name: str
    expires_in: int