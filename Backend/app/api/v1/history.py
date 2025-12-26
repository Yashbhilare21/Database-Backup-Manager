# import os
# from typing import List, Optional
# from fastapi import APIRouter, Depends, HTTPException, Query
# from fastapi.responses import FileResponse  # <--- CRITICAL: For downloading files
# from sqlalchemy.orm import Session
# from app.api import deps
# from app.db.session import get_db
# from app.models.history import BackupHistory
# from app.models.schedule import BackupSchedule
# from app.models.connection import DatabaseConnection 
# from app.models.user import User                     
# from app.schemas import history as history_schema
# from app.worker.tasks import run_backup_task

# router = APIRouter()

# @router.get("/", response_model=List[history_schema.History])
# def read_history(
#     connection_id: Optional[str] = Query(None), 
#     status: Optional[str] = Query(None), 
#     db: Session = Depends(get_db), 
#     current_user = Depends(deps.get_current_user)
# ):
#     # Join logic to get Connection name and User email
#     query = db.query(
#         BackupHistory,
#         DatabaseConnection.name.label("connection_name"),
#         User.email.label("user_email")
#     ).join(
#         User, BackupHistory.user_id == User.id
#     ).outerjoin(
#         DatabaseConnection, BackupHistory.connection_id == DatabaseConnection.id
#     ).filter(BackupHistory.user_id == current_user.id)

#     if connection_id:
#         query = query.filter(BackupHistory.connection_id == connection_id)
    
#     if status:
#         query = query.filter(BackupHistory.status == status)

#     # Sort by Newest First
#     results = query.order_by(BackupHistory.created_at.desc()).all()

#     final_history = []
#     for row in results:
#         history_item = row[0]
#         history_item.connection_name = row.connection_name
#         history_item.user_email = row.user_email
#         final_history.append(history_item)

#     return final_history

# @router.post("/run/{schedule_id}")
# def run_manual_backup(
#     schedule_id: str, 
#     db: Session = Depends(get_db), 
#     current_user = Depends(deps.get_current_user)
# ):
#     schedule = db.query(BackupSchedule).filter(
#         BackupSchedule.id == schedule_id, 
#         BackupSchedule.user_id == current_user.id
#     ).first()
    
#     if not schedule:
#         raise HTTPException(status_code=404, detail="Schedule not found")

#     new_history = BackupHistory(
#         user_id=current_user.id,
#         connection_id=schedule.connection_id,
#         schedule_id=schedule.id,
#         backup_type=schedule.backup_type,
#         backup_format=schedule.backup_format,
#         status="pending"
#     )
#     db.add(new_history)
#     db.commit()
#     db.refresh(new_history)

#     run_backup_task.delay(str(new_history.id))
#     return {"success": True, "history_id": str(new_history.id)}

# @router.get("/{id}/download-url")
# def get_download_url(
#     id: str, 
#     db: Session = Depends(get_db), 
#     current_user = Depends(deps.get_current_user)
# ):
#     backup = db.query(BackupHistory).filter(
#         BackupHistory.id == id, 
#         BackupHistory.user_id == current_user.id
#     ).first()
    
#     if not backup or not backup.file_path:
#         raise HTTPException(status_code=404, detail="Backup file not found")
    
#     # This URL points to the route created below
#     return {
#         "url": f"http://localhost:8000/api/v1/history/download/{backup.id}", 
#         "filename": backup.file_name
#     }

# # --- THE MISSING DOWNLOAD ENGINE (FIXES 404) ---
# @router.get("/download/{id}")
# def download_backup_file(
#     id: str, 
#     db: Session = Depends(get_db), 
#     current_user = Depends(deps.get_current_user)
# ):
#     """
#     Finds the file on disk and streams it to the browser.
#     """
#     backup = db.query(BackupHistory).filter(
#         BackupHistory.id == id, 
#         BackupHistory.user_id == current_user.id
#     ).first()
    
#     if not backup or not backup.file_path:
#         raise HTTPException(status_code=404, detail="Backup record not found")

#     if not os.path.exists(backup.file_path):
#         raise HTTPException(status_code=404, detail="File has been deleted from the server storage.")

