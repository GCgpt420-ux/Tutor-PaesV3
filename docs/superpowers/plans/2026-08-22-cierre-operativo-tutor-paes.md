# Cierre Operativo Tutor PAES Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validar y documentar una demo estable y una base para piloto controlado de Tutor PAES, usando el flujo estudiante como criterio operativo y revisando todos los demas modulos para respaldar el proyecto de carrera.

**Architecture:** El trabajo conserva el monorepo Next.js/FastAPI/PostgreSQL existente. La investigacion se organiza por capacidades y flujos, no por lectura lineal de archivos. Las correcciones se limitan a bloqueos de operacion, reproducibilidad, seguridad basica o comprension academica.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind, FastAPI, SQLAlchemy, PostgreSQL, Alembic, pytest, Jest y TypeScript compiler.

---

## Archivos y responsabilidades

### Documentacion en el repositorio

- `docs/superpowers/specs/2026-08-22-cierre-operativo-tutor-paes-design.md`: criterios aprobados y alcance.
- `docs/superpowers/plans/2026-08-22-cierre-operativo-tutor-paes.md`: plan ejecutable y trazable.
- `docs/status/`: reportes verificables del estado, pruebas y auditorias.
- `README.md`: instrucciones minimas y actualizadas para entender y ejecutar el proyecto.

### Documentacion en Obsidian

- `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/`: bitacora de estudio y evidencia.
- `01-ESTADO-INICIAL.md`: estado Git, comandos, versiones y discrepancias encontradas.
- `02-MAPA-FUNCIONAL.md`: capacidades, actores y flujos.
- `03-ARQUITECTURA-EXPLICADA.md`: frontend, backend, datos e integraciones.
- `04-FLUJO-ESTUDIANTE.md`: recorrido operativo con evidencia por paso.
- `05-ANALISIS-DE-MODULOS/`: fichas de cada modulo secundario.
- `06-MATRIZ-DEUDA-TECNICA.md`: riesgos, evidencia, prioridad y decision.
- `07-PLAN-DE-ESTABILIZACION.md`: cambios minimos aprobados.
- `08-PLAN-DE-PRUEBAS-PILOTO.md`: preparacion y ejecucion del piloto.
- `09-CRITERIOS-DE-CIERRE.md`: condiciones de demo y piloto.
- `10-DECISION-MIGRACION.md`: decision basada en evidencia, no en intuicion.

### Codigo

No se presupone modificar codigo. Si la evidencia demuestra un bloqueo, el archivo exacto se agregara al reporte de la tarea correspondiente antes de editarlo y se incluira una prueba de regresion.

---

### Task 1: Levantar el estado reproducible del repositorio

