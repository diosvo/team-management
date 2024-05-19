from collections.abc import Callable

from fastapi import Depends
from sqlalchemy.orm import Session
from src.database import models, repository, session


def get_repository(
    model: type[models.Base],
) -> Callable[[Session], repository.DatabaseRepository]:
    """
    A "dependency" factory.

    It first takes the database model then returns the dependency, e.g.

    ```python
    Repository = Annotated[
        DatabaseRepository[Model], 
        Depends(get_repository(Model))
    ]
    ```
    """

    def func(
        session: Session = Depends(session.get_db_session),
    ) -> repository.DatabaseRepository:
        return repository.DatabaseRepository(model, session)

    return func
