from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from backend.app.core.config import settings
from backend.app.core.dependencies import Actor, require_role
from backend.app.core.logging_config import setup_logging
from backend.app.api.v1.router import api_router
from backend.app.db.prisma import prisma

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Connecting Prisma Client to Database...")
    if not prisma.is_connected():
        await prisma.connect()

    try:
        from backend.app.db.schema_sync import ensure_schema_synced
        await ensure_schema_synced(prisma)
    except Exception as e:
        logger.warning("Runtime schema sync warning: %s", e)

    try:
        tenant_count = await prisma.tenant.count()
        if tenant_count == 0:
            logger.info("Database is empty! Bootstrapping clean production foundation...")
            from backend.app.db.seed import auto_seed_db
            await auto_seed_db(prisma)
            logger.info("Clean production foundation bootstrapped!")
    except Exception as e:
        logger.warning("Production bootstrap warning: %s", e)

    yield
    logger.info("Disconnecting Prisma Client...")
    if prisma.is_connected():
        await prisma.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# Explicit CORS origins (never wildcard with allow_credentials=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.middleware("http")
async def add_security_and_cache_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response


# 1. API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


# 2. Health check route
@app.get("/health", tags=["Health"])
async def health_check():
    db_type = "postgresql" if settings.DATABASE_URL.startswith(("postgres://", "postgresql://")) else "sqlite"
    return {
        "status": "healthy",
        "database": f"{db_type}-prisma",
        "orm": "prisma-client-py",
        "version": settings.VERSION,
    }


@app.get("/api/v1/system/debug-db", tags=["System"])
async def debug_db(_actor: Actor = Depends(require_role(["REGIONAL_INSPECTOR", "SUPER_ADMIN"]))):
    if not settings.DEBUG:
        raise HTTPException(status_code=404, detail="Not Found")

    results = {}
    t = await prisma.tenant.find_first()
    results["tenant"] = t.slug if t else None
    classes = await prisma.classgroup.find_many()
    results["class_count"] = len(classes)
    return results


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    if settings.DEBUG:
        import traceback
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "type": type(exc).__name__,
                "traceback": traceback.format_exc(),
            },
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Ichki server xatoligi yuz berdi."},
    )


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
        non_spa_prefixes = (
            settings.API_V1_STR,
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
        )
        if any(request.url.path.startswith(prefix) for prefix in non_spa_prefixes):
            return JSONResponse(status_code=404, content={"detail": exc.detail or "Not Found"})

        requested_file = settings.FRONTEND_DIST / request.url.path.lstrip("/")
        if requested_file.is_file():
            return FileResponse(str(requested_file))

        index_file = settings.FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))

    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
