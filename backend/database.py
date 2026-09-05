# backend/database.py
import os

from sqlalchemy import create_engine
from sqlalchemy.exc import ArgumentError
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")


def _create_engine():
    if not DATABASE_URL:
        return create_engine("sqlite+pysqlite:///:memory:")

    try:
        # Engine with connection pooling for PostgreSQL
        return create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )
    except (ModuleNotFoundError, ArgumentError):
        # Fallback for environments without PostgreSQL driver (e.g. CI tests)
        return create_engine("sqlite+pysqlite:///:memory:")


engine = _create_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
