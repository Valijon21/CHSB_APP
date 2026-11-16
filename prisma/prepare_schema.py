"""
Prisma Schema Provider Switcher
Automatically detects DATABASE_URL and switches datasource provider between 'postgresql' and 'sqlite'.
"""
import os
import re
from pathlib import Path

def prepare_schema():
    prisma_dir = Path(__file__).resolve().parent
    schema_path = prisma_dir / "schema.prisma"
    
    if not schema_path.exists():
        print(f"⚠️ Schema not found at {schema_path}")
        return

    db_url = os.getenv("DATABASE_URL", "")
    
    if db_url.startswith(("postgresql://", "postgres://")):
        target_provider = "postgresql"
    else:
        target_provider = "sqlite"
        
    content = schema_path.read_text(encoding="utf-8")
    
    # Replace provider in datasource db block
    new_content = re.sub(
        r'(datasource\s+db\s*\{[^}]*provider\s*=\s*")[^"]+(")',
        rf'\g<1>{target_provider}\g<2>',
        content
    )
    
    if new_content != content:
        schema_path.write_text(new_content, encoding="utf-8")
        print(f"🔄 Configured Prisma schema provider to: '{target_provider}' (based on DATABASE_URL)")
    else:
        print(f"ℹ️ Prisma schema provider is already '{target_provider}'")

if __name__ == "__main__":
    prepare_schema()
