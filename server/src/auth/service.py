"""
A specify business logic of `auth` module.
"""

from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext
from src.config import get_settings

ALGORITHM = "HS256"

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(subject: str, expires_delta: timedelta) -> str:
    expire = datetime.now(datetime.UTC) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
