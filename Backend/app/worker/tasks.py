# import os
# import platform
# from datetime import datetime
# from pathlib import Path
# from app.core.celery_app import celery_app
# from app.db.session import SessionLocal
# from app.models.history import BackupHistory, BackupStatus
# from app.models.connection import DatabaseConnection
# from app.db import base # Ensures SQLAlchemy sees all models
# from app.services.backup_service import BackupService
# from app.services.crypto_service import decrypt

# @celery_app.task(name="run_backup_task")
# def run_backup_task(history_id: str):
#     db = SessionLocal()
#     history = db.query(BackupHistory).filter(BackupHistory.id == history_id).first()
#     if not history:
#         return f"History record {history_id} not found"

#     try:
#         # 1. Mark as running in Database
#         history.status = BackupStatus.running
#         history.started_at = datetime.utcnow()
#         db.commit()

#         # 2. Get connection and decrypt password
#         conn = db.query(DatabaseConnection).filter(DatabaseConnection.id == history.connection_id).first()
#         if not conn:
#             raise Exception("Connection details not found in database")

#         decrypted_password = decrypt(conn.password_encrypted)
        
#         # Determine Database Type (postgresql or sqlserver)
#         # Using string conversion to handle Enum objects safely
#         db_type = str(conn.db_type).lower() if hasattr(conn, 'db_type') else "postgresql"
        
#         conn_info = {
#             "host": conn.host,
#             "port": conn.port,
#             "username": conn.username,
#             "password": decrypted_password,
#             "database_name": conn.database_name
#         }

#         # 3. DYNAMIC PATH LOGIC (Universal for Mac/Windows)
#         # Path.home() is the most reliable way to find /Users/yash...
#         downloads_path = Path.home() / "Downloads"
#         folder_name = "PG_Backups" if "postgres" in db_type else "MSSQL_Backups"
#         storage_dir = downloads_path / folder_name
        
#         # Create the folder if it doesn't exist
#         storage_dir.mkdir(parents=True, exist_ok=True)
        
#         timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
#         # We save as .sql for both since we are using scripters for remote databases
#         file_name = f"backup_{conn.database_name}_{timestamp}.sql"
#         local_path = str(storage_dir / file_name)

#         # Logging Originality
#         print(f"\n" + "="*50)
#         print(f"--- OS DETECTED: {platform.system()} ---")
#         print(f"--- DB ENGINE: {db_type.upper()} ---")
#         print(f"--- TARGET PATH: {local_path} ---")
#         print("="*50 + "\n")

#         # 4. Execute Backup based on Type
#         if "postgres" in db_type:
#             checksum = BackupService.run_pg_dump(
#                 conn_info, local_path, history.backup_type, history.backup_format
#             )
#         else:
#             # Logic for SQL Server / SSMS Managed DBs
#             checksum = BackupService.run_mssql_backup(conn_info, local_path)

#         # 5. Update History Record on Success
#         history.status = BackupStatus.completed
#         history.completed_at = datetime.utcnow()
#         history.checksum = checksum
#         history.file_name = file_name
#         history.file_size_bytes = os.path.getsize(local_path)
#         history.file_path = local_path 
        
#         db.commit()
#         return f"Backup successful! File saved to: {local_path}"

#     except Exception as e:
#         # Save error message to DB for the frontend to display
#         history.status = BackupStatus.failed
#         history.error_message = str(e)
#         history.completed_at = datetime.utcnow()
#         db.commit()
#         return f"Backup failed: {str(e)}"
#     finally:
#         db.close()



import os
import platform
from datetime import datetime
from pathlib import Path
from app.db.session import SessionLocal
from app.models.history import BackupHistory, BackupStatus
from app.models.connection import DatabaseConnection
from app.db import base # Ensures SQLAlchemy sees all models
from app.services.backup_service import BackupService
from app.services.crypto_service import decrypt

# Standard function (No Celery Decorator)
def run_backup_task(history_id: str):
    db = SessionLocal()
    history = db.query(BackupHistory).filter(BackupHistory.id == history_id).first()
    if not history:
        print(f"!!! Error: History record {history_id} not found !!!")
        return

    try:
        # 1. Update Database to indicate processing
        history.status = BackupStatus.running
        history.started_at = datetime.utcnow()
        db.commit()

        # 2. Get connection and decrypt password
        conn = db.query(DatabaseConnection).filter(DatabaseConnection.id == history.connection_id).first()
        if not conn:
            raise Exception("Connection details not found in database")

        decrypted_password = decrypt(conn.password_encrypted)
        
        db_type = str(conn.db_type).lower() if hasattr(conn, 'db_type') else "postgresql"
        
        conn_info = {
            "host": conn.host,
            "port": conn.port,
            "username": conn.username,
            "password": decrypted_password,
            "database_name": conn.database_name
        }

        # 3. DYNAMIC PATH LOGIC (Universal for Mac/Windows)
        downloads_path = Path.home() / "Downloads"
        folder_name = "PG_Backups" if "postgres" in db_type else "MSSQL_Backups"
        storage_dir = downloads_path / folder_name
        storage_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_name = f"backup_{conn.database_name}_{timestamp}.sql"
        local_path = str(storage_dir / file_name)

        print(f"\n" + "="*50)
        print(f"--- BACKGROUND TASK STARTED ---")
        print(f"--- OS: {platform.system()} | DB: {db_type.upper()} ---")
        print(f"--- SAVING TO: {local_path} ---")
        print("="*50 + "\n")

        # 4. Execute Backup Engine
        if "postgres" in db_type:
            checksum = BackupService.run_pg_dump(
                conn_info, local_path, history.backup_type, history.backup_format
            )
        else:
            checksum = BackupService.run_mssql_backup(conn_info, local_path)

        # 5. Finalize Success in DB
        history.status = BackupStatus.completed
        history.completed_at = datetime.utcnow()
        history.checksum = checksum
        history.file_name = file_name
        history.file_size_bytes = os.path.getsize(local_path)
        history.file_path = local_path 
        
        db.commit()
        print(f"--- BACKUP SUCCESSFUL: {file_name} ---")

    except Exception as e:
        print(f"--- BACKUP FAILED: {str(e)} ---")
        history.status = BackupStatus.failed
        history.error_message = str(e)
        history.completed_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()