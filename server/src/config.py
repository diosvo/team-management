"""
The global configurations. includes:

- External settings or configurations.
e.g secret keys, database credentials, credentials for email services, etc.

- Most of these settings are variable (can change), like environment mode.
And many could be sensitive, like secrets.
"""

from functools import lru_cache

from pydantic import AnyUrl, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict

from .logging_config import logger


class Settings(BaseSettings):
    allowed_cors_origins: set[AnyUrl]
    database_dsn: str
    environment: str
    show_docs_environment: str

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        env_file_encoding="utf-8",
    )


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
