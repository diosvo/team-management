"""
Used for Database schema.
"""

from uuid import uuid4

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.schema import CheckConstraint, Column
from sqlalchemy.sql.expression import text
from sqlalchemy.sql.sqltypes import DateTime
from sqlalchemy.types import ARRAY, Enum, String
from src.database.models import Base

from .utils import Role, State


class User(Base):
    __tablename__ = "users"

    user_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
    )
    username = Column(String(length=16), unique=True, nullable=True)
    full_name = Column(String(length=64), nullable=False)
    dob = Column(
        String,
        comment="Date of birth (The value is handled by Pydantic before adding into the database).",
        nullable=False,
    )
    email = Column(
        String,
        unique=True,
        comment="Validate via pydantic before inserting into the database",
        nullable=False,
    )
    password = Column(
        String,
        comment="Hashed password before saving to database.",
        nullable=False,
    )
    state = Column(
        Enum(State, values_callable=lambda enum: [item.value for item in enum]),
        server_default=State.ACTIVE,
        comment="Only administrator can change the state.",
        nullable=False,
    )
    roles = Column(
        ARRAY(Enum(Role, values_callable=lambda enum: [item.value for item in enum])),
        CheckConstraint("array_length(roles, 1) <= 2", name="role_max_two"),
        server_default=text("ARRAY['player']::role[]"),
        comment="Determine the player's roles (maximum 2 roles at a time).",
        nullable=False,
    )
    last_modified = Column(
        DateTime(timezone=True),
        onupdate=text("now()"),
        server_default=text("now()"),
        nullable=False,
    )
    note = Column(
        String(length=128),
        nullable=True,
    )
