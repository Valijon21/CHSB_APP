"""
Structured (JSON lines) logging with a request id on every record.
"""
from __future__ import annotations

import json
import logging
import sys
import time
import uuid
from contextvars import ContextVar
from datetime import UTC, datetime

request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)

logger = logging.getLogger("chsb")
access_logger = logging.getLogger("chsb.access")

_EXTRA_FIELDS = ("method", "path", "status", "duration_ms")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry = {
            "time": datetime.fromtimestamp(record.created, UTC).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        request_id = getattr(record, "request_id", None) or request_id_var.get()
        if request_id:
            entry["request_id"] = request_id
        for field in _EXTRA_FIELDS:
            if hasattr(record, field):
                entry[field] = getattr(record, field)
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(entry, ensure_ascii=False)


def setup_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())
    logger.handlers = [handler]
    logger.setLevel(level.upper())
    logger.propagate = False


def _clean_request_id(value: str) -> str | None:
    if 0 < len(value) <= 64 and all(c.isalnum() or c in "-_" for c in value):
        return value
    return None


class RequestContextMiddleware:
    """Gives every request an id, returns it in X-Request-ID and writes one access log line."""

    def __init__(self, app) -> None:
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers") or [])
        request_id = _clean_request_id(headers.get(b"x-request-id", b"").decode("latin-1")) or uuid.uuid4().hex
        scope.setdefault("state", {})["request_id"] = request_id
        token = request_id_var.set(request_id)
        started = time.perf_counter()
        status = 500

        async def send_with_id(message):
            nonlocal status
            if message["type"] == "http.response.start":
                status = message["status"]
                kept = [h for h in message.get("headers", []) if h[0].lower() != b"x-request-id"]
                message["headers"] = [*kept, (b"x-request-id", request_id.encode())]
            await send(message)

        try:
            await self.app(scope, receive, send_with_id)
        finally:
            # The path only: query strings may carry personal data
            access_logger.info(
                "request",
                extra={
                    "method": scope["method"],
                    "path": scope["path"],
                    "status": status,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 1),
                },
            )
            request_id_var.reset(token)
