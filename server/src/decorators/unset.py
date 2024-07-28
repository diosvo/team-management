from typing import Any as Any
from typing import Callable, List

from src.models import T


# TODO: Example value in Swagger is incorrect
def unset(exclude: List[str]) -> Callable[..., type[T]]:
    """
    Decorator to completely remove specified fields from a Pydantic model, even if they are inherited.

    :param exclude: List of fields to exclude from the model.

    e.g.

    ```python
    @unset(['last_modified'])
    class Model(ExtendedModel):
        pass
    ```
    """

    def decorator(model: type[T]) -> type[T]:
        for field in exclude:
            if field in model.__annotations__:
                del model.__annotations__[field]
            if field in model.model_fields:
                del model.model_fields[field]

        # Override the schema method to exclude the removed fields from the schema generation
        original_schema = model.model_json_schema

        @classmethod
        def custom_schema() -> dict[str, Any]:
            schema = original_schema()
            for field in exclude:
                if field in schema["properties"]:
                    del schema["properties"][field]
                if "required" in schema and field in schema["required"]:
                    schema["required"].remove(field)
            return schema

        model.model_json_schema = custom_schema

        # Return the modified class
        return model

    return decorator
