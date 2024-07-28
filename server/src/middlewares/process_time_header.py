from time import process_time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class ProcessTimeHeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Response) -> Response:
        start = process_time()
        response = await call_next(request)
        response.headers["X-Process-Time"] = str(round(process_time() - start, 2))

        return response