**Files:**
- Create: `docs/status/OPERATIVIDAD_INVESTIGACION_2026-08-22.md`
- Modify: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/01-ESTADO-INICIAL.md`
- Modify: `README.md` only when its setup instructions contradict the verified runbook

- [ ] **Step 1: Registrar el estado Git sin modificar el arbol**

Run from `/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3`:

```bash
git status --short
git branch --show-current
git log -10 --oneline
git diff --check
```

Expected: branch and recent commits are recorded; unrelated worktree changes, if any, are preserved.

- [ ] **Step 2: Identificar los comandos oficiales existentes**

Review `README.md`, `scripts/dev-up.sh`, `scripts/dev-down.sh`, `scripts/smoke-demo.sh`, `scripts/smoke-phase-2-2.sh`, `scripts/db-backup.sh`, `scripts/db-restore.sh` and `scripts/db-rollback.sh`. Record the real prerequisites and port assignments in `01-ESTADO-INICIAL.md`.

- [ ] **Step 3: Ejecutar las suites sin alterar configuracion**

Run:

```bash
PYTHONPATH=tutorpaes/backend .venv/bin/pytest tutorpaes/backend/tests
cd tutorpaes/frontend && npm test -- --runInBand
cd tutorpaes/frontend && npm run typecheck
```

Expected: record exact pass/fail counts and warnings. A failure becomes an evidence item, not an excuse to claim the project is operational.

- [ ] **Step 4: Escribir el reporte inicial**

Include repository identity, clean/dirty state, reproducible commands, test results, known warnings, environment limitations, and documentation/code mismatches. Do not include secrets or values from `.env`.

- [ ] **Step 5: Corregir instrucciones publicadas que sean falsas**

Update only the contradicted setup paths, commands, ports, or directory names in `README.md`. Preserve useful historical context elsewhere and do not claim a module works without evidence.

- [ ] **Step 6: Verificar el reporte**

Run `git diff --check` and confirm that every conclusion in the report cites a command, file, test, or explicit human verification.

### Task 2: Construir el mapa funcional y tecnico

**Files:**
- Create: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/02-MAPA-FUNCIONAL.md`
- Create: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/03-ARQUITECTURA-EXPLICADA.md`

- [ ] **Step 1: Inventariar capacidades visibles**

Use the frontend route tree under `tutorpaes/frontend/app`, API routers under `tutorpaes/backend/app/api`, services under `tutorpaes/backend/app/services`, models/schemas, and existing tests. Group findings into student, teacher, AI, voice, billing, administration, security, operations, and content.

- [ ] **Step 2: Relacionar cada capacidad con sus limites**

For every capability, record actor, entry point, backend route or service, persisted data, external dependency, visible output, and known failure state. Mark missing evidence as `no verificado`, not as working.

- [ ] **Step 3: Explicar la arquitectura por flujo**

Document the request path `frontend -> Next.js BFF/proxy -> FastAPI -> service -> PostgreSQL/external provider -> response`, including authentication, fallback, error handling, and the main data entities. Link each statement to concrete repository paths.

- [ ] **Step 4: Revisar el mapa contra el grafo y el codigo**

Use the indexed canonical project to check entry points, callers, and cross-module dependencies. Resolve discrepancies by inspecting the source file, and record the final decision in the Obsidian documents.

### Task 3: Validar el flujo estudiante

**Files:**
- Create: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/04-FLUJO-ESTUDIANTE.md`
- Create: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/evidencias/smoke-tests/README.md`

- [ ] **Step 1: Preparar el entorno usando el runbook real**

Use the repository's documented startup scripts and environment template. Do not copy credentials into notes. Record services, ports, seed commands, and the exact commit used for the run.

- [ ] **Step 2: Ejecutar el recorrido de autenticacion**

Verify registration or demo account, login, session persistence, logout, and protected-route behavior. Record request, expected result, actual result, and evidence location.

- [ ] **Step 3: Ejecutar catalogo y quiz**

Verify catalog loading, subject/topic selection, quiz start, question rendering, answer submission, retry behavior, and handling of an unavailable question or API response.

- [ ] **Step 4: Ejecutar resultados y progreso**

Verify score/result rendering, persisted attempt, progress update, navigation back to the protected area, and behavior after refresh.

- [ ] **Step 5: Ejecutar tutor IA y fallback**

Verify authenticated explanation/chat request, contextual question data, provider response, fallback without a provider key or after provider failure, and visible error separation for conversational and voice failures.

- [ ] **Step 6: Registrar el veredicto del flujo**

For each step use `PASS`, `PASS_WITH_LIMITATION`, `FAIL_BLOCKING`, or `NOT_VERIFIED`. The flow is operational only when all blocking steps pass and limitations are documented with an owner and mitigation.

### Task 4: Auditar modulos secundarios

**Files:**
- Create: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/05-ANALISIS-DE-MODULOS/`
- Create: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/06-MATRIZ-DEUDA-TECNICA.md`

- [ ] **Step 1: Crear una ficha por modulo**

Create one Markdown file for backend, frontend, AI, teacher, billing, voice, administration, security, and operations. Each file must include purpose, entry points, inputs, outputs, dependencies, state, risk, evidence, and decision.

- [ ] **Step 2: Clasificar deuda funcional y tecnica**

Use severity `critical`, `high`, `medium`, or `low`; impact `pilot`, `academic`, or `future`; and decision `conservar`, `corregir`, `posponer`, or `migrar`. A finding must cite the affected path and evidence.

- [ ] **Step 3: Separate blockers from backlog**

Only mark an item as a stabilization candidate when it blocks the student flow, reproducible startup, basic security, or academic explanation. Everything else remains documented backlog until separately approved.

- [ ] **Step 4: Check cross-cutting risks**

Review secrets, authentication boundaries, error exposure, backups, migrations, provider failures, rate limits, observability, and dependency warnings. Record risks even when no code change is recommended.

### Task 5: Aplicar saneamiento minimo solo si la evidencia lo exige

**Files:**
- Modify: only files named by a blocking finding in `06-MATRIZ-DEUDA-TECNICA.md`
- Test: the nearest existing backend/frontend test file, plus a regression test when behavior changes

- [ ] **Step 1: Convert each approved blocker into a testable change**

Before editing, write the failing or missing regression test and state the exact expected behavior. Do not refactor unrelated files.

- [ ] **Step 2: Implement the smallest correction**

Change only the named production path. Preserve public contracts unless the matrix explicitly records the contract change and its consumer updates.

- [ ] **Step 3: Run focused verification**

Run the new test and the directly affected suite. Expected: the regression passes and no adjacent behavior regresses.

- [ ] **Step 4: Update evidence and documentation**

Record the commit, test command, result, and remaining limitation in the module ficha and matrix. Do not mark a risk resolved without fresh evidence.

### Task 6: Preparar el piloto controlado

**Files:**
- Create: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/07-PLAN-DE-ESTABILIZACION.md`
- Create: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/08-PLAN-DE-PRUEBAS-PILOTO.md`
- Create: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/09-CRITERIOS-DE-CIERRE.md`

