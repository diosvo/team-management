"""
A core of `auth` module with all the endpoints.
"""

from datetime import UTC, timedelta
from datetime import datetime as DateTime
from http import HTTPStatus

from fastapi import APIRouter, Form, HTTPException, Request, Response

from src.config import settings
from src.database.session import SessionDep
from src.modules.users.models import UserPublic

from .security import create_access_token, get_user, verify_password

KEY = "auth"

router = APIRouter(prefix=f"/{KEY}", tags=[KEY])


@router.post(
    "/login",
    description="OAuth2 compatible token login, get and set an access token in Cookie session.",
)
def login(
    response: Response,
    session: SessionDep,
    username: str = Form(example="diosvo"),
    password: str = Form(example="Example123!"),
):
    user = get_user(session, username)

    if not (
        user and verify_password(plain_password=password, hashed_password=user.password)
    ):
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail="Incorrect username or password.",
            headers={"WWW-Authenticate": settings.TOKEN_TYPE},
        )

    access_token = create_access_token(user.username)
    expires = DateTime.now(UTC) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=access_token,
        expires=expires,
        httponly=True,
        samesite="strict",
    )

    return HTTPStatus.OK.phrase


@router.post(
    "/logout",
    description="Logout a user.",
)
def logout(response: Response):
    response.delete_cookie(settings.SESSION_COOKIE_NAME)

    return HTTPStatus.OK.phrase


@router.get(
    "/me",
    response_model=UserPublic,
    description="Get current active user.",
)
def read_user_me(request: Request) -> UserPublic:
    return request.state.user
