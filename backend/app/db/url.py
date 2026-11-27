"""
Turn the DATABASE_URL formats handed out by hosting providers into something
SQLAlchemy's asyncpg driver accepts.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy.engine import URL, make_url

# Understood by other clients (Prisma, libpq) but rejected by asyncpg
_FOREIGN_OPTIONS = (
    "schema",
    "sslmode",
    "channel_binding",
    "connection_limit",
    "pool_timeout",
    "pgbouncer",
)


def parse_database_url(raw: str) -> tuple[URL, dict[str, Any]]:
    """Return the asyncpg URL and the extra connection arguments."""
    url = make_url(raw)
    if url.get_backend_name() not in ("postgresql", "postgres"):
        raise ValueError("DATABASE_URL must be a PostgreSQL connection string (postgresql://...)")

    options = dict(url.query)
    connect_args: dict[str, Any] = {}

    sslmode = options.get("sslmode")
    if sslmode:
        connect_args["ssl"] = sslmode

    schema = options.get("schema")
    if schema and schema != "public":
        connect_args["server_settings"] = {"search_path": schema}

    # Transaction-mode poolers cannot keep prepared statements between queries
    if options.get("pgbouncer") == "true" or "-pooler" in (url.host or ""):
        connect_args["statement_cache_size"] = 0

    url = url.set(drivername="postgresql+asyncpg").difference_update_query(_FOREIGN_OPTIONS)
    return url, connect_args
