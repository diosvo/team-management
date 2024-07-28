"""
The global models.
"""

from typing import Any, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T", bound="BaseModel")


class CustomModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        use_attribute_docstrings=True,
        use_enum_values=True,
    )


class ResponseContent(CustomModel):
    error: str = Field(
        default="Exception",
        examples=["ValueError"],
    )
    detail: Any = Field(
        default="An error occurred.",
        examples=[
            {
                "<loc>": ["<msg>"],
            }
        ],
    )
