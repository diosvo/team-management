"""
The global response format.
"""

from http import HTTPStatus

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from src.models import ResponseContent


def error_response(
    status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
    content: ResponseContent = ResponseContent(),
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content=jsonable_encoder(content),
    )
