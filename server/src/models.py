"""
The global models.
"""

from datetime import datetime
from typing import Any

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, ConfigDict, model_validator
from zoneinfo import ZoneInfo


def convert_datetime_to_gmt(dt: datetime) -> str:
    if not dt.tzinfo:
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))

    return dt.strftime("%Y-%m-%dT%H:%M:%S%z")


class CustomModel(BaseModel):
    """A standard datetime format for all subclasses of the base model.

    - Drops microseconds to 0 in all date formats.
    - Serializes all datetime fields to standard format with explicit timezone.
    """
    model_config = ConfigDict(
        json_encoders={datetime: convert_datetime_to_gmt},
        populate_by_name=True,
    )

    @model_validator(mode="before")
    @classmethod
    def set_null_microseconds(cls, data: dict[str, Any]) -> dict[str, Any]:
        datetime_fields = {
            key: value.replace(microsecond=0)
            for key, value in data.items()
            if isinstance(key, datetime)
        }

        return {**data, **datetime_fields}

    def serializable_dict(self, **kwargs) -> Any:
        """Return a dict which contains only serializable fields."""
        default_dict = self.model_dump()

        return jsonable_encoder(default_dict)
