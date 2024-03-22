"""Create 'users' table

Revision ID: c95f29c83cb7
Revises: bf572d31801a
Create Date: 2024-03-19 23:54:04.207184

"""

from alembic import op
from sqlalchemy import Column, DateTime, Integer, String, func

revision = "c95f29c83cb7"
down_revision = None

TABLE_NAME = "users"


def upgrade() -> None:
    op.create_table(
        TABLE_NAME,
        Column("user_id", Integer, nullable=False, primary_key=True),
        Column("username", String, unique=True, nullable=True),
        Column("email", String, unique=True, nullable=False),
        Column("password", String, nullable=False),
        Column(
            "role",
            String,
            nullable=False,
            comment="Determine the user's role \
                (e.g., coach, player, administrator)",
        ),
        Column("created_at", DateTime, nullable=False, server_default=func.now()),
    )
    op.create_check_constraint(
        constraint_name="role_values",
        table_name=TABLE_NAME,
        condition="role IN ('coach', 'player', 'administrator')",
    )


def downgrade() -> None:
    op.drop_constraint("role_values", TABLE_NAME, type_="check")
    op.drop_table(TABLE_NAME)
