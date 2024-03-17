"""
The root of the project, which inits the FastAPI application.
"""

# Third-party Packages
from fastapi import APIRouter, FastAPI
from starlette.config import Config

# Development Modules
from .database import engine, metadata

metadata.create_all(bind=engine)

"""Metadata and Docs URLs

Hide docs by default. Show it explicitly on the selected envs only.

References:
- https://fastapi.tiangolo.com/tutorial/metadata/=))
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
    openapi_tags=openapi_tags,
)

"""APP ROUTES"""

APP_ROUTERS: list[APIRouter] = []
for router in APP_ROUTERS:
    app.include_router(router)
