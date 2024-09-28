"""
Decorator function used to modify Pydantic model's fields.
"""

from copy import deepcopy
from typing import Any, Callable, Optional

from pydantic import create_model
from pydantic.fields import FieldInfo

from src.models import T


def optional(
    include: Optional[list[str]] = [], exclude: Optional[list[str]] = []
) -> Callable[[type[T]], type[T]]:
    """
    ```python
    @optional(exclude=['uuid'])
    class Model(ExtendedModel):
        pass
    ```

    **NOTE**: If no fields are specified, all fields will be optional!
    """

    def decorator(model: type[T]) -> type[T]:
        model_name = model.__name__
        model_fields = model.model_fields

        # Check if all fields to include or/and exclude exist in the model
        for field in include + exclude:
            if field not in model_fields.keys():
                raise ValueError(
                    f"Field '{field}' does not exist in model '{model_name}'"
                )

        def make_optional(
            field: FieldInfo, default: Any = None
        ) -> tuple[Any, FieldInfo]:
            new = deepcopy(field)
            new.default = default
            new.annotation = Optional[field.annotation or Any]
            return new.annotation, new

        if not include:
            model_fields = model_fields.items()
        else:
            model_fields = (
                (key, value) for key, value in model_fields.items() if key in include
            )

        return create_model(
            model_name,
            __base__=model,
            __module__=model.__module__,
            **{
                field_name: make_optional(field_info)
                for field_name, field_info in model_fields
                if exclude is None or field_name not in exclude
            },
        )

    return decorator
