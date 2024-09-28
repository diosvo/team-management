"""Create 'users' table

Revision ID: 8975d026ed25
Revises:
Create Date: 2024-09-21 13:23:06.492691

✍🏻 Keep Alembic's auto-generated parts as much as possible.
"""

import sqlalchemy as sa

from alembic import op

# Revision Identifiers
revision: str = "8975d026ed25"
down_revision: str | None = None

TABLE_NAME = "users"


def upgrade() -> None:
    op.create_table(
        TABLE_NAME,
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("username", sa.String(length=16), nullable=False),
        sa.Column("full_name", sa.String(length=64), nullable=False),
        sa.Column(
            "dob",
            sa.String(),
            nullable=False,
            comment="Date of birth (The value is handled by Pydantic before adding into the database).",
        ),
        sa.Column(
            "password",
            sa.String(),
            nullable=False,
            comment="Hashed password before saving to database.",
        ),
        sa.Column(
            "state",
            sa.Enum("active", "inactive", "temporarily_absent", name="state"),
            server_default="active",
            nullable=False,
            comment="Only administrator can change the state.",
        ),
        sa.Column(
            "roles",
            sa.ARRAY(
                sa.Enum(
                    "administrator",
                    "captain",
                    "coach",
                    "player",
                    "treasurer",
                    name="role",
                )
            ),
            server_default=sa.text("ARRAY['player']::role[]"),
            nullable=False,
            comment="Determine the player's roles (maximum 2 roles at a time).",
        ),
        sa.Column(
            "last_modified",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("user_id", name=op.f("users_pkey")),
        sa.UniqueConstraint("username", name=op.f("users_username_key")),
    )


def downgrade() -> None:
    op.drop_table(TABLE_NAME)
