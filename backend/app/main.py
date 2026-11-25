from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from backend.app.core.config import settings
from backend.app.api.v1.router import api_router
from backend.app.db.prisma import prisma

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Connecting Prisma Client to Database...")
    if not prisma.is_connected():
        await prisma.connect()

    # Ensure runtime DB schema includes newly added columns/tables
    try:
        from backend.app.db.schema_sync import ensure_schema_synced
        await ensure_schema_synced(prisma)
    except Exception as e:
        print(f"⚠️ Runtime schema sync warning: {e}")

    # Self-bootstrapping / auto-seed check: if DB is fresh, automatically populate test data!
    try:
        tenant_count = await prisma.tenant.count()
        if tenant_count == 0:
            print("🌱 Database is empty! Automatically bootstrapping initial data...")
            from backend.app.db.seed import auto_seed_db
            await auto_seed_db(prisma)
            print("✅ Database successfully bootstrapped!")
        else:
            # Sync user profile names if legacy seed was present
            await prisma.user.update_many(
                where={"fullName": {"contains": "Dilmurod"}},
                data={"fullName": "Anvar Rahimov"}
            )
    except Exception as e:
        print(f"⚠️ Auto-seed bootstrap warning: {e}")

    yield
    print("🛑 Disconnecting Prisma Client...")
    if prisma.is_connected():
        await prisma.disconnect()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

# CORS configuration for Frontend Vue 3
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        if any(request.url.path.startswith(prefix) for prefix in non_spa_prefixes):
            return JSONResponse(status_code=404, content={"detail": exc.detail or "Not Found"})

        # Check if the requested file exists directly in frontend/dist (e.g. favicon.ico, logo.svg)
        requested_file = settings.FRONTEND_DIST / request.url.path.lstrip("/")
        if requested_file.is_file():
            return FileResponse(str(requested_file))

        # Otherwise serve Vue 3 SPA index.html for client-side routing
        index_file = settings.FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))

    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

