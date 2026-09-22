# Navegación del Repositorio — TutorPAES

## Estructura Canónica de Directorios

- `README.md`: Entrada principal del repositorio (setup, arquitectura básica y comandos).
- `CLAUDE.md`: Guía de arquitectura, comandos y convenciones para asistentes IA y desarrolladores.
- `tutorpaes/backend/`: API FastAPI (Python 3.12, SQLAlchemy 2.0, Alembic, PostgreSQL, Redis, Prometheus).
- `tutorpaes/frontend/`: Aplicación Next.js 16 (App Router, React 19, TailwindCSS 3, React Query).
- `scripts/`: Utilidades operativas (`dev-up.sh`, `dev-down.sh`, `db-backup.sh`, `auto_update_docs.py`).
- `docs/`: Documentación técnica unificada y organizada por dominio:
  - `docs/architecture/`: Arquitectura de alto nivel, diagrama de base de datos, sistema de IA y costos.
  - `docs/security/`: Bases de seguridad, políticas de rotación de claves y auditoría de permisos.
  - `docs/operations/`: Procedimientos operativos, checklist de despliegue, backup/rollback y setup LLM.
  - `docs/guides/`: Onboarding de colaboradores, referencias de archivos y guías para agentes IA.
  - `docs/roadmap/`: Roadmap de ejecución v2 y cronograma de fases.
  - `docs/status/`: Reportes de estado dinámicos (`PROJECT_STATUS_REPORT.md`, `GIT_AUDITORIA.md`, `PROGRESS_TRACKING.md`).
  - `docs/superpowers/plans/`: Planes de ejecución técnica task-by-task.
  - `docs/archive/`: Snapshots históricos, radiografías pasadas y scripts de migración archivados.

## Dónde consultar cada aspecto

- **Estado y Salud del Proyecto:**
  - `docs/status/PROJECT_STATUS_REPORT.md` (métricas reales de tests, estado de fases y readiness).
  - `docs/status/GIT_AUDITORIA.md` (ramas, commits recientes y estado del working tree).
  - `docs/status/PROGRESS_TRACKING.md` (bitácora de progreso).

- **Arquitectura y Modelos:**
  - `docs/architecture/ARQUITECTURA_Y_ROADMAP_PRODUCCION.md`
  - `docs/architecture/DIAGRAMA_BASE_DE_DATOS.md`
  - `docs/architecture/AI_PERSONALIZATION_SYSTEM.md`

- **Seguridad y Credenciales:**
  - `docs/security/BASES_SEGURIDAD.md`
  - `docs/security/API_KEY_ROTATION_POLICY.md`

- **Operación y Despliegue:**
  - `docs/operations/CHECKLIST_DESPLIEGUE_PREPROD_PROD.md`
  - `docs/operations/PROCESOS_OPERATIVOS.md`
  - `docs/operations/BACKUP_Y_ROLLBACK.md`
  - `docs/operations/OPENAI_SETUP.md` y `OPENAI_QUICK_START.md`

## Reglas de Gobernanza Documental

1. Toda la documentación técnica vive bajo `docs/` en minúsculas. No crear carpetas `DOCS/` o especializadas en la raíz.
2. Los reportes dinámicos se generan exclusivamente mediante `python3 scripts/auto_update_docs.py`.
3. Documentos históricos, análisis caducos y scripts únicos deben situarse en `docs/archive/`.
