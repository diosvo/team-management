"""
The root of the project, which inits the FastAPI application.
"""

from contextlib import asynccontextmanager
from time import process_time

from fastapi import APIRouter, FastAPI, Request, Response
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from .config import get_settings
from .database.models import engine, metadata
from .logging_config import logger
from .middlewares.exception_handler import ExceptionHandlerMiddleware
from .middlewares.rate_limiting import RateLimitingMiddleware
from .users.router import router as users_router

# Read .env values
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("··· Starting to migrate database ···")
    metadata.create_all(bind=engine)

    try:
        logger.info("✅  Database migration done!")
        yield

    except Exception as exc:
        logger.debug(str(exc))
        logger.error("❌  Database migration failed.")


"""Metadata and Docs URLs

Hide docs by default. Show it explicitly on the selected envs only.

.. seealso::
- https://fastapi.tiangolo.com/tutorial/metadata/
- https://fastapi.tiangolo.com/advanced/generate-clients/#custom-generate-unique-id-function
"""


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


app_configs = {
    "title": settings.PROJECT_NAME,
    "version": "1.0.0",
    "contact": {
        "name": "Dios Vo",
        "url": "https://www.linkedin.com/in/diosvo/",
        "email": "vtmn1212@gmail.com",
    },
    "lifespan": lifespan,
    "generate_unique_id_function": custom_generate_unique_id,
}

if settings.ENVIRONMENT != settings.SHOW_DOCS_ENVIRONMENT:
    app_configs["docs_url"] = None


app = FastAPI(**app_configs)

"""🛡️ Middleware"""


@app.middleware("http")
async def add_process_time_header(request: Request, call_next) -> Response:
    start = process_time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = str(round(process_time() - start, 2))

    return response


# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(ExceptionHandlerMiddleware)
    app.add_middleware(RateLimitingMiddleware)


"""🚥 Routes"""

APP_ROUTERS: list[APIRouter] = [users_router]
for router in APP_ROUTERS:
    app.include_router(router=router, prefix=settings.API_V1_STR)
