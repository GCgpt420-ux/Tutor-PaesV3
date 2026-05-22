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

- Integración OpenAI:
  - `DOCS/OPENAI_SETUP.md`
  - `docs/status/OPENAI_INTEGRATION_COMPLETE.md`
  - `docs/status/OPENAI_VALIDATION_REPORT.md`

- Facturación y proveedores:
  - `docs/status/BILLING_INTEGRATION.md`
  - `docs/status/LLM_PROVIDERS_SETUP.md`

- Frontend y UX:
  - `docs/status/FRONTEND_CODEBASE_REPORT.md`
  - `docs/status/INSTRUCCIONES_FRONTEND_VOZ.md`

- Históricos y respaldo documental:
  - `docs/archive/GEMINI_CONTEXTO_REAL_2026-04-23`

## Regla para mantener orden

- Evitar nuevos `.md` de reporte en el root.
- Todo reporte/auditoria nueva debe ir en `docs/status`.
- Todo snapshot de contexto debe ir en `docs/archive`.
