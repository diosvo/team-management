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

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from src.logging_config import logger

from .models import engine


def get_db_session() -> Generator[Session, None, None]:
    """
    The session is committed if everything goes well and rolled back if an exception is raised.
    """
    factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with factory() as session:
        try:
            yield session
            session.commit()

        except SQLAlchemyError as error:
            session.rollback()
            logger.exception(error)

            raise
