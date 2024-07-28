from http import HTTPStatus
from typing import Any, Generic, TypeVar

from fastapi import HTTPException
from pydantic import UUID4
from sqlalchemy import BinaryExpression, exc
from sqlalchemy.orm import Session
from sqlalchemy.sql import func, select
from sqlalchemy.sql.selectable import TypedReturnsRows

from src.models import CustomModel

from .models import Base

Identity = str | UUID4
Model = TypeVar("Model", bound=Base)


class Public(CustomModel):
    total: int
    data: list[Any]


class DatabaseRepository(Generic[Model]):
    """Repository for performing database queries."""

    def __init__(self, model: type[Model], session: Session) -> None:
        """Initialize with model and session."""
        self.model = model
        self.session = session

    def __enter__(self):
        return self.session

    def __exit__(self, exc_type, exc_value, traceback):
        self.session.close()

    def filter(
        self,
        page: int = 0,
        limit: int = 10,
        *expressions: BinaryExpression,
    ) -> Public:
        """
        Data filtering.

        :param `page`: The number of items to skip, default is 0.
        :param `limit`: The number of items to fetch, default is 10.
        :param `expressions`: SQL expressions.

        :return `total`: The total number of the original list.
        :return `data`: The actual results after filtering.
        """
        count_statement = select(func.count()).select_from(self.model)
        total = self.execute(count_statement)

        query = select(self.model)

        if expressions:
            query = query.where(*expressions)

        query = query.offset(page * limit).limit(limit)

        return {"total": total, "data": list(self.session.scalars(query))}

    def get(self, ident: Identity) -> Model | None:
        """
        Get instance by primary key identifier.

        :param `ident`: The primary key value.

        :return: An instance based on the given primary key identifier,
        or ``None`` if not found.
        """
        instance = self.session.get(self.model, ident)

        if not instance:
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail="The provided identifier does not exist in the system.",
            )

        return instance

    def create(self, data: CustomModel) -> Model:
        """
        Create a new instance.

        :param `data`: The data for the new instance.

        :return: The created instance.
        """
        instance = self.model(**data.model_dump())

        try:
            self.session.add(instance)
            self.session.commit()
            self.session.refresh(instance)

        except exc.IntegrityError as error:
            self.session.rollback()
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail=str(error.orig).split("\n"),
            )

        return instance

    def update(self, pk: str, ident: Identity, data: CustomModel) -> Model:
        """
        Update an existing instance.

        :param `pk`: The primary key field name.
        :param `ident`: The primary key value.
        :param `data`: The new data to update the instance with.

        :return: The updated instance.
        """
        instance = self.session.query(self.model).filter(
            getattr(self.model, pk) == ident
        )

        if not instance.first():
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail="The provided identifier does not exist in the system.",
            )

        try:
            instance.update(
                data.model_dump(exclude_unset=True), synchronize_session=False
            )
            self.session.commit()

        except exc.IntegrityError as error:
            self.session.rollback()
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST,
                detail=str(error.orig).split("\n"),
            )

    def delete(self, ident: Identity) -> None:
        """
        Delete an existing instance.

        :param `ident`: The primary key value.

        :return: None if deleting successfully.
        """
        instance = self.get(ident)

        self.session.delete(instance)
        self.session.commit()

    # HELPERs

    def execute(self, statement: TypedReturnsRows[Model]) -> Model | None:
        """
        Execute a SQL statement and return a scalar result.

        :param `statement`: The SQL statement to execute.

        :return: The scalar result of the statement.
        """
        return self.session.execute(statement).scalar()
