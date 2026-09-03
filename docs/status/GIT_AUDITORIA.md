# 📊 Auditoría Git Dinámica - Tutor-PaesV3

**Generado automáticamente:** 2026-09-03 05:39:16 Local  
**Repositorio:** https://github.com/GCgpt420-ux/Tutor-PaesV3.git  

---

## 1. Estado General del Repositorio

- **Rama Actual:** `main`
- **Remoto configurado:** `origin` (`https://github.com/GCgpt420-ux/Tutor-PaesV3.git`)
- **Estado de cambios locales:**
  Cambios locales sin confirmar:
```text
M  DOCS/ESTUDIO_INTEGRAL_Y_CONSENSO_ESTADO_ACTUAL.md
M  DOCS/ROADMAP_EJECUCION_V2.md
M  README.md
M  docs/status/PROGRESS_TRACKING.md
M  docs/status/PROJECT_STATUS_REPORT.md
A  docs/superpowers/plans/2026-08-22-cierre-operativo-tutor-paes.md
A  docs/superpowers/plans/2026-08-27-panorama-integridad-piloto.md
A  docs/superpowers/specs/2026-08-22-cierre-operativo-tutor-paes-design.md
M  tutorpaes/backend/app/services/ai_service.py
M  tutorpaes/backend/app/services/llm_provider_service.py
M  tutorpaes/backend/app/services/openai_service.py
```

## 2. Métricas de Commits

- **Total commits en la rama actual:** 66
- **Total commits en main:** 66
- **Merges integrados:** 3

## 3. Inventario de Ramas

### 3.1 Ramas Locales
```text
feature/priority-1-security-testing
investigation/cierre-operativo
main
```

### 3.2 Ramas Remotas (origin)
```text
origin/HEAD -> origin/main
  origin/copilot/fix-pull-request-failure
  origin/feature/priority-1-security-testing
  origin/main
```

## 4. Análisis de Divergencia y Ramas Pendientes

- **feature/priority-1-security-testing**: ahead 14, behind 66
  *Nota: Evaluar si los cambios ya fueron integrados por partes o si debe ser archivada.*

## 5. Estado de Worktrees Activos
```text
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3                              d7e4a0a [main]
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/cierre-operativo  d7e4a0a [investigation/cierre-operativo]
```

## 6. Historial de Commits Recientes (Últimos 15)
```text
d7e4a0a (HEAD -> main, investigation/cierre-operativo) feat(auth): add student demo account and decouple demo button by role
04a7e8c fix(dev-ux): stabilize dev server with webpack and role-based views
27ea449 fix(auth-ux): retransmitir role en login proxy, condicionar CSP por entorno y limpiar LaTeX en TTS
e65467e fix(pre-pilot): consolidación de parches P0, P1, P2 y corrección de pruebas de rate limiter
3908323 docs: guia de arquitectura/costos, índice de lectura y status report actualizado
9d80b2d feat(scripts): dev-up en puerto 8001 + guard de Alembic stamp y utilidades de seed/docs
9e00b56 refactor(frontend-portal): actualizar pages protegidas, AiTutorChat, ranking, sidebar y proxies
bb0d4c9 feat(frontend-voice): deteccion de mimeType, Web Speech API nativa y limpieza de markdown en TTS
da9aadd feat(frontend-teacher): dashboard de profesor con cursos, alumnos en riesgo y performance por topico
0f85b80 fix(auth): añadir role a los schemas AuthTokenOut y UserMeOut
8ffc007 feat(ai): feedback socrático, endpoint /hint y question_id en historial chat
55c4db2 feat(teacher): nuevo modulo de profesor con cursos, alumnos y rendimiento
2e09873 feat(db): añadir modelos Course/CourseEnrollment y question_id en ChatMessage
a2f5a67 refactor(backend): extraer schemas Pydantic a app/schemas/
e10c401 (tag: pre-revision-2026-08-06, origin/main, origin/HEAD) perf(backend): optimize index strategy by removing redundant indexes and adding missing topic index
```

---
*Este documento se actualiza automáticamente a través del script scripts/auto_update_docs.py en cada pre-commit o ejecución de integración.*
