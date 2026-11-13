from prisma import Prisma

prisma = Prisma(auto_register=True)

async def get_prisma() -> Prisma:
    if not prisma.is_connected():
        await prisma.connect()
    return prisma
