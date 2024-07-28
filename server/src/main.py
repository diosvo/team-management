"""
The root of the project, which inits the FastAPI application.
"""

from fastapi import APIRouter, FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from .auth.router import router as auth_router
from .config import settings
from .middlewares.authentication import AuthenticationMiddleware
from .middlewares.exception_handler import ExceptionHandlerMiddleware
from .middlewares.process_time_header import ProcessTimeHeaderMiddleware
from .middlewares.rate_limiting import RateLimitingMiddleware
from .modules.users.router import router as users_router

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
    "servers": [
        {"url": "https://render.com", "description": "Production Env"},
    ],
    "root_path": settings.API_V1_STR,
    "generate_unique_id_function": custom_generate_unique_id,
}

if settings.ENVIRONMENT != settings.SHOW_DOCS_ENVIRONMENT:
    app_configs["docs_url"] = None


app = FastAPI(**app_configs)

"""
🛡️ Middlewares

In order to ensure that the functionalities work as expected, it is important to place middlewares in a specific order!
"""

MIDDLEWARES: list = [
    # Set all CORS enabled origins
    (
        CORSMiddleware,
        {
            "allow_origins": [
                str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS
            ],
            "allow_credentials": True,
            "allow_methods": ["*"],
            "allow_headers": ["*"],
        },
    ),
    (AuthenticationMiddleware, {}),
    (ProcessTimeHeaderMiddleware, {}),
    (RateLimitingMiddleware, {}),
    (ExceptionHandlerMiddleware, {}),
]

if settings.BACKEND_CORS_ORIGINS:
    for middleware, options in MIDDLEWARES:
        app.add_middleware(middleware, **options)


"""🚥 Routes"""

APP_ROUTERS: list[APIRouter] = [users_router, auth_router]
for router in APP_ROUTERS:
    app.include_router(router=router)
