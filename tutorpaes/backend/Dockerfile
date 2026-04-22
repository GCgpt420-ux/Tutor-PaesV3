# Multi-stage build for optimized production image
# Stage 1: Builder - Install dependencies
FROM python:3.11-slim as builder

WORKDIR /tmp

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies (only in builder stage)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
  && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Create wheels for all dependencies
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /tmp/wheels -r requirements.txt

# Stage 2: Runtime - Minimal production image
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install only runtime dependencies (no build tools)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    libpq5 \
  && useradd --create-home --uid 10001 appuser \
  && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder
COPY --from=builder /tmp/wheels /wheels
COPY --from=builder /tmp/requirements.txt .

# Install Python dependencies from wheels (no build required)
RUN pip install --no-cache /wheels/*

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/logs \
  && chown -R appuser:appuser /app

USER appuser

# Health check for Kubernetes/Railway
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\", \"8000\")}/api/v1/health/readiness', timeout=5)"

# Gunicorn with Uvicorn workers for async support
# WEB_CONCURRENCY is set by Railway based on dyno size
# Default: 2 workers if not set
CMD ["sh", "-c", "gunicorn \
  app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers ${WEB_CONCURRENCY:-2} \
  --threads 2 \
  --worker-tmp-dir /dev/shm \
  --bind 0.0.0.0:${PORT:-8000} \
  --access-logfile - \
  --error-logfile - \
  --log-level info \
  --timeout 60 \
  --graceful-timeout 30 \
  --keep-alive 5 \
  --max-requests 1000 \
  --max-requests-jitter 100"]
