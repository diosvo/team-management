from sqlalchemy.engine import create_engine
from sqlalchemy.orm import declarative_base

from .constants import METADATA, SQLALCHEMY_DATABASE_URI

Base = declarative_base(metadata=METADATA)
engine = create_engine(url=SQLALCHEMY_DATABASE_URI)
