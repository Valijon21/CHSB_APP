# ==============================================================================
# Multi-Stage Dockerfile for CHSB Assessment Platform
# Compatible with: Hugging Face Spaces (24/7 Free, 16GB RAM), Render, Koyeb
# Stage 1: Frontend Builder (Vue 3 + Vite + Tailwind CSS + Pinia)
# Stage 2: Runtime Container (Python FastAPI + Prisma + Embedded Frontend)
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

# Create a non-root user with UID 1000 for Hugging Face Spaces security
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Install Node.js (required by Prisma CLI engine) and system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy Prisma schema and preparation script
COPY prisma/ ./prisma/

# Copy backend application source code
COPY backend/ ./backend/

# Copy compiled frontend from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Ensure user 1000 owns /app directory for Prisma and SQLite operations
RUN chown -R appuser:appuser /app

# Switch to non-root user for security and Hugging Face Spaces compliance
USER appuser

# Environment settings (8000 standard port)
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
