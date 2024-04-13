"""
Used for Pydantic (API schema).
"""

from datetime import date, datetime
from re import match
from uuid import uuid4

from dateutil.relativedelta import relativedelta
from pydantic import (
    UUID4,
    AwareDatetime,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
)
from src.models import CustomModel, optional
from typing_extensions import Annotated

from .utils import Role, State


class UserBase(CustomModel):
    username: Annotated[
        str | None,
        StringConstraints(
            min_length=6,
            max_length=16,
            to_lower=True,
            strip_whitespace=True,
            pattern=r"^[a-zA-Z0-9_\.]+$",
        ),
    ] = Field(default=None, examples=["diosvo"])
    full_name: Annotated[
        str,
        StringConstraints(
            max_length=64,
        ),
    ] = Field(examples=["Vo Thi My Nhung"])
    dob: str = Field(title="Date of Birth", examples=["12/12/1999"])
    email: EmailStr = Field(examples=["vtmn1212@gmail.com"])

    @field_validator("dob", mode="before")
    def parse_date(cls, value: str) -> date:
        try:
            datetime.strptime(value, "%d/%m/%Y").date()

        except ValueError:
            raise ValueError("'dob' must be in the format 'dd/mm/yyyy'")

        return value

    @field_validator("dob")
    def parse_dob(cls, value: str) -> str:
        dob = datetime.strptime(value, "%d/%m/%Y").date()
        now = date.today()

        # Ensure the date is not in the future
        if dob >= now:
            raise ValueError("'dob' cannot be in the future.")

        # Ensure the age is at least 18 years
        if dob > now - relativedelta(years=18):
            raise ValueError("must be at least 18 years old to enrol.")

        return value


class UserCreate(UserBase):
    password: Annotated[
        str,
        "Hashed password before saving it into the database.",
    ] = Field(examples=["Example123!"])
    """
    - At least 8 characters long
    - Does not contain whitespace
    - Contains at least one digit
    - Contains at least one uppercase letter
    - Contains at least one special character
    """

    @field_validator("password")
    def is_valid_password(cls, value: str) -> str:
        # (?=.*\d) - At least one digit exists.
        # (?=.*[A-Z]) - At least one uppercase letter exists.
        # (?=.*[^\w\s]) - At least one special character exists.
        # - NOT a word character (\w includes letters, digits, and underscores)
        # - NOT a whitespace (\s).
        # (?!.*\s) - NO whitespace characters exist.
        # .{8,} - Total length is at least 8 characters.
        pattern = r"^(?=.*\d)(?=.*[A-Z])(?=.*[^\w\s])(?!.*\s).{8,}$"

        if match(pattern=pattern, string=value):
            return value

        raise ValueError("password is too weak! Please create a new one.")


@optional()
class UserUpdate(UserCreate):
    pass


class UserPublic(UserBase):
    user_id: Annotated[UUID4, "Always required"] = Field(examples=[str(uuid4())])
    roles: Annotated[list[Role], "Only administrator can set the role."] = Field(
        default=[Role.PLAYER], validate_default=True
    )
    state: Annotated[State, "Only administrator can change the state."] = Field(
        default=State.ACTIVE, validate_default=True
    )
    last_modified: AwareDatetime
    note: Annotated[
        str | None,
        StringConstraints(
            max_length=128,
        ),
    ] = None


class UsersPublic(CustomModel):
    total: int
    data: list[UserPublic]
