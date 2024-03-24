"""Create 'team_members' table

Revision ID: ce5eebb1bdf1
Revises: 30b859f5a084
Create Date: 2024-03-24 16:25:24.710599

"""

from alembic import op
from sqlalchemy import Column, ForeignKey, Integer, String

revision = "ce5eebb1bdf1"
down_revision = "30b859f5a084"

TABLE_NAME = "team_members"


def upgrade() -> None:
    op.create_table(
        TABLE_NAME,
        Column(
            "team_id",
            Integer,
            ForeignKey("teams.team_id", ondelete="CASCADE"),
            nullable=False,
        ),
        Column(
            "user_id",
            Integer,
            ForeignKey("users.user_id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
        ),
        Column(
            "role_within_team",
            String,
            nullable=False,
            comment="Indicate the member's role within the team.",
        ),
        Column(
            "status",
            String,
            nullable=False,
            comment="The current member's status." \
                "(e.g., active, inactive, temp_absence)",
        ),
    )
    op.create_check_constraint(
        constraint_name="status_value",
        table_name=TABLE_NAME,
        condition="status IN ('active', 'inactive', 'temp_absence')",
    )


def downgrade() -> None:
    op.drop_constraint("status_value", TABLE_NAME, type_="check")
    op.drop_table(TABLE_NAME)
