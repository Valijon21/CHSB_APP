import time
import uuid
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from backend.app.core.logging import logger, trace_id_ctx

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that assigns a unique Trace ID, logs request/response lifecycle,
    measures processing duration, and catches unhandled exceptions into rotating error.log.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # 1. Establish trace_id (propagate from header or generate new)
        trace_id = request.headers.get("X-Trace-ID") or uuid.uuid4().hex[:12]
        token = trace_id_ctx.set(trace_id)

        start_time = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"

        logger.info(f"--> {request.method} {request.url.path} (client={client_ip})")

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            # Log response
            level = logger.warning if response.status_code >= 400 else logger.info
            level(f"<-- {request.method} {request.url.path} status={response.status_code} duration={duration_ms}ms")

            # Inject response headers for client tracking
            response.headers["X-Trace-ID"] = trace_id
            response.headers["X-Process-Time"] = f"{duration_ms}ms"
            return response

        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"<-- EXCEPTION on {request.method} {request.url.path} after {duration_ms}ms: {exc}",
                exc_info=True,
            )
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Ichki server xatoligi yuz berdi. Iltimos, ma'muriyatga ushbu Trace ID ni taqdim eting.",
                    "traceId": trace_id,
                    "path": request.url.path,
                },
                headers={
                    "X-Trace-ID": trace_id,
                    "X-Process-Time": f"{duration_ms}ms",
                },
            )
        finally:
            trace_id_ctx.reset(token)
