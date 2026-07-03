# Roadmap de Ejecucion V2

## Estado del documento
- Tipo: roadmap operativo y de mejora continua.
- Estado: vigente.
- Ultima revision: 2026-07-03.
- Owner sugerido: liderazgo tecnico.

## Objetivo
Definir una hoja de ruta ejecutable por fases para seguridad, observabilidad, resiliencia y reduccion de deuda tecnica.

## Alcance
- Backend FastAPI y frontend Next.js.
- Pipeline CI/CD y seguridad de cadena de suministro.
- Operacion de base de datos (backup, restore, rollback).

## Resumen ejecutivo
1. Fase 0 y Fase 1 estan completadas.
2. Fase 2, Fase 3 y Fase 6 avanzaron significativamente con optimizaciones relacionales, resiliencia en streams y saneamiento de UI.
3. Fase 4 tiene planes técnicos definidos para Circuit Breaker y fallback de LLMs. Fases 5 y 6 avanzan de manera incremental.

## Comparativa de avance

| Area | Estado anterior | Estado actual | Nota de contraste |
|---|---:|---:|---|
| Fase 0 - Base critica | 100% | 100% | Sin cambios |
| Fase 1 - Proteccion de cambios | 100% | 100% | Sin cambios |
| Fase 2 - Seguridad en pipeline | 85% | 85% | Sin cambios |
| Fase 3 - Observabilidad | 35% | 45% | Logging, correlation IDs y Sentry listos; plan de Prometheus diseñado |
| Fase 4 - Resiliencia | 0% | 15% | Diseñados Circuit Breakers, reintentos y fallback dinámico de proveedores de LLM |
| Fase 5 - Calidad operativa | 0% | 0% | Pendiente |
| Fase 6 - Deuda tecnica | 0% | 40% | Sincronización O(1) de progreso, control de streaming leaks y accesibilidad ARIA |

## Progreso por fase

### Fase 0: Base critica
- Estado: completada.
- Progreso: 100%.
- Resultado: salida a produccion con seguridad minima aceptable.

### Fase 1: Proteccion de cambios
- Estado: completada.
- Progreso: 100%.
- Resultado: pruebas cubriendo flujos sensibles para evitar regresiones.

### Fase 2: Seguridad en pipeline
- Estado: en progreso.
- Progreso: 85%.
- Hecho:
  - Workflow de seguridad con Semgrep, Gitleaks and Trivy FS.
  - Auditoria de dependencias Python en backend CI (pip-audit).
  - Automatizacion de backup/rollback de base de datos.
- Pendiente:
  - Trivy en escaneo de imagen Docker buildada (ademas de FS).
  - Ajuste de baseline y severidad por repositorio.

### Fase 3: Observabilidad
- Estado: en progreso.
- Progreso: 45%.
- Hecho:
  - Logging estructurado JSON.
  - Correlation IDs con cabecera `X-Request-ID`.
  - Integracion base de Sentry.
  - Plan de diseño técnico para instrumentación de Prometheus en backend.
- Pendiente:
  - Endpoint `/metrics` con Prometheus (en implementación).
  - Dashboards Grafana.
  - Alertas por SLO (latencia, 5xx, disponibilidad).

### Fase 4: Resiliencia
- Estado: en progreso.
- Progreso: 15%.
- Hecho:
  - Diseño y plan técnico de Circuit Breakers (con tenacity) y política de fallback automático hacia Groq/Cerebras para LLMs.
- Pendiente:
  - Cache con Redis.
  - Implementación física del Circuit Breaker y fallback en `llm_provider_service.py`.
  - Retry con backoff y timeout por endpoint.

### Fase 5: Calidad operativa
- Estado: planificada.
- Progreso: 0%.
- Alcance objetivo:
  - Tests de recuperacion.
  - Smoke tests post-rollback.
  - Validacion periodica de backups.

### Fase 6: Deuda tecnica
- Estado: en progreso.
- Progreso: 40%.
- Hecho:
  - Optimización de base de datos relacional para estadísticas de progreso de estudiantes (O(1) con `UserProgress`).
  - Resolución de fugas de tokens en streaming mediante AbortController en el hook y desconexión asíncrona en el endpoint.
  - Refactorización estética, accesibilidad ARIA e indicadores de foco en dashboard de estudiante.
- Pendiente:
  - Lint global frontend.
  - Estandarizacion de tipos TS.
  - Refactor incremental de modulos criticos.

## Hitos de ejecucion (2 semanas)

### Semana 1
1. Completar Fase 2:
   - Endurecer reglas Semgrep por OWASP Top 10.
   - Ajustar Gitleaks para falsos positivos.
   - Agregar Trivy de imagen Docker en CI.
2. Validar pipeline en PR y `main` con reporte de hallazgos.

### Semana 2
1. Avanzar Fase 3:
   - Instrumentar backend con Prometheus.
   - Levantar stack Prometheus/Grafana para staging.
   - Definir dashboard inicial de salud y error rate.
2. Definir alertas minimas:
   - p95 latencia alta.
   - aumento 5xx.
   - falla de readiness sostenida.

## Criterios de validacion
1. Cada hito debe cerrar con evidencia en CI o pruebas de staging.
2. Todo cambio operacional debe dejar runbook actualizado.
3. Cada actualizacion del roadmap debe registrar fecha y modificacion concreta.

## Historial de modificaciones

| Fecha | Modificacion | Impacto |
|---|---|---|
| 2026-07-03 | Ajuste de Fase 3 (45%), Fase 4 (15%) y Fase 6 (40%) por mejoras relacionales, control de streaming leaks y planes técnicos de resiliencia. | Alto |
| 2026-03-15 | Creacion del roadmap v2 y consolidacion de comparativa de avance por fases. | Alto |
| 2026-03-15 | Ajuste de Fase 2 a 85% por pipeline de seguridad y backup/rollback operativo. | Alto |
| 2026-03-15 | Ajuste de Fase 3 a 35% por logging estructurado, correlation IDs y Sentry base. | Medio |

## Referencias relacionadas
- `DOCS/ARQUITECTURA_Y_ROADMAP_PRODUCCION.md`
- `DOCS/PROCESOS_OPERATIVOS.md`
- `DOCS/BACKUP_Y_ROLLBACK.md`
- `.github/workflows/security-ci.yml`
- `.github/workflows/db-backup.yml`