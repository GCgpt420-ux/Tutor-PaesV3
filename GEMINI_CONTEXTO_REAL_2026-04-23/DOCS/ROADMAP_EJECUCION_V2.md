# Roadmap de Ejecucion V2

## Estado del documento
- Tipo: roadmap operativo y de mejora continua.
- Estado: vigente.
- Ultima revision: 2026-03-15.
- Owner sugerido: liderazgo tecnico.

## Objetivo
Definir una hoja de ruta ejecutable por fases para seguridad, observabilidad, resiliencia y reduccion de deuda tecnica.

## Alcance
- Backend FastAPI y frontend Next.js.
- Pipeline CI/CD y seguridad de cadena de suministro.
- Operacion de base de datos (backup, restore, rollback).

## Resumen ejecutivo
1. Fase 0 y Fase 1 estan completadas.
2. Fase 2 y Fase 3 avanzaron por sobre el estado inicial con implementaciones efectivas en repositorio.
3. Fases 4, 5 y 6 permanecen planificadas y deben ejecutarse por lotes semanales para controlar riesgo.

## Comparativa de avance

| Area | Estado anterior | Estado actual | Nota de contraste |
|---|---:|---:|---|
| Fase 0 - Base critica | 100% | 100% | Sin cambios |
| Fase 1 - Proteccion de cambios | 100% | 100% | Sin cambios |
| Fase 2 - Seguridad en pipeline | 65% | 85% | Se agregaron workflows de seguridad y auditoria de dependencias |
| Fase 3 - Observabilidad | 25% | 35% | Se consolidaron logging estructurado, correlation IDs y Sentry |
| Fase 4 - Resiliencia | 0% | 0% | Pendiente |
| Fase 5 - Calidad operativa | 0% | 0% | Pendiente |
| Fase 6 - Deuda tecnica | 0% | 0% | Pendiente |

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
  - Workflow de seguridad con Semgrep, Gitleaks y Trivy FS.
  - Auditoria de dependencias Python en backend CI (pip-audit).
  - Automatizacion de backup/rollback de base de datos.
- Pendiente:
  - Trivy en escaneo de imagen Docker buildada (ademas de FS).
  - Ajuste de baseline y severidad por repositorio.

### Fase 3: Observabilidad
- Estado: en progreso.
- Progreso: 35%.
- Hecho:
  - Logging estructurado JSON.
  - Correlation IDs con cabecera `X-Request-ID`.
  - Integracion base de Sentry.
- Pendiente:
  - Endpoint `/metrics` con Prometheus.
  - Dashboards Grafana.
  - Alertas por SLO (latencia, 5xx, disponibilidad).

### Fase 4: Resiliencia
- Estado: planificada.
- Progreso: 0%.
- Alcance objetivo:
  - Cache con Redis.
  - Circuit breaker para OpenAI.
  - Retry con backoff y timeout por endpoint.

### Fase 5: Calidad operativa
- Estado: planificada.
- Progreso: 0%.
- Alcance objetivo:
  - Tests de recuperacion.
  - Smoke tests post-rollback.
  - Validacion periodica de backups.

### Fase 6: Deuda tecnica
- Estado: planificada.
- Progreso: 0%.
- Alcance objetivo:
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
| 2026-03-15 | Creacion del roadmap v2 y consolidacion de comparativa de avance por fases. | Alto |
| 2026-03-15 | Ajuste de Fase 2 a 85% por pipeline de seguridad y backup/rollback operativo. | Alto |
| 2026-03-15 | Ajuste de Fase 3 a 35% por logging estructurado, correlation IDs y Sentry base. | Medio |

## Referencias relacionadas
- `DOCS/ARQUITECTURA_Y_ROADMAP_PRODUCCION.md`
- `DOCS/PROCESOS_OPERATIVOS.md`
- `DOCS/BACKUP_Y_ROLLBACK.md`
- `.github/workflows/security-ci.yml`
- `.github/workflows/db-backup.yml`