import logging

import yaml


def setup_logging() -> logging.Logger:
    with open("logging.yaml", "r") as f:
        log_config = yaml.safe_load(f.read())

    # Apply the logging configuration
    logging.config.dictConfig(log_config)
