"""
The root of the project, which inits the FastAPI application.
"""

from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI

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
"""

TAGS_METADATA = [
    {"name": "<TAG_NAME>", "description": "<description>"},
]
openapi_tags = (
    TAGS_METADATA if settings.environment in settings.show_docs_environment else None
)

app = FastAPI(
    title="Saigon Rovers Basketball Club",
    version="1.0.0",
    contact={
        "name": "Dios Vo",
        "url": "https://www.linkedin.com/in/diosvo/",
        "email": "vtmn1212@gmail.com",
    },
    lifespan=lifespan,
    openapi_tags=openapi_tags,
    exception_handlers=exception_handlers,
)

"""APP ROUTES"""

APP_ROUTERS: list[APIRouter] = []
for router in APP_ROUTERS:
    app.include_router(router)
