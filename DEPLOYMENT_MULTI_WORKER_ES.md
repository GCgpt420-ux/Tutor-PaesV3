# Guia de Despliegue Multi-Worker

## Resumen

El backend de TutorPAES soporta despliegue multi-worker con Gunicorn + Uvicorn workers para mejorar concurrencia y resiliencia.

Beneficios principales:

- Mayor concurrencia para solicitudes simultaneas.
- Mejor uso de CPU en entornos con varios nucleos.
- Aislamiento de fallos entre procesos worker.
- Reinicios controlados sin tumbar todo el servicio.

## Arquitectura

### Worker unico vs multi-worker

```text
Worker unico (anterior):
  Clientes -> Uvicorn (1 proceso) -> Base de datos

Multi-worker (actual):
  Clientes -> Gunicorn (master) -> N workers Uvicorn -> Base de datos
```

En multi-worker las peticiones se reparten entre procesos, por lo que mejora el throughput bajo carga.

## Configuracion de WEB_CONCURRENCY

La cantidad de workers se controla con la variable `WEB_CONCURRENCY`.

```bash
# Valor por defecto
WEB_CONCURRENCY=2

# Recomendaciones orientativas
WEB_CONCURRENCY=4  # VM estandar
WEB_CONCURRENCY=8  # VM de mayor capacidad
```

Regla habitual:

```bash
workers = 2 * CPU_cores + 1
```

## Railway

1. Definir variable de entorno `WEB_CONCURRENCY` en el dashboard de Railway.
2. Verificar `REDIS_URL` configurada en produccion/staging.
3. Confirmar logs de arranque de Gunicorn con la cantidad esperada de workers.

## Docker

```bash
# Build
cd tutorpaes/backend
docker build -t tutorpaes-backend .

# Run
docker run -e WEB_CONCURRENCY=4 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -p 8000:8000 tutorpaes-backend
```

## Pool de conexiones y multi-worker

Recuerda que cada worker crea su propio pool.

Formula:

```text
total_conexiones = (DB_POOL_SIZE + DB_POOL_MAX_OVERFLOW) * WEB_CONCURRENCY
```

Ajusta tamanos del pool para no sobrepasar `max_connections` de PostgreSQL.

## Rate limiting: requisito de Redis

En despliegues multi-worker, el rate limiting en memoria no es suficiente porque cada proceso mantiene contadores independientes.

Por eso en produccion/staging se exige Redis para limitar globalmente entre workers.

## Parametros relevantes de Gunicorn

- `--workers ${WEB_CONCURRENCY:-2}`: numero de procesos worker.
- `--threads 2`: hilos por worker.
- `--timeout 60`: corte de workers colgados.
- `--graceful-timeout 30`: cierre elegante.
- `--max-requests 1000` + `--max-requests-jitter 100`: reinicios escalonados para evitar degradacion por fugas.

## Observabilidad

Health checks:

```bash
curl http://localhost:8000/api/v1/health/readiness
curl http://localhost:8000/api/v1/health/
```

Monitorear:

- workers activos
- latencia p50/p99
- throughput
- reinicios de workers
- conexiones totales a BD

## Troubleshooting rapido

### Puerto en uso

```bash
lsof -i :8000
kill -9 <PID>
```

### Workers caen al iniciar

Revisar variables obligatorias:

- `DATABASE_URL`
- `REDIS_URL` (en prod/staging)

### Rate limiting no aplica

Validar `REDIS_URL` y conectividad al Redis compartido.

## Checklist de migracion

- [ ] Imagen Docker multi-stage construida.
- [ ] `WEB_CONCURRENCY` configurada.
- [ ] `REDIS_URL` configurada en prod/staging.
- [ ] Pool de BD ajustado por cantidad de workers.
- [ ] Health checks verificados.
- [ ] Carga basica validada.

## Referencias

- DEPLOYMENT_MULTI_WORKER.md (version original en ingles)
- tutorpaes/backend/app/core/rate_limiter.py
- tutorpaes/backend/app/core/config.py
