from typing import Optional, List
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from app.models.schedule import ScheduleFrequency, BackupType, BackupFormat

class ScheduleBase(BaseModel):
    name: str
    frequency: ScheduleFrequency
    backup_type: BackupType
    backup_format: BackupFormat
    compression_enabled: bool = True
    encryption_enabled: bool = False
    retention_days: int = 30
    max_backups: int = 10
    cron_expression: Optional[str] = None
    selected_schemas: Optional[List[str]] = None
    selected_tables: Optional[List[str]] = None

class ScheduleCreate(ScheduleBase):
    connection_id: UUID
    storage_id: Optional[UUID] = None

class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    frequency: Optional[ScheduleFrequency] = None
    is_active: Optional[bool] = None
    next_run_at: Optional[datetime] = None

class Schedule(ScheduleBase):
    id: UUID
    user_id: UUID
    connection_id: UUID
    storage_id: Optional[UUID] = None
    is_active: bool
    next_run_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True