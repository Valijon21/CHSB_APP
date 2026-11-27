from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.api.v1.router import api_router
from backend.app.core.config import settings
from backend.app.core.errors import error_response, register_error_handlers
from backend.app.core.logging import RequestContextMiddleware, logger, setup_logging
from backend.app.db.seed import bootstrap
from backend.app.db.session import database

setup_logging(settings.LOG_LEVEL)


def find_frontend_file(url_path: str) -> Path | None:
    """Return a file inside the frontend build, never anything outside of it."""
    root = settings.FRONTEND_DIST.resolve()
    try:
        candidate = (root / url_path.lstrip("/")).resolve()
        if candidate.is_relative_to(root) and candidate.is_file():
            return candidate
    except (OSError, ValueError):
        return None
    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.connect()
    try:
        # Fails loudly if the database is unreachable or not migrated
        async with database.session() as session:
            await bootstrap(session)
        logger.info("Application started")
        yield
    finally:
        await database.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)


# Prevent browser/proxy caching on dynamic API responses
@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "Retry-After"],
)
# Added last so it wraps everything else
app.add_middleware(RequestContextMiddleware)
register_error_handlers(app)

# 1. API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


# 2. Health check route
@app.get("/health", tags=["Health"])
async def health_check():
    try:
        async with database.session() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check: database is unreachable")
        return JSONResponse(status_code=503, content={"status": "unhealthy", "version": settings.VERSION})
    return {
        "status": "healthy",
        "database": "postgresql",
        "version": settings.VERSION,
    }


# 3. Static assets mount (if frontend/dist/assets exists)
assets_dir = settings.FRONTEND_DIST / "assets"
if assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


# 4. Root handler: SPA index.html or API JSON
@app.get("/", tags=["Root"])
async def root():
    index_file = settings.FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "message": "CHSB Assessment Platform Enterprise API is active.",
        "docs": "/docs",
        "health": "/health",
    }


# 5. SPA Fallback / 404 Exception Handler for HTML5 History Mode
@app.exception_handler(StarletteHTTPException)
async def spa_fallback_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        # Never intercept API, Docs, or Health routes with SPA index.html
        non_spa_prefixes = (
            settings.API_V1_STR,
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
        )
        if not any(request.url.path.startswith(prefix) for prefix in non_spa_prefixes):
            # A real file from the frontend build (e.g. favicon.ico), else the Vue app
            file = find_frontend_file(request.url.path) or find_frontend_file("index.html")
            if file:
                return FileResponse(str(file))

    return error_response(request, exc.status_code, str(exc.detail), headers=exc.headers)
