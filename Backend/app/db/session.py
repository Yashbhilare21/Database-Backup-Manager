from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator

from app.core.config import settings

# pool_pre_ping=True is highly recommended for Supabase/Cloud DBs 
# to automatically reconnect if the connection times out.
engine = create_engine(
    settings.DATABASE_URL, 
    pool_pre_ping=True,
    # If using Supabase transaction bouncer (port 6543), 
    # keep the pool size small or managed.
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator:
    """
    FastAPI dependency that provides a database session for each request.
    It automatically closes the session after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()