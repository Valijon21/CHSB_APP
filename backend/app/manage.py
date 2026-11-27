"""
Small administration commands.

    python -m backend.app.manage set-password <username>
"""
from __future__ import annotations

import asyncio
import getpass
import sys

from prisma import Prisma
from backend.app.core.security import BLOCKED_PASSWORDS, MIN_PASSWORD_LENGTH, get_password_hash


async def set_password(username: str, password: str) -> None:
    db = Prisma()
    await db.connect()
    try:
        user = await db.user.find_unique(where={"username": username})
        if not user:
            sys.exit(f"User '{username}' not found.")
        await db.user.update(
            where={"username": username},
            data={"hashedPassword": get_password_hash(password)},
        )
        print(f"Password updated for '{username}'.")
    finally:
        await db.disconnect()


def main(argv: list[str]) -> None:
    if len(argv) != 2 or argv[0] != "set-password":
        sys.exit(__doc__)
    password = getpass.getpass("New password: ")
    if len(password) < MIN_PASSWORD_LENGTH or password in BLOCKED_PASSWORDS:
        sys.exit(f"Choose a private password of at least {MIN_PASSWORD_LENGTH} characters.")
    if getpass.getpass("Repeat password: ") != password:
        sys.exit("Passwords do not match.")
    asyncio.run(set_password(argv[1], password))


if __name__ == "__main__":
    main(sys.argv[1:])
