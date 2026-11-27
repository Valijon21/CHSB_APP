"""
Database engine and per-request sessions.
"""
from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.config import settings
from backend.app.db.url import parse_database_url


class Database:
    """Owns the engine. Connected during the application lifespan."""

    def __init__(self) -> None:
        self._engine: AsyncEngine | None = None
        self._sessions: async_sessionmaker[AsyncSession] | None = None

    def connect(self, raw_url: str | None = None) -> None:
        if self._engine is not None:
            return
        url, connect_args = parse_database_url(raw_url or settings.DATABASE_URL)
        self._engine = create_async_engine(
            url,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_POOL_SIZE,
        )
        self._sessions = async_sessionmaker(self._engine, expire_on_commit=False)

    async def disconnect(self) -> None:
        if self._engine is not None:
            await self._engine.dispose()
        self._engine = None
        self._sessions = None

    def session(self) -> AsyncSession:
        if self._sessions is None:
            self.connect()
        assert self._sessions is not None
        return self._sessions()


database = Database()


async def get_session() -> AsyncIterator[AsyncSession]:
    """One session per request. Writers commit explicitly; anything else is rolled back."""
    async with database.session() as session:
        yield session
