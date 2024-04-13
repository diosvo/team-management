"""
Database connection related "stuff".
"""

from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import sessionmaker

from .config import get_settings

settings = get_settings()

POSTGRES_INDEXES_NAMING_CONVENTION = {
    "ix": "%(column_0_label)s_idx",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ck": "%(table_name)s_%(constraint_name)s_check",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "pk": "%(table_name)s_pkey",
}

DATABASE_DSN = settings.database_dsn

engine = create_engine(DATABASE_DSN)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
metadata = MetaData(naming_convention=POSTGRES_INDEXES_NAMING_CONVENTION)


def get_database():
    """
    Ensure the database session is always closed after the request.
    Even if there was an exception while processing the request.
    """

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
