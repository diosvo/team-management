"""
The global exceptions.
"""

from fastapi import Request, status
from fastapi.exceptions import HTTPException
from fastapi.templating import Jinja2Templates
from starlette.templating import _TemplateResponse

"""Custom exception handlers.

- Returns HTML templates that correspond to specific status codes.
"""

templates = Jinja2Templates(directory="templates")


async def not_found_error(request: Request, exc: HTTPException) -> _TemplateResponse:
    return templates.TemplateResponse(
        "404.html",
        {"request": request, "detail": exc.detail},
        status_code=status.HTTP_404_NOT_FOUND,
    )


exception_handlers = {
    status.HTTP_404_NOT_FOUND: not_found_error,
}
