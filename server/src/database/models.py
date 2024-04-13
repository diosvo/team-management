from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import declarative_base
from src.config import get_settings

settings = get_settings()

SQLALCHEMY_DATABASE_URI = str(settings.SQLALCHEMY_DATABASE_URI)

POSTGRES_INDEXES_NAMING_CONVENTION = {
    "ix": "%(column_0_label)s_idx",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ck": "%(table_name)s_%(constraint_name)s_check",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "pk": "%(table_name)s_pkey",
}

engine = create_engine(SQLALCHEMY_DATABASE_URI)
metadata = MetaData(naming_convention=POSTGRES_INDEXES_NAMING_CONVENTION)

Base = declarative_base(metadata=metadata)
