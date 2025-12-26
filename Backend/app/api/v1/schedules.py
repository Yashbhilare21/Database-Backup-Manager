from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.db.session import get_db
from app.models.schedule import BackupSchedule
from app.models.connection import DatabaseConnection # Imported for the join
from app.schemas import schedule as sched_schema

router = APIRouter()

@router.get("/", response_model=List[sched_schema.Schedule])
def read_schedules(
    db_type: Optional[str] = None, # Added filtering parameter
    db: Session = Depends(get_db), 
    current_user = Depends(deps.get_current_user)
):
    # Join schedules with connections to see the type of the parent database
    query = db.query(BackupSchedule).join(
        DatabaseConnection, BackupSchedule.connection_id == DatabaseConnection.id
    ).filter(BackupSchedule.user_id == current_user.id)

    if db_type:
        query = query.filter(DatabaseConnection.db_type == db_type)
        
    return query.all()

@router.post("/", response_model=sched_schema.Schedule)
def create_schedule(obj_in: sched_schema.ScheduleCreate, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    db_obj = BackupSchedule(
        **obj_in.dict(),
        user_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.patch("/{id}/toggle")
def toggle_schedule(id: str, is_active: bool, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    db_obj = db.query(BackupSchedule).filter(
        BackupSchedule.id == id, 
        BackupSchedule.user_id == current_user.id
    ).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db_obj.is_active = is_active
    db.commit()
    return {"is_active": is_active}

@router.delete("/{id}")
def delete_schedule(id: str, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    db_obj = db.query(BackupSchedule).filter(
        BackupSchedule.id == id, 
        BackupSchedule.user_id == current_user.id
    ).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Schedule not found")
    db.delete(db_obj)
    db.commit()
    return {"status": "deleted"}