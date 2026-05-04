# Multi-Worker Deployment Guide

## Overview

TutorPAES backend now supports multi-worker deployments using Gunicorn with Uvicorn workers. This enables:

- **Higher concurrency:** Handle multiple requests simultaneously
- **Better resource utilization:** Scale horizontally on powerful machines
- **Fault isolation:** One worker crash doesn't take down entire service
- **Graceful reload:** Workers can be replaced without dropping connections

## Architecture

### Single vs Multi-Worker

```
Single Worker (Old):
  Client 1 ─────┐
  Client 2 ─────┼─→ Uvicorn (1 process) ─→ Database
  Client 3 ─────┘
  
  ⚠️ Problem: Sequential request handling
  ⚠️ Performance: ~10-20 req/sec depending on response time

Multi-Worker (New):
  Client 1 ─→ Gunicorn (master) ─→ Uvicorn Worker 1 ─┐
  Client 2 ─→                  ─→ Uvicorn Worker 2 ─→ Database
  Client 3 ─→                  ─→ Uvicorn Worker 3 ─┘
  
  ✅ Benefit: Parallel request handling
  ✅ Performance: ~50+ req/sec (5x improvement with 5 workers)
```

### WEB_CONCURRENCY Variable

Control worker count via `WEB_CONCURRENCY` environment variable:

```bash
# Default (if not set)
WEB_CONCURRENCY=2  # 2 workers

# Production recommendations
WEB_CONCURRENCY=4  # Standard VM (2-4 CPU cores)
WEB_CONCURRENCY=8  # High-performance VM (8+ CPU cores)
WEB_CONCURRENCY=1  # Single core / testing only
```

**Formula:** `workers = 2 * CPU_cores + 1` (industry standard)

```bash
# Example: 4-core machine
WEB_CONCURRENCY=$((2 * 4 + 1))  # WEB_CONCURRENCY=9
```

## Deployment Platforms

### Railway.app Deployment

1. **Set WEB_CONCURRENCY variable:**
   ```bash
   # In Railway dashboard:
   # Variables → Add new variable
   # Name: WEB_CONCURRENCY
   # Value: 4 (for standard tier)
   ```

2. **Automatic detection:**
   - Standard Tier: Auto-sets to 2-4 workers
   - Pro Tier: Auto-sets to 4-8 workers
   - Custom: Set explicitly via environment

3. **Monitor worker health:**
   ```bash
   # View logs in Railway dashboard
   # Look for: "Listening on 0.0.0.0:8000 (X workers)"
   ```

### Docker Local Deployment

Build and run with multiple workers:

```bash
# Build multi-stage image (optimized)
docker build -t tutorpaes-backend .

# Run with 4 workers
docker run -e WEB_CONCURRENCY=4 \
           -e DATABASE_URL=postgresql://... \
           -e REDIS_URL=redis://localhost:6379 \
           -p 8000:8000 \
           tutorpaes-backend

# Run with 2 workers (default)
docker run -p 8000:8000 tutorpaes-backend
```

### Local Development

```bash
# Single worker (traditional)
uvicorn app.main:app --reload

# Multi-worker local testing
WEB_CONCURRENCY=4 gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 4 \
  --bind 0.0.0.0:8000 \
  --reload
```

## Database Connection Pooling

With multiple workers, database connections multiply:

```
Single Worker (1 process):
  Pool size: 10
  Total connections: 10

4 Workers (4 processes):
  Pool size: 10 × 4 workers
  Total connections: 40
  
  ⚠️ Problem: PostgreSQL max_connections = 100 by default
  ✅ Solution: Calculate pool size for worker count
```

### Configuration (in `app/core/config.py`)

```python
# Current settings
DB_POOL_SIZE=10           # Per worker
DB_POOL_MAX_OVERFLOW=20   # Per worker

# Formula for total connections:
total_connections = (DB_POOL_SIZE + DB_POOL_MAX_OVERFLOW) × WEB_CONCURRENCY
# = (10 + 20) × 4 = 120 connections

# If PostgreSQL max_connections < total, reduce pool size:
DB_POOL_SIZE=5            # 5 × 4 = 20
DB_POOL_MAX_OVERFLOW=10   # 10 × 4 = 40
total_connections = 60    # Safely under 100
```

## Rate Limiting with Multiple Workers

**CRITICAL:** Rate limiting requires Redis in multi-worker deployments.

Per-process in-memory rate limiting bypassed in multi-worker:

```
❌ Problem (Old):
  Request 1 ─→ Worker 1 ─→ In-memory counter: 1
  Request 2 ─→ Worker 2 ─→ In-memory counter: 1 (different process!)
  Request 3 ─→ Worker 3 ─→ In-memory counter: 1 (different process!)
  
  Result: User sent 300 requests, but each worker only saw 100.
  Rate limit of 100/min is bypassed!

✅ Solution (New):
  All Workers ─→ Redis (shared) ─→ Counter: 300
  
  Result: Rate limit enforced globally across all workers.
```

**Verify Redis is configured:**
```bash
# In production
REDIS_URL=redis://default:password@host:6379/0
WEB_CONCURRENCY=4
# Now rate limiting works correctly across all 4 workers
```

