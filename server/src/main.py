"""
The root of the project, which inits the FastAPI application.
"""

from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import engine, metadata
from .exceptions import exception_handlers
from .logging_config import logger

# Read .env values
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    metadata.create_all(bind=engine)
    logger.info("🛢️  Connected to database.")

    try:
        yield
    finally:
        logger.error("🛢️  Database connection failed.")


"""Metadata and Docs URLs

Hide docs by default. Show it explicitly on the selected envs only.

References:
- https://fastapi.tiangolo.com/tutorial/metadata/
- https://fastapi.tiangolo.com/advanced/generate-clients/#custom-generate-unique-id-function
"""

TAGS_METADATA = [
    {"name": "<TAG_NAME>", "description": "<description>"},
]
openapi_tags = (
    TAGS_METADATA if settings.ENVIRONMENT in settings.SHOW_DOCS_ENVIRONMENT else None
)


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    contact={
        "name": "Dios Vo",
        "url": "https://www.linkedin.com/in/diosvo/",
        "email": "vtmn1212@gmail.com",
    },
    lifespan=lifespan,
    openapi_tags=openapi_tags,
    exception_handlers=exception_handlers,
    generate_unique_id_function=custom_generate_unique_id,
)

"""APP ROUTES"""

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

APP_ROUTERS: list[APIRouter] = []
for router in APP_ROUTERS:
    app.include_router(router=router, prefix=settings.API_V1_STR)
