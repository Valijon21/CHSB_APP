import os
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from contextvars import ContextVar

# ContextVar for request-level trace_id
trace_id_ctx: ContextVar[str] = ContextVar("trace_id_ctx", default="-")

LOGS_DIR = Path("backend/logs")
LOGS_DIR.mkdir(parents=True, exist_ok=True)

APP_LOG_PATH = LOGS_DIR / "app.log"
ERROR_LOG_PATH = LOGS_DIR / "error.log"

MAX_BYTES = 10 * 1024 * 1024  # 10 MB per log file
BACKUP_COUNT = 10  # Keep up to 10 rotated log files

class TraceIdFilter(logging.Filter):
    """Injects trace_id from contextvar into every log record."""
    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "trace_id"):
            record.trace_id = trace_id_ctx.get("-")
        return True

def setup_logging() -> logging.Logger:
    """Configures enterprise rotating file handlers and console stream logging."""
    logger = logging.getLogger("chsb_backend")
    logger.setLevel(logging.INFO)

    # Avoid duplicate handlers on reload
    if logger.handlers:
        return logger

    trace_filter = TraceIdFilter()

    # Formatter for persistent files
    file_formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | [%(name)s:%(lineno)d] | trace_id=%(trace_id)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Formatter for console output
    console_formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | [%(name)s] | trace_id=%(trace_id)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # 1. Rotating File Handler for all INFO, WARN, ERROR logs (app.log)
    app_handler = RotatingFileHandler(
        APP_LOG_PATH,
        maxBytes=MAX_BYTES,
        backupCount=BACKUP_COUNT,
        encoding="utf-8",
    )
    app_handler.setLevel(logging.INFO)
    app_handler.setFormatter(file_formatter)
    app_handler.addFilter(trace_filter)
    logger.addHandler(app_handler)

    # 2. Rotating File Handler for ERROR and CRITICAL logs only (error.log)
    error_handler = RotatingFileHandler(
        ERROR_LOG_PATH,
        maxBytes=MAX_BYTES,
        backupCount=BACKUP_COUNT,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    error_handler.addFilter(trace_filter)
    logger.addHandler(error_handler)

    # 3. Console Stream Handler (stdout)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)
    console_handler.addFilter(trace_filter)
    logger.addHandler(console_handler)

    return logger

logger = setup_logging()
