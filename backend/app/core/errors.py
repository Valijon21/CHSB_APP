"""
One error format for the whole API:

    {"detail": "...", "code": "not_found", "requestId": "..."}
"""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from backend.app.core.logging import logger

CODES = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    413: "too_large",
    422: "validation_error",
    429: "rate_limited",
    500: "internal_error",
}


def error_response(
    request: Request, status_code: int, detail: str, headers: dict | None = None, **extra
) -> JSONResponse:
    request_id = getattr(request.state, "request_id", None)
    body = {"detail": detail, "code": CODES.get(status_code, "error"), "requestId": request_id, **extra}
    headers = dict(headers or {})
    if request_id:
        headers["X-Request-ID"] = request_id
    return JSONResponse(status_code=status_code, content=body, headers=headers)


async def _validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    # Only location and message: the rejected input may contain a password
    errors = [{"field": ".".join(str(part) for part in e["loc"]), "message": e["msg"]} for e in exc.errors()]
    summary = "; ".join(f"{e['field']}: {e['message']}" for e in errors[:5])
    return error_response(request, 422, summary, errors=jsonable_encoder(errors))


async def _integrity_error(request: Request, exc: IntegrityError) -> JSONResponse:
    logger.warning("Integrity error on %s %s: %s", request.method, request.url.path, exc.orig)
    return error_response(request, 409, "Ma'lumot mavjud yozuvlar bilan ziddiyatda. Qaytadan urinib ko'ring.")


async def _unhandled_error(request: Request, exc: Exception) -> JSONResponse:
    # Details stay in the server log; clients get no internals
    logger.error(
        "Unhandled error on %s %s",
        request.method,
        request.url.path,
        exc_info=exc,
        extra={"request_id": getattr(request.state, "request_id", None)},
    )
    return error_response(request, 500, "Serverda ichki xatolik yuz berdi.")


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.add_exception_handler(IntegrityError, _integrity_error)
    app.add_exception_handler(Exception, _unhandled_error)
