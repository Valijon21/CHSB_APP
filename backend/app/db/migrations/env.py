"""
Alembic environment. Run through `python -m backend.app.manage migrate` or the alembic CLI.
"""
import asyncio

from alembic import context
from sqlalchemy import pool, text
from sqlalchemy.ext.asyncio import create_async_engine

from backend.app.core.config import settings
from backend.app.db.url import parse_database_url
from backend.app.models import Base

# Arbitrary application-wide key: only one process migrates at a time
MIGRATION_LOCK_KEY = 724_501_001

config = context.config


def run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=Base.metadata, compare_type=True)
    with context.begin_transaction():
        connection.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": MIGRATION_LOCK_KEY})
        context.run_migrations()


async def run_online() -> None:
    url, connect_args = parse_database_url(config.attributes.get("database_url") or settings.DATABASE_URL)
    engine = create_async_engine(url, connect_args=connect_args, poolclass=pool.NullPool)
    try:
        async with engine.connect() as connection:
            await connection.run_sync(run_migrations)
    finally:
        await engine.dispose()


if context.is_offline_mode():
    raise SystemExit("Offline migrations are not supported: some steps read existing data.")

asyncio.run(run_online())
