from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from src.auth.dependencies import get_current_user
from src.config import settings
from src.database.session import get_db_session
from src.logging_config import logger
from src.models import ResponseContent
from src.utils.responses import error_response

BYPASS_PATHS = {
    "GET": {
        # Swagger
        "/docs",
        f"{settings.API_V1_STR}/openapi.json",
    },
    "POST": {
        # Users
        f"{settings.API_V1_STR}/users/",
        # Authentication
        f"{settings.API_V1_STR}/auth/login",
    },
}


class AuthenticationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Response) -> Response:
        # 🛫 Bypass authentication for certain paths
        if request.url.path in BYPASS_PATHS.get(request.method, ()):
            return await call_next(request)

        session = next(get_db_session())
        cookie = request.cookies.get(settings.SESSION_COOKIE_NAME)

        try:
            user = get_current_user(session=session, cookie=cookie)
            # Store the user in the request state
            request.state.user = user

        except HTTPException as e:
            # Rollback if there's an HTTP exception
            session.rollback()
            return error_response(
                status_code=e.status_code,
                content=ResponseContent(error=self.__class__.__name__, detail=e.detail),
            )

        except Exception as e:
            session.rollback()
            logger.error("❌ Unexpected exception: Session rolled back.")
            raise e

        # Continue processing the request if token is valid
        return await call_next(request)
