#!/bin/sh
set -e

echo "=========================================================="
echo "🚀 CHSB Assessment Platform - Starting Production Service"
echo "=========================================================="

# Dynamic Port resolution (Render injects $PORT, default 8000)
APP_PORT="${PORT:-8000}"
echo "🌐 Starting Uvicorn server on 0.0.0.0:${APP_PORT}..."

exec uvicorn backend.app.main:app --host 0.0.0.0 --port "${APP_PORT}" --workers 1
