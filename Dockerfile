# ==============================================================================
# Production Dockerfile for CHSB Assessment Platform (Ultra-Lightweight Runtime)
# Stage 1: Build Frontend (Vue 3 + Vite)
# Stage 2: Production Python & Prisma Runtime
# ==============================================================================

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Production Python & Prisma Runtime ---
FROM python:3.11-slim AS runner
WORKDIR /app

# Install Node.js (for pre-generating Prisma during build) and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && npm install -g prisma@5.17.0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy Prisma schema and pre-generate Prisma client during BUILD time (Zero runtime overhead!)
COPY prisma/ ./prisma/
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" python prisma/prepare_schema.py && prisma generate

# Copy backend application source code
COPY backend/ ./backend/

# Copy compiled frontend from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Environment settings
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
