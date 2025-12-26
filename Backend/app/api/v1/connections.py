from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import psycopg2 
import pymssql  # <--- NEW: Lightweight SQL Server driver

from app.api import deps
from app.db.session import get_db
from app.models.connection import DatabaseConnection
from app.schemas import connection as conn_schema
from app.services import crypto_service

router = APIRouter()

@router.get("/", response_model=List[conn_schema.Connection])
def read_connections(
    db_type: Optional[str] = Query(None), # Filter by postgresql or sqlserver
    db: Session = Depends(get_db), 
    current_user = Depends(deps.get_current_user)
):
    query = db.query(DatabaseConnection).filter(DatabaseConnection.user_id == current_user.id)
    if db_type:
        query = query.filter(DatabaseConnection.db_type == db_type)
    return query.all()

@router.post("/", response_model=conn_schema.Connection)
def create_connection(
    obj_in: conn_schema.ConnectionCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(deps.get_current_user)
):
    encrypted_pw = crypto_service.encrypt(obj_in.password)
    db_obj = DatabaseConnection(
        **obj_in.dict(exclude={"password"}),
        password_encrypted=encrypted_pw,
        user_id=current_user.id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/test")
def test_connection(obj_in: conn_schema.ConnectionTest):
    # SQL SERVER TEST LOGIC
    if obj_in.db_type == "sqlserver":
        try:
            conn = pymssql.connect(
                server=obj_in.host,
                port=obj_in.port,
                user=obj_in.username,
                password=obj_in.password,
                database=obj_in.database_name,
                login_timeout=5
            )
            conn.close()
            return {"success": True, "message": "SQL Server connection successful"}
        except Exception as e:
            return {"success": False, "message": f"SQL Server Error: {str(e)}"}

    # POSTGRES TEST LOGIC
    else:
        try:
            conn = psycopg2.connect(
                host=obj_in.host,
                port=obj_in.port,
                database=obj_in.database_name,
                user=obj_in.username,
                password=obj_in.password,
                connect_timeout=5
            )
            conn.close()
            return {"success": True, "message": "Postgres connection successful"}
        except Exception as e:
            return {"success": False, "message": str(e)}

@router.delete("/{id}")
def delete_connection(id: str, db: Session = Depends(get_db), current_user = Depends(deps.get_current_user)):
    conn = db.query(DatabaseConnection).filter(DatabaseConnection.id == id, DatabaseConnection.user_id == current_user.id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    db.delete(conn)
    db.commit()
    return {"status": "deleted"}