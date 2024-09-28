from datetime import datetime, timedelta
from http import HTTPStatus

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from src.models import ResponseContent
from src.utils.responses import error_response


class RateLimitingMiddleware(BaseHTTPMiddleware):
    # Rate limiting configurations
    RATE_LIMIT_REQUESTS = 1000
    RATE_LIMIT_DURATION = timedelta(days=1)

    def __init__(self, app) -> None:
        super().__init__(app)
        # Dictionary to store request counts for each IP
        self.request_counts = {}

    async def dispatch(
        self, request: Request, call_next: Response
    ) -> JSONResponse | Response:
        # Get the client's IP address
        client_ip = request.client.host

        # Check if IP is already present in request_counts
        request_count, last_request = self.request_counts.get(
            client_ip, (0, datetime.min)
        )

        # Calculate the time elapsed since the last request
        elapsed_time = datetime.now() - last_request

        if elapsed_time > self.RATE_LIMIT_DURATION:
            # If the elapsed time is greater than the rate limit duration, reset the count
            request_count = 1
        else:
            if request_count >= self.RATE_LIMIT_REQUESTS:
                # If the request count exceeds the rate limit, return a JSON response with an error message
                return error_response(
                    status_code=HTTPStatus.TOO_MANY_REQUESTS,
                    content=ResponseContent(
                        error=self.__class__.__name__,
                        detail="Rate limit exceeded. Please try again later.",
                    ),
                )
            request_count += 1

        # Update the request count and last request timestamp for the IP
        self.request_counts[client_ip] = (request_count, datetime.now())

        # Proceed with the request
        return await call_next(request)
