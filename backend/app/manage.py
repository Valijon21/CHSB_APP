"""
Administration commands.

    python -m backend.app.manage migrate                 create or upgrade the database
    python -m backend.app.manage set-password <username>
    python -m backend.app.manage seed-curriculum         add the bundled informatics material
"""
from __future__ import annotations

import asyncio
import getpass
import logging
import sys

from alembic import command
from alembic.config import Config
from sqlalchemy import select

from backend.app.core.config import settings
from backend.app.core.security import BLOCKED_PASSWORDS, MIN_PASSWORD_LENGTH, get_password_hash
from backend.app.db.seed import seed_curriculum
from backend.app.db.session import database
from backend.app.models import User


def migrate(database_url: str | None = None) -> None:
    config = Config()
    config.set_main_option("script_location", str(settings.BASE_DIR / "backend" / "app" / "db" / "migrations"))
    if database_url:
        config.attributes["database_url"] = database_url
    command.upgrade(config, "head")


async def set_password(username: str, password: str) -> None:
    """Set a new password and sign the user out everywhere."""
    database.connect()
    try:
        async with database.session() as db:
            user = await db.scalar(select(User).where(User.username == username))
            if not user:
                raise SystemExit(f"User '{username}' not found.")
            user.hashed_password = get_password_hash(password)
            user.token_version += 1
            await db.commit()
    finally:
        await database.disconnect()


async def add_curriculum() -> tuple[int, int]:
    database.connect()
    try:
        async with database.session() as db:
            added = await seed_curriculum(db)
            await db.commit()
            return added
    finally:
        await database.disconnect()


def main(argv: list[str]) -> None:
    if argv == ["migrate"]:
        logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
        migrate()
        print("Database is up to date.")
    elif argv == ["seed-curriculum"]:
        resources, solutions = asyncio.run(add_curriculum())
        print(f"Added {resources} resources and {solutions} solutions.")
    elif len(argv) == 2 and argv[0] == "set-password":
        password = getpass.getpass("New password: ")
        if len(password) < MIN_PASSWORD_LENGTH or password in BLOCKED_PASSWORDS:
            sys.exit(f"Choose a private password of at least {MIN_PASSWORD_LENGTH} characters.")
        if len(password.encode("utf-8")) > 72:
            sys.exit("The password is too long (at most 72 bytes).")
        if getpass.getpass("Repeat password: ") != password:
            sys.exit("Passwords do not match.")
        asyncio.run(set_password(argv[1], password))
        print(f"Password updated for '{argv[1]}'.")
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