- [ ] **Step 1: Define the controlled pilot boundary**

Document participants, environment, seed/content version, student flow, support channel, data handling, cost limits, and emergency shutdown procedure. Keep teacher, billing, voice, and administration outside the mandatory student pilot unless a separate risk decision promotes them.

- [ ] **Step 2: Define human content review**

Specify the initial question set, reviewer, fields to verify, verdicts, and removal process. A technically `SAFE` question is not automatically pedagogically approved.

- [ ] **Step 3: Define operational measurements**

Track completion, errors, latency, AI fallback use, cost proxy, and qualitative feedback. Document collection method and limits of interpretation.

- [ ] **Step 4: Define demo and pilot exit criteria**

Mark each criterion as `pass`, `fail`, or `not verified`, with evidence links. Do not call the MAI pedagogically effective without an evaluation design and results.

### Task 7: Emitir la decision de migracion

**Files:**
- Create: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/10-DECISION-MIGRACION.md`
- Modify: `docs/status/OPERATIVIDAD_INVESTIGACION_2026-08-22.md`

- [ ] **Step 1: Summarize retained value**

List components with demonstrated value, reliable tests, stable contracts, reusable data models, and operational scripts.

- [ ] **Step 2: Summarize migration cost and risk**

List coupling, incomplete contracts, stale documentation, provider assumptions, data migration concerns, and missing tests. Distinguish known facts from estimates.

- [ ] **Step 3: Choose one evidence-based outcome**

Use one of: `mantener y estabilizar`, `refactorizar gradualmente`, or `migrar componentes seleccionados`. A full rewrite is not the default recommendation.

- [ ] **Step 4: Publish the final report**

Include executive conclusion, operational verdict, module matrix, unresolved risks, evidence index, and next actions. Verify links and run `git diff --check` before declaring the investigation complete.

## Verification checklist

- [ ] The canonical repository and commit are explicit.
- [ ] Backend tests, frontend tests, and typecheck have recorded results.
- [ ] The student flow has step-level evidence.
- [ ] Every secondary module has a ficha and decision.
- [ ] Every debt item has severity, impact, evidence, and disposition.
- [ ] No code change exists without a blocking finding and regression evidence.
- [ ] Demo and pilot criteria are evaluated separately.
- [ ] Migration recommendation is evidence-based and names retained assets.
- [ ] Obsidian notes link back to repository paths and reports.
