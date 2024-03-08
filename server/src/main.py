"""
The root of the project, which inits the FastAPI application.
"""
# Third-party Packages
from fastapi import APIRouter, FastAPI
from starlette.config import Config

"""SWAGGER CONFIGURATION

Hide docs by default. Show it explicitly on the selected envs only.
"""
config = Config(".env")
ENVIRONMENT = config("ENVIRONMENT")
SHOW_DOCS_ENVIRONMENT = ("dev")

TAGS_METADATA = [
    {
        "name": "<TAG_NAME>",
        "description": "<description>"
    },
]
openapi_tags = TAGS_METADATA if ENVIRONMENT in SHOW_DOCS_ENVIRONMENT else None

"""APP ROUTES"""

app = FastAPI(
    title="Team Management",
    version="1.0.0",
    contact={
        "name": "Dios Vo",
        "email": "vtmn1212@gmail.com"
    },
    openapi_tags=openapi_tags,
)

APP_ROUTERS: list[APIRouter] = []
for router in APP_ROUTERS:
    app.include_router(router)