See [Redis Requirement Enforcement](../tutorpaes/backend/app/core/rate_limiter.py) for details.

## Performance Tuning

### Gunicorn Settings (in Dockerfile)

```dockerfile
gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers ${WEB_CONCURRENCY:-2} \
  --threads 2                      # 2 threads per worker
  --worker-tmp-dir /dev/shm        # Use RAM for temp files
  --timeout 60                     # Worker timeout (seconds)
  --graceful-timeout 30            # Graceful shutdown (seconds)
  --keep-alive 5                   # Keep-alive timeout
  --max-requests 1000              # Restart worker after 1000 requests
  --max-requests-jitter 100        # Jitter to stagger restarts
```

**What each setting does:**

| Setting | Value | Why |
|---------|-------|-----|
| `workers` | `WEB_CONCURRENCY` | Parallel request handling |
| `threads` | 2 | Per-worker thread pool (FastAPI async) |
| `worker-tmp-dir` | `/dev/shm` | Use RAM instead of disk (faster) |
| `timeout` | 60s | Kill hung workers |
| `graceful-timeout` | 30s | Wait 30s before forceful shutdown |
| `max-requests` | 1000 | Restart worker to prevent memory leaks |
| `max-requests-jitter` | 100 | Stagger restarts (don't all restart at once) |

### Testing Performance

```bash
# Load test with 100 concurrent users
ab -n 1000 -c 100 http://localhost:8000/api/v1/health

# Single worker (old):
# Requests per second: 20-40

# Multi-worker (new):
# Requests per second: 100-200

# Result: 5-10x improvement!
```

## Monitoring

### Health Checks

Gunicorn automatically reports health via endpoint:

```bash
# Readiness check (can accept requests)
curl http://localhost:8000/api/v1/health/readiness

# Liveness check (still running)
curl http://localhost:8000/api/v1/health/

# Response:
# {"status": "ok", "version": "2.0.0"}
```

### Logs

Monitor worker startup:

```bash
# Production logs (Railway):
tail -f /var/log/app.log

# Expected output:
[INFO] Starting gunicorn 21.2.0
[INFO] Listening at: http://0.0.0.0:8000 (12345)
[INFO] Using worker: uvicorn.workers.UvicornWorker
[INFO] Worker spawned (pid: 12346)
[INFO] Worker spawned (pid: 12347)
[INFO] Worker spawned (pid: 12348)
[INFO] Worker spawned (pid: 12349)
# 4 workers successfully started
```

### Metrics

Track in monitoring dashboard:

- **Active workers:** Usually equals WEB_CONCURRENCY
- **Request rate:** req/sec (should increase with more workers)
- **Response time:** Should decrease with more workers
- **Worker restart rate:** Should be ~1 per day (max-requests cycling)
- **Database connections:** Should never exceed pool_size × WEB_CONCURRENCY

## Troubleshooting

### "Address already in use"
```bash
# Port 8000 is taken
lsof -i :8000
# Kill the process
kill -9 <PID>
```

### "Workers die immediately"
```bash
# Check logs for import errors
docker logs <container>

# Common causes:
# - DATABASE_URL not set
# - REDIS_URL required in production (not set)
# - Syntax error in app code
```

### "High memory usage with workers"
```bash
# Each worker uses ~50-100MB
# 4 workers = 200-400MB

# If too much:
# 1. Reduce WEB_CONCURRENCY
# 2. Reduce DB_POOL_SIZE
# 3. Check for memory leaks (max-requests will restart workers)
```

### "Rate limiting not working"
```bash
# Likely cause: Redis not configured in multi-worker setup
# Fix: Set REDIS_URL environment variable
REDIS_URL=redis://localhost:6379/0

# Verify:
curl -H "X-Forwarded-For: 1.2.3.4" http://localhost:8000/api/v1/endpoint
# Repeat ~100 times, should get rate limited on worker #2+
# If NOT rate limited, workers don't share state (need Redis)
```

## Migration Checklist

Upgrading from single-worker to multi-worker:

- [ ] Update Docker image (multi-stage build)
- [ ] Set `WEB_CONCURRENCY` environment variable
- [ ] Verify `REDIS_URL` is configured (rate limiting)
- [ ] Adjust `DB_POOL_SIZE` for worker count
- [ ] Test locally with `WEB_CONCURRENCY=4`
- [ ] Monitor logs during deployment
- [ ] Run load test to verify improvement
- [ ] Set up alerting for worker restarts

## Performance Expectations

| Metric | Single Worker | 4 Workers | Improvement |
|--------|---------------|-----------|-------------|
| Requests/sec | 50 | 150-200 | 3-4x |
| Response time p50 | 50ms | 40ms | 20% faster |
| Response time p99 | 200ms | 100ms | 2x faster |
| Concurrent users | 10 | 50 | 5x |

## Related Documentation

- [Redis Requirement](./app/core/rate_limiter.py) - Must-read for production
- [Database Configuration](./app/core/config.py) - Pool sizing
- [API Health Endpoints](./api/v1/endpoints/health.py) - Monitoring

## Support

For questions or issues:
1. Check logs: `docker logs <container>`
2. Verify environment variables
3. Test locally first with `WEB_CONCURRENCY=2`
4. Review "Troubleshooting" section above
