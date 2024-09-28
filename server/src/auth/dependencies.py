"""
Router dependencies of `auth` module.

Pydantic can only validate the values from client input.
Use dependencies to validate data against database constraints.

e.g. User is logged in.
"""

from http import HTTPStatus
from typing import Sequence

from fastapi import Depends, HTTPException, Request
from jose import JWTError
from pydantic_core import ValidationError

from src.config import settings
from src.database.session import SessionDep
from src.modules.users import models, utils

from .security import decode_token, get_user

"""
Auth Dependencies
"""


def get_current_user(session: SessionDep, cookie: str) -> models.UserPublic:
    credential_exception = HTTPException(
        status_code=HTTPStatus.UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": settings.TOKEN_TYPE},
    )

    # Check if the cookie exists in the Cookies storage
    if not cookie:
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED, detail="Not authenticated."
        )

    try:
        payload = decode_token(cookie)
        username: str = payload.get("username")

        if not username:
            raise credential_exception

    except (ValidationError, JWTError):
        raise credential_exception

    user = get_user(session, username)

    if not user:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="User not found.")

    if user.state != utils.State.ACTIVE:
        raise HTTPException(
            status_code=HTTPStatus.FORBIDDEN,
            detail=f"User is currently {user.state.value}. Please get in touch with the administrator to activate the account.",
        )

    return user


def rbac(roles: str | list[str]) -> Sequence[Depends] | None:
    """
    Role-Based Access Control (RBAC) Dependency.

    e.g.

    ```python
    @router.delete(
        "/{user_id}",
        dependencies=[rbac(Role.ADMIN)],
    )
    def delete_user(...) -> None:
        ...
    ```
    """
    if isinstance(roles, str):
        roles = [roles]

    for role in roles:
        if role not in utils.Role:
            raise ValueError(f"Invalid role: '{role}'")

    def checker(request: Request):
        has_role = any(role in request.state.user.roles for role in roles)

        if not has_role:
            raise HTTPException(
                status_code=HTTPStatus.FORBIDDEN,
                detail="Insufficient privileges.",
            )

    return Depends(checker)
