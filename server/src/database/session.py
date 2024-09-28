"""
Postgres Database Connection with SQLAlchemy:

- Engine (The most important component):
    - Responsible for connecting the "Pool" and "Dialect" to facilitate database connectivity and behavior.
    - Acts as the source of the database connection.

- Connection:
    - Provides high-level functionalities such as executing SQL statements, managing transactions, and retrieving results from the database.

- Session:
    - Represents a unit of work that groups related operations within a single transaction.

- Dialect:
    - A component that supports a specific database backend.
    - Serves as an intermediary between SQLAlchemy and the database, handling the details of communication.

- Connection Pool:
    - A mechanism that manages a collection of database connections.
    - Reuse existing connections rather than creating new ones for each request

See Also:
    - [FastAPI with SQLAlchemy](https://chaoticengineer.hashnode.dev/fastapi-sqlalchemy)
    - [ORM - Pros & Cons](https://stackoverflow.com/questions/1279613/what-is-an-orm-how-does-it-work-and-how-should-i-use-one)
"""

from collections.abc import Generator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from src.logging_config import logger

from .models import engine


def get_db_session() -> Generator[Session, None, None]:
    """
    The session is committed if everything goes well and rolled back if an exception is raised.
    """
    factory = sessionmaker(bind=engine)
    session = factory()

    try:
        yield session
        # Commit the session if everything went fine
        session.commit()

    except (SQLAlchemyError, Exception) as error:
        session.rollback()
        logger.error("🚨 Database session rolled back due to an error.")
        raise error


SessionDep = Annotated[Session, Depends(get_db_session)]
