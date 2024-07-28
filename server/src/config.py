"""
The global configurations, includes:

- External settings or configurations.
e.g secret keys, database credentials, credentials for email services, etc.

- Most of these settings are variable (can change), like environment mode.
And many could be sensitive, like secrets.
"""

from functools import lru_cache
from os import path
from secrets import token_urlsafe
from typing import Annotated, Any, Literal

from pydantic import (
    AnyUrl,
    BeforeValidator,
    PostgresDsn,
    ValidationError,
    computed_field,
    model_validator,
)
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing_extensions import Self

from .logging_config import logger


def parse_cors(value: Any) -> list[str] | str:
    if isinstance(value, str) and not value.startswith("["):
        return [i.strip() for i in value.split(",")]

    elif isinstance(value, list | str):
        return value

    raise ValueError(value)


# Find an exact path of .env file when we active the virtual env
ENV = path.join(path.dirname(__file__), ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV,
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
    )

    # [Global]
    API_V1_STR: str = "/api/v1"
    DOMAIN: str = "localhost"
    ENVIRONMENT: Literal["dev", "prod"] = "dev"
    PROJECT_NAME: str
    SHOW_DOCS_ENVIRONMENT: str = "dev"

    # [Authentication & Authorization]
    ALGORITHM: str = "HS256"
    TOKEN_TYPE: str = "Bearer"
    SECRET_KEY: str = token_urlsafe(32)
    SESSION_COOKIE_NAME: str = "tm.token"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # [Server]
    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    @computed_field
    @property
    def server_host(self) -> str:
        # Use HTTPS for anything other than local development
        return (
            f"http://{self.DOMAIN}"
            if self.ENVIRONMENT == "dev"
            else f"https://{self.DOMAIN}"
        )

    # [Postgres Database]
    POSTGRES_SERVER: str
    POSTGRES_PORT: int
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str = "changethis"
    POSTGRES_DB: str

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    # [Secret]
    # Update secrets with field has value "changethis"
    def _check_default_secret(self, var_name: str, value: str | None) -> None:
        if value == "changethis":
            message = (
                f'The value of {var_name} is "changethis", '
                "for security, please change it, at least for deployments."
            )
            if self.ENVIRONMENT == "dev":
                logger.warning(message, stacklevel=1)
            else:
                raise ValueError(message)

    @model_validator(mode="after")
    def _enforce_non_default_secrets(self) -> Self:
        self._check_default_secret("SECRET_KEY", self.SECRET_KEY)
        self._check_default_secret("POSTGRES_PASSWORD", self.POSTGRES_PASSWORD)

        return self


@lru_cache
def get_settings() -> Settings:
    settings = None

    try:
        settings = Settings()

    except ValidationError as error:
        logger.error(error)

    else:
        logger.info("🛠️  Get settings successfully.")
        return settings


settings = get_settings()
