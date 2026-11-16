#!/bin/sh
set -e

export PATH="/usr/local/bin:/usr/bin:$PATH"

echo "=========================================================="
echo "🚀 CHSB Assessment Platform - Production Container Starting"
echo "=========================================================="

# 1. Automatically configure Prisma schema based on DATABASE_URL
echo "🔍 Detecting database environment..."
python3 prisma/prepare_schema.py

# 2. Synchronize database schema (Push tables to PostgreSQL/SQLite)
echo "📦 Synchronizing Prisma database schema..."
prisma db push --accept-data-loss || echo "⚠️ Warning: prisma db push warning or non-critical error"

# 3. Ensure Prisma client is up to date
echo "⚙️ Generating Prisma client..."
prisma generate

# 4. Dynamic Port resolution (Hugging Face default is 7860, Cloud providers inject $PORT)
APP_PORT="${PORT:-7860}"
echo "🌐 Starting Uvicorn server on 0.0.0.0:${APP_PORT}..."

exec uvicorn backend.app.main:app --host 0.0.0.0 --port "${APP_PORT}" --workers 2
