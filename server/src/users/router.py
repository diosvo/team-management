"""
A core of `users` module with all the endpoints.
"""

from http import HTTPStatus
from typing import Annotated, List

from fastapi import APIRouter, Depends, Query
from pydantic import UUID4
from sqlalchemy.sql import and_, or_
from src.auth.service import get_password_hash
from src.database.dependencies import get_repository
from src.database.repository import DatabaseRepository

from .models import User
from .schemas import UserCreate, UserPublic, UsersPublic, UserUpdate
from .utils import Role, State

KEY = "users"

router = APIRouter(prefix=f"/{KEY}", tags=[KEY])
Repository = Annotated[DatabaseRepository[User], Depends(get_repository(User))]


@router.get(
    "/",
    response_model=UsersPublic,
    description="Filter and retrieve users with allowance parameters.",
)
def read_users(
    repository: Repository,
    page: int = 0,
    limit: int = 10,
    state: State = State.ACTIVE,
    roles: List[Role] = Query([Role.PLAYER], max_length=2),
    q: Annotated[str | None, Query(max_length=50)] = "",
):
    search_conditions = [
        getattr(User, field).contains(q)
        for field in ["username", "full_name", "email", "note"]
    ]
    roles_conditions = [User.roles.any(role.value) for role in roles]

    return repository.filter(
        page,
        limit,
        and_(
            User.state == state,
            or_(*roles_conditions),
            or_(*search_conditions),
        ),
    )


@router.get(
    "/{user_id}",
    response_model=UserPublic,
    description="Return detailed information about a user.",
)
def get_user(repository: Repository, user_id: UUID4):
    return repository.get(ident=user_id)


@router.post(
    "/",
    status_code=HTTPStatus.CREATED,
    description="Create new user without the need to be logged in.",
)
def create_user(repository: Repository, user_create: UserCreate) -> str:
    user_create.password = get_password_hash(user_create.password)
    repository.create(data=user_create)

    return HTTPStatus.CREATED.phrase


@router.patch(
    "/{user_id}", status_code=HTTPStatus.OK, description="Update the details of a user."
)
def update_user(
    repository: Repository,
    user_id: UUID4,
    user_in: UserUpdate,
):
    repository.update(pk="user_id", ident=user_id, data=user_in)

    return HTTPStatus.OK.phrase


@router.delete(
    "/{user_id}",
    status_code=HTTPStatus.NO_CONTENT,
    description="Delete a user (only administrator can do this action!)",
)
def delete_user(repository: Repository, user_id: UUID4) -> None:
    repository.delete(ident=user_id)
