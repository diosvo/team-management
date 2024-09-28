"""
A specify business logic of `auth` module.
"""

from jose import JWTError, jwt
from passlib.context import CryptContext

from src.config import settings
from src.database.session import SessionDep
from src.modules.users.schemas import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_user(session: SessionDep, username: str) -> User | None:
    """
    Found user by registered username.
    """
    return session.query(User).filter_by(username=username).one_or_none()


def decode_token(token: str) -> str:
    try:
        return jwt.decode(
            token=token, key=settings.SECRET_KEY, algorithms=settings.ALGORITHM
        )
    except JWTError as e:
        raise e


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(hashed_password: str) -> str:
    return pwd_context.hash(hashed_password)


def create_access_token(username: str) -> str:
    to_encode = {
        "username": username,
    }
    encoded_jwt = jwt.encode(
        claims=to_encode, key=settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )

    return encoded_jwt
