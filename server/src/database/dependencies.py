from collections.abc import Callable

from sqlalchemy.orm import Session

from src.database import models, repository, session


def get_repository(
    model: type[models.Base],
) -> Callable[[Session], repository.DatabaseRepository]:
    """
    A "dependency" factory.

    It first takes the database model then returns the dependency, e.g.

    ```python
    RepositoryDep = Annotated[
        DatabaseRepository[Model],
        Depends(get_repository(Model))
    ]
    ```
    """

    def func(
        session: session.SessionDep,
    ) -> repository.DatabaseRepository:
        return repository.DatabaseRepository(model, session)

    return func
