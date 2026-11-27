import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from backend.app.core.config import settings


def setup_logging(log_dir: Path | None = None) -> logging.Logger:
    target_dir = log_dir or settings.LOG_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    log_file = target_dir / "backend.log"

    logger = logging.getLogger("chsb_backend")
    logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

    # Avoid duplicate handlers across reloads/tests
    for existing in list(logger.handlers):
        logger.removeHandler(existing)
        try:
            existing.close()
        except Exception:
            pass

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=5 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    return logger
