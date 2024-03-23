"""Create 'teams' table

Revision ID: 30b859f5a084
Revises: c2c7975847a7
Create Date: 2024-03-23 14:34:41.842265

"""

from alembic import op
from sqlalchemy import Column, ForeignKey, Integer, String

revision = "30b859f5a084"
down_revision = "c2c7975847a7"

TABLE_NAME = "teams"


def upgrade() -> None:
    op.create_table(
        TABLE_NAME,
        Column("team_id", Integer, nullable=False, primary_key=True),
        Column("team_name", String, nullable=False),
        Column(
            "captain_id",
            Integer,
            ForeignKey("users.user_id", ondelete="CASCADE"),
        ),
    )


def downgrade() -> None:
    op.drop_table(TABLE_NAME)
