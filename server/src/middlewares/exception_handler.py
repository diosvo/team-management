from collections import defaultdict

from fastapi import Request, Response
from fastapi.exceptions import ResponseValidationError
from fastapi.responses import JSONResponse
from jose import JWTError
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware

from src.models import ResponseContent
from src.utils.responses import error_response


class ExceptionHandlerMiddleware(BaseHTTPMiddleware):
    def response_detail(self, detail):
        return error_response(
            content=ResponseContent(error=self.__class__.__name__, detail=detail)
        )

    async def dispatch(
        self, request: Request, call_next: Response
    ) -> Response | JSONResponse:
        try:
            return await call_next(request)

        except (ValidationError, JWTError) as e:
            return self.response_detail(e.json(indent=2))

        except ResponseValidationError as e:
            reformatted = defaultdict(list)

            for error in e.errors():
                # Nested location with dot-notation
                location = ".".join(map(str, error["loc"]))
                reformatted[location].append(error["msg"])

            return self.response_detail(reformatted)

        except (Exception, TypeError, ValueError) as e:
            return self.response_detail(e.args)
