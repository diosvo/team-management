"""
The root of the project, which inits the FastAPI application.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from starlette.config import Config

from .database import engine, metadata
from .exceptions import exception_handlers
from .logging_config import setup_logging

# Setup logging configuration at the start
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    metadata.create_all(bind=engine)
    logging.info("Connected to database.")

    try:
        yield
    finally:
        logging.error("Database connection failed.")


"""Metadata and Docs URLs

Hide docs by default. Show it explicitly on the selected envs only.

References:
- https://fastapi.tiangolo.com/tutorial/metadata/
"""
config = Config(".env")
ENVIRONMENT = config("ENVIRONMENT")
SHOW_DOCS_ENVIRONMENT = "dev"

TAGS_METADATA = [
    {"name": "<TAG_NAME>", "description": "<description>"},
]
openapi_tags = TAGS_METADATA if ENVIRONMENT in SHOW_DOCS_ENVIRONMENT else None

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
