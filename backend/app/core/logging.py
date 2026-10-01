"""
Standard logging setup with structured output support
Zero third-party dependency so it runs cleanly on any standard Python environment.
"""
import logging
import sys
import json
from datetime import datetime
from app.core.config import settings


class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage()
        }
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)


def setup_logging():
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    handler = logging.StreamHandler(sys.stdout)
    if settings.DEBUG:
        handler.setFormatter(logging.Formatter("[%(levelname)s] %(asctime)s [%(name)s]: %(message)s"))
    else:
        handler.setFormatter(JsonFormatter())

    root_logger.handlers = [handler]


class StandardLoggerAdapter:
    def __init__(self, logger: logging.Logger):
        self._logger = logger

    def info(self, msg: str, **kwargs):
        extra_str = f" | {kwargs}" if kwargs else ""
        self._logger.info(f"{msg}{extra_str}")

    def debug(self, msg: str, **kwargs):
        extra_str = f" | {kwargs}" if kwargs else ""
        self._logger.debug(f"{msg}{extra_str}")

    def warning(self, msg: str, **kwargs):
        extra_str = f" | {kwargs}" if kwargs else ""
        self._logger.warning(f"{msg}{extra_str}")

    def error(self, msg: str, **kwargs):
        extra_str = f" | {kwargs}" if kwargs else ""
        self._logger.error(f"{msg}{extra_str}")


def get_logger(name: str = __name__):
    return StandardLoggerAdapter(logging.getLogger(name))
