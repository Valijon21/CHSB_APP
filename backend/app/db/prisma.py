from prisma import Prisma

prisma = Prisma(auto_register=True)

async def get_prisma() -> Prisma:
    if not prisma.is_connected():
        await prisma.connect()
    return prisma

async def find_tenant_resilient(slug_or_id: str, db: Prisma):
    if not slug_or_id:
        return None
    cleaned = slug_or_id.strip()
    return await db.tenant.find_first(
        where={
            "OR": [
                {"slug": cleaned},
                {"id": cleaned},
                {"slug": cleaned.replace("tenant-", "")},
                {"id": f"tenant-{cleaned}"},
            ]
        }
    )

