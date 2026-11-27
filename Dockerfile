# ==============================================================================
# CHSB Assessment Platform: one image serving the API and the built frontend
# ==============================================================================

# --- Stage 1: Build Frontend (Vue 3 + Vite) ---
FROM node:26-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Python runtime ---
FROM python:3.14-slim AS runner
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY alembic.ini ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
    && useradd --create-home --uid 10001 chsb

USER chsb
EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
