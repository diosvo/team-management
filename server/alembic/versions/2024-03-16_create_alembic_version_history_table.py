"""Create 'alembic_version_history' table

Revision ID: bf572d31801a
Revises:
Create Date: 2024-03-16 22:53:44.441873

"""

from sqlalchemy import Column, DateTime, ForeignKey, String, func

from alembic import op

TABLE_NAME = "alembic_version_history"

revision: str = "bf572d31801a"
down_revision = None


def upgrade() -> None:
    op.create_table(
        TABLE_NAME,
        Column(
            "version_num",
            String,
            ForeignKey("alembic_version.version_num", ondelete="CASCADE"),
            primary_key=True,
        ),
        Column("message", String, nullable=False),
        Column("applied_at", DateTime, nullable=False, server_default=func.now()),
    )


def downgrade() -> None:
    op.drop_table(TABLE_NAME)
