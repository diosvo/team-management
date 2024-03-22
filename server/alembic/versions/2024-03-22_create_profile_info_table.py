"""Create 'profile_info' table

Revision ID: c2c7975847a7
Revises: c95f29c83cb7
Create Date: 2024-03-22 11:35:59.410760

"""

from alembic import op
from sqlalchemy import Column, DateTime, Integer, String

revision = "c2c7975847a7"
down_revision = "c95f29c83cb7"

TABLE_NAME = "profile_info"


def upgrade() -> None:
    op.create_table(
        TABLE_NAME,
        Column("profile_info_id", Integer, nullable=False, primary_key=True),
        Column("full_name", String, nullable=False),
        Column("dob", DateTime, nullable=True, comment="Date of birth."),
        Column("cin", Integer, nullable=True, comment="Citizen Identification Number"),
        Column(
            "jersey_number",
            Integer,
            nullable=False,
            comment="1-99",
        ),
    )
    op.create_check_constraint(
        constraint_name="jersey_number_value",
        table_name=TABLE_NAME,
        condition="jersey_number >= 1 AND jersey_number <= 99",
    )


def downgrade() -> None:
    op.drop_constraint("jersey_number_value", TABLE_NAME, type_="check")
    op.drop_table(TABLE_NAME)
