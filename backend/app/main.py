from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.v1.router import api_router
from backend.app.db.prisma import prisma

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Connecting Prisma Client to PostgreSQL 18...")
    if not prisma.is_connected():
        await prisma.connect()
    yield
    print("🛑 Disconnecting Prisma Client from PostgreSQL...")
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

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "database": "postgresql-18",
        "orm": "prisma-client-py",
        "version": settings.VERSION,
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "CHSB Assessment Platform Enterprise API is active.",
        "docs": "/docs",
        "health": "/health",
    }
