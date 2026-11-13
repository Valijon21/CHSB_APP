import asyncpg
from backend.app.core.config import settings

class Database:
    def __init__(self):
        self.pool: asyncpg.Pool | None = None

    async def connect(self):
        # Convert url to standard postgresql if needed
        dsn = settings.DATABASE_URL.replace("+asyncpg", "")
        self.pool = await asyncpg.create_pool(dsn=dsn, min_size=2, max_size=10)

    async def disconnect(self):
        if self.pool:
            await self.pool.close()

db = Database()

async def get_db():
    if not db.pool:
        await db.connect()
    async with db.pool.acquire() as connection:
        yield connection

