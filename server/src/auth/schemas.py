"""
Used for `pydantic` models of `auth` module.
"""
from pydantic import BaseModel, EmailStr, Field, StringConstraints
from typing_extensions import Annotated


class UserBase(BaseModel):
    full_name: Annotated[
        str,
        Field(min_length=1, max_length=128),
    ]
    username: Annotated[
        str,
        StringConstraints(
            pattern="^[A-Za-z0-9-_]+$",
            to_lower=True,
            strip_whitespace=True,
        )
    ]
    email: EmailStr
