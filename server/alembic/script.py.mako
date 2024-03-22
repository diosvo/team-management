"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from alembic import op
from sqlalchemy import Column, DateTime, Integer, String, func
${imports if imports else ""}

revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
depends_on = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
