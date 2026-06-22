# Navegacion del Proyecto

## Estructura recomendada

- `README.md`: entrada principal del repositorio (setup y panorama general).
- `tutorpaes/backend`: API FastAPI, servicios, tests y scripts backend.
- `tutorpaes/frontend`: app Next.js, componentes y tests frontend.
- `scripts`: utilidades operativas locales.
- `DOCS`: documentacion canónica de arquitectura, seguridad y operación.
- `docs/status`: reportes de estado, auditorias e informes ejecutivos.
- `docs/superpowers/plans`: planes de ejecución y trabajo interno.
- `docs/archive`: snapshots históricos y contexto archivado.

## Donde buscar cada cosa

- Estado global y tracking:
  - `docs/status/PROJECT_STATUS_REPORT.md`
  - `docs/status/PROGRESS_TRACKING.md`
  - `docs/status/GIT_AUDITORIA_2026-06-14.md`

- Integración OpenAI:
  - `DOCS/OPENAI_SETUP.md`
  - `docs/archive/status_cleanup_2026-06-21/OPENAI_INTEGRATION_COMPLETE.md`
  - `docs/archive/status_cleanup_2026-06-21/OPENAI_VALIDATION_REPORT.md`

- Facturación y proveedores:
  - `docs/archive/status_cleanup_2026-06-21/BILLING_INTEGRATION.md`
  - `docs/archive/status_cleanup_2026-06-21/LLM_PROVIDERS_SETUP.md`

- Frontend y UX:
  - `docs/archive/status_cleanup_2026-06-21/FRONTEND_CODEBASE_REPORT.md`
  - `docs/archive/status_cleanup_2026-06-21/INSTRUCCIONES_FRONTEND_VOZ.md`

- Históricos y respaldo documental:
  - `docs/archive/GEMINI_CONTEXTO_REAL_2026-04-23`
  - `docs/archive/status_cleanup_2026-06-21`
  - `docs/archive/doc_cleanup_2026-06-21`
  - `docs/archive/docs_isolated_2026-06-21`

## Regla para mantener orden

- Evitar nuevos `.md` de reporte en el root.
- Todo reporte/auditoria nueva debe ir en `docs/status`.
- Todo snapshot de contexto debe ir en `docs/archive`.
