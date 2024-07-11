import logging.config
from functools import lru_cache

from yaml import safe_load


@lru_cache
def setup_logging() -> logging.Logger:
    """
    Configure the logging once, and other modules can import the logger from this module.

    e.g.

    `another_module.py`

    >>> from .logging_config import logger
    >>> logger.info(<message>)
    """
    with open("logging.yaml", "r") as f:
        # Load the configuration only once using `lru_cache`.
        log_config = safe_load(f.read())
        logging.config.dictConfig(log_config)

    logger = logging.getLogger()
    logger.info("🌊 Setup logging successfully.")

    return logger


# Call `get_logger` at the module level,
# so that the configuration is done when the module is imported.
logger = setup_logging()
