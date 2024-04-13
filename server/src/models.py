"""
The global models.
"""

from copy import deepcopy
from typing import Any, Callable, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, create_model
from pydantic.fields import FieldInfo

T = TypeVar("T", bound="BaseModel")


class CustomModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        use_attribute_docstrings=True,
        use_enum_values=True,
    )


def optional(
    include: Optional[list[str]] = None, exclude: Optional[list[str]] = None
) -> Callable[[type[T]], type[T]]:
    """Decorator function used to modify Pydantic model's fields.

    If no fields are specified, all fields will be optional:

    ```python
    @optional()
    class Model(ExtendedModel):
        pass
    ```
    """

    if exclude is None:
        exclude = []

    def decorator(model: type[T]) -> type[T]:
        def make_optional(
            field: FieldInfo, default: Any = None
        ) -> tuple[Any, FieldInfo]:
            new = deepcopy(field)
            new.default = default
            new.annotation = Optional[field.annotation or Any]
            return new.annotation, new

        fields = model.model_fields

        if include is None:
            fields = fields.items()
        else:
            fields = ((key, value) for key, value in fields.items() if key in include)

        return create_model(
            model.__name__,
            __base__=model,
            __module__=model.__module__,
            **{
                field_name: make_optional(field_info)
                for field_name, field_info in fields
                if exclude is None or field_name not in exclude
            },
        )

    return decorator
