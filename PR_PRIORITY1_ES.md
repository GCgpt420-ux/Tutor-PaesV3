# PR: Cierre de bloqueadores Priority 1 (Seguridad, Testing y Escalabilidad)

## Resumen

Este PR completa los 5 bloqueadores criticos de Priority 1 identificados en la auditoria tecnica:

1. Requisito obligatorio de Redis en produccion/staging para rate limiting distribuido.
2. Politica y framework de rotacion/versionado de API keys.
3. Base de pruebas E2E en frontend con Playwright (auth + quiz + accesibilidad).
4. Despliegue backend multi-worker con Gunicorn y build Docker multi-stage.
5. Eliminacion de patron N+1 en catalogo (`subjects-with-topics`) con test de regresion.

## Cambios principales

### 1) Seguridad de rate limiting
- Validacion de `REDIS_URL` obligatoria en produccion/staging.
- Fallback en memoria restringido a desarrollo.
- Pruebas de seguridad para enforcement de entorno.

### 2) Rotacion de API keys
- Nuevo modulo de gestion de llaves con versionado.
- Soporte de grace period y deprecacion.
- Script CLI para rotacion controlada.
- Politica documentada de rotacion por entorno.

### 3) Testing E2E frontend
- Configuracion Playwright para Chromium, Firefox y WebKit.
- Suite E2E para autenticacion y flujo de quiz.
- Workflow CI para ejecucion automatizada.

### 4) Multi-worker deployment
- Dockerfile multi-stage optimizado.
- Arranque con Gunicorn + Uvicorn workers.
- Uso de `WEB_CONCURRENCY` para escalado.
- Guia de despliegue en ingles + version traducida al espanol.

### 5) Optimizacion N+1 en catalogo
- Endpoint `GET /api/v1/catalog/subjects-with-topics` refactorizado a carga en bloque.
- Eager loading (`selectinload`) + filtro de topicos activos en una consulta agregada.
- Test anti-regresion para evitar reintroduccion del patron N+1.

## Evidencia de verificacion

### Backend
Comando:
```bash
cd tutorpaes/backend
.venv/bin/python -m pytest tests/test_security/test_redis_requirement.py tests/test_security/test_key_management.py tests/test_catalog/test_catalog.py -q
```
Resultado:
- 42 passed
- 1 warning
- 0 failed

### Frontend (inventario de pruebas E2E)
Comando:
```bash
cd tutorpaes/frontend
npx playwright test --list 2>/dev/null | grep -c '›'
```
Resultado:
- 90 pruebas detectadas

Nota: al canalizar `npx playwright test --list | head -60` aparece `EPIPE` por cierre de pipe, no por falla funcional de Playwright.

## Riesgos y mitigaciones

- Riesgo: subir `WEB_CONCURRENCY` sin ajustar pool de BD.
  - Mitigacion: revisar formula de conexiones totales y ajustar `DB_POOL_SIZE`/`DB_POOL_MAX_OVERFLOW`.
- Riesgo: omitir Redis en produccion/staging.
  - Mitigacion: validacion de arranque que bloquea configuraciones inseguras.

## Checklist de merge

- [x] Bloqueadores Priority 1 implementados
- [x] Verificacion tecnica ejecutada
- [x] Branch limpio
- [ ] Revision humana final
- [ ] Merge a rama base