#     return FileResponse(
#         path=backup.file_path, 
#         filename=backup.file_name, 
#         media_type='application/octet-stream'
#     )

# @router.delete("/{id}")
# def delete_history_record(
#     id: str, 
#     db: Session = Depends(get_db), 
#     current_user = Depends(deps.get_current_user)
# ):
#     record = db.query(BackupHistory).filter(
#         BackupHistory.id == id, 
#         BackupHistory.user_id == current_user.id
#     ).first()
    
#     if not record:
#         raise HTTPException(status_code=404, detail="Record not found")
    
#     if record.file_path and os.path.exists(record.file_path):
#         try:
#             os.remove(record.file_path)
#         except:
#             pass
        
#     db.delete(record)
#     db.commit()
#     return {"status": "success"}

import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api import deps
from app.db.session import get_db
from app.models.history import BackupHistory
from app.models.schedule import BackupSchedule
from app.models.connection import DatabaseConnection 
from app.models.user import User                     
from app.schemas import history as history_schema
from app.worker.tasks import run_backup_task # Now a standard function

router = APIRouter()

@router.get("/", response_model=List[history_schema.History])
def read_history(
    connection_id: Optional[str] = Query(None), 
    status: Optional[str] = Query(None), 
    db: Session = Depends(get_db), 
    current_user = Depends(deps.get_current_user)
):
    query = db.query(
        BackupHistory,
        DatabaseConnection.name.label("connection_name"),
        User.email.label("user_email")
    ).join(
        User, BackupHistory.user_id == User.id
    ).outerjoin(
        DatabaseConnection, BackupHistory.connection_id == DatabaseConnection.id
    ).filter(BackupHistory.user_id == current_user.id)

    if connection_id:
        query = query.filter(BackupHistory.connection_id == connection_id)
    if status:
        query = query.filter(BackupHistory.status == status)

    return [
        row[0].__dict__ | {"connection_name": row.connection_name, "user_email": row.user_email} 
        for row in query.order_by(BackupHistory.created_at.desc()).all()
    ]

@router.post("/run/{schedule_id}")
async def run_manual_backup(
    schedule_id: str, 
    background_tasks: BackgroundTasks, # Inject BackgroundTasks
    db: Session = Depends(get_db), 
    current_user = Depends(deps.get_current_user)
):
    schedule = db.query(BackupSchedule).filter(
        BackupSchedule.id == schedule_id, 
        BackupSchedule.user_id == current_user.id
    ).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Create record immediately so UI sees it as 'pending/running'
    new_history = BackupHistory(
        user_id=current_user.id,
        connection_id=schedule.connection_id,
        schedule_id=schedule.id,
        backup_type=schedule.backup_type,
        backup_format=schedule.backup_format,
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(new_history)
    db.commit()
    db.refresh(new_history)

    # ADD TO BACKGROUND TASKS
    # This executes run_backup_task(history_id) in a background thread
    background_tasks.add_task(run_backup_task, str(new_history.id))

    return {"success": True, "message": "Backup task initialized in background", "history_id": new_history.id}

@router.get("/{id}/download-url")
def get_download_url(id: str, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    backup = db.query(BackupHistory).filter(BackupHistory.id == id, BackupHistory.user_id == current_user.id).first()
    if not backup or not backup.file_path:
        raise HTTPException(status_code=404, detail="Backup file not found")
    return {"url": f"http://localhost:8000/api/v1/history/download/{backup.id}", "filename": backup.file_name}

@router.get("/download/{id}")
def download_backup_file(id: str, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    backup = db.query(BackupHistory).filter(BackupHistory.id == id, BackupHistory.user_id == current_user.id).first()
    if not backup or not backup.file_path or not os.path.exists(backup.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path=backup.file_path, filename=backup.file_name, media_type='application/octet-stream')

@router.delete("/{id}")
def delete_history_record(id: str, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    record = db.query(BackupHistory).filter(BackupHistory.id == id, BackupHistory.user_id == current_user.id).first()
    if record:
        if record.file_path and os.path.exists(record.file_path):
            os.remove(record.file_path)
        db.delete(record)
        db.commit()
    return {"status": "success"}