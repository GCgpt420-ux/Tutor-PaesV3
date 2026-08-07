# 📊 Auditoría Git Dinámica - Tutor-PaesV3

**Generado automáticamente:** 2026-08-07 01:14:32 Local  
**Repositorio:** https://github.com/GCgpt420-ux/Tutor-PaesV3.git  

---

## 1. Estado General del Repositorio

- **Rama Actual:** `main`
- **Remoto configurado:** `origin` (`https://github.com/GCgpt420-ux/Tutor-PaesV3.git`)
- **Estado de cambios locales:**
  Cambios locales sin confirmar:
```text
M  .gitignore
M  docs/status/PROJECT_STATUS_REPORT.md
M  scripts/dev-up.sh
M  tutorpaes/backend/app/api/v1/endpoints/teacher.py
M  tutorpaes/backend/tests/test_security/test_rate_limiter_init.py
A  tutorpaes/frontend/src/features/ai/components/AiTutorChat.test.tsx
M  tutorpaes/frontend/src/features/ai/components/AiTutorChat.tsx
M  tutorpaes/frontend/src/hooks/useVoice.ts
```

## 2. Métricas de Commits

- **Total commits en la rama actual:** 62
- **Total commits en main:** 62
- **Merges integrados:** 3

## 3. Inventario de Ramas

### 3.1 Ramas Locales
```text
feature/priority-1-security-testing
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

- **feature/priority-1-security-testing**: ahead 14, behind 62
  *Nota: Evaluar si los cambios ya fueron integrados por partes o si debe ser archivada.*

## 5. Estado de Worktrees Activos
```text
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3  3908323 [main]
```

## 6. Historial de Commits Recientes (Últimos 15)
```text
3908323 (HEAD -> main) docs: guia de arquitectura/costos, índice de lectura y status report actualizado
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
726a26c style(frontend): improve chatbot scroll behavior and introduce dashboard skeletal loaders
adb653d feat(frontend): add Probar Demostración button with simulated credentials typing and redirect
9ce3f84 feat(backend): add setup_demo.py script and fix duplicate SQLAlchemy user and question indexes
a38fa33 fix(frontend): import katex css to render math formulas correctly
```

---
*Este documento se actualiza automáticamente a través del script scripts/auto_update_docs.py en cada pre-commit o ejecución de integración.*
