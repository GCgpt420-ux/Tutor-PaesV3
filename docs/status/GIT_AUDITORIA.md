# 📊 Auditoría Git Dinámica - Tutor-PaesV3

**Generado automáticamente:** 2026-09-22 16:31:05 Local  
**Repositorio:** https://github.com/GCgpt420-ux/Tutor-PaesV3.git  

---

## 1. Estado General del Repositorio

- **Rama Actual:** `main`
- **Remoto configurado:** `origin` (`https://github.com/GCgpt420-ux/Tutor-PaesV3.git`)
- **Estado de cambios locales:**
  Cambios locales sin confirmar:
```text
M .gitignore
 D DOCS/AI_PERSONALIZATION_SYSTEM.md
 D DOCS/ANALISIS_DETALLADO_PROYECTO.md
 D DOCS/API_KEY_ROTATION_POLICY.md
 D DOCS/ARQUITECTURA_Y_ROADMAP_PRODUCCION.md
 D DOCS/BACKUP_Y_ROLLBACK.md
 D DOCS/BASES_SEGURIDAD.md
 D DOCS/CHECKLIST_DESPLIEGUE_PREPROD_PROD.md
 D DOCS/DIAGRAMA_BASE_DE_DATOS.md
 D DOCS/ESTRUCTURA_DE_LECTURA.md
 D DOCS/ESTUDIO_INTEGRAL_Y_CONSENSO_ESTADO_ACTUAL.md
 D DOCS/GEMINI_TUTORIAL_REPOSITORIO.md
 D DOCS/GUIA_ARQUITECTURA_Y_COSTOS.md
 D DOCS/GUIA_COLABORADORES.md
 D DOCS/INDICE_MAESTRO_COLABORADORES.md
 D DOCS/LECTURA_RAPIDA_IA.md
 D DOCS/OPENAI_QUICK_START.md
 D DOCS/OPENAI_SETUP.md
 D DOCS/PROCESOS_OPERATIVOS.md
 D DOCS/REFERENCIA_DE_ARCHIVOS.md
 D DOCS/ROADMAP_EJECUCION_V2.md
 M README.md
 M docs/NAVIGATION.md
 M docs/status/GIT_AUDITORIA.md
 D docs/status/GIT_AUDITORIA_2026-06-14.md
 M docs/status/PROJECT_STATUS_REPORT.md
A  docs/superpowers/plans/2026-09-03-refinamiento-frontend-demo.md
 D documentos_backend/RADIOGRAFIA_BACKEND_2026-06-21.md
 D documentos_frontend/RADIOGRAFIA_FRONTEND_2026-06-21.md
 M scripts/auto_update_docs.py
 D scripts/db_backup.sh
 D scripts/delete_questions.sql
 D scripts/execute_delete.py
 D scripts/fix_future.py
 D scripts/fix_utcnow2.py
 D scripts/mig_utcnow.py
 D test_openai_integration.py
 D tutorpaes/backend/SCHEMA_UPDATE_SUMMARY.md
M  tutorpaes/frontend/.env.example
M  tutorpaes/frontend/app/api/ai/explain/route.ts
M  tutorpaes/frontend/app/api/backend/[...path]/route.ts
M  tutorpaes/frontend/app/api/payments/confirm/route.ts
M  tutorpaes/frontend/app/api/payments/create/route.ts
M  tutorpaes/frontend/app/globals.css
M  tutorpaes/frontend/app/protected/ensayos/[exam_id]/page.tsx
A  tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.test.tsx
M  tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.tsx
M  tutorpaes/frontend/e2e/README.md
M  tutorpaes/frontend/package.json
M  tutorpaes/frontend/src/features/ai/components/AiTutorChat.test.tsx
M  tutorpaes/frontend/src/features/ai/components/AiTutorChat.tsx
A  tutorpaes/frontend/src/features/ai/hooks/use-ai-tutor.test.ts
M  tutorpaes/frontend/src/features/ai/hooks/use-ai-tutor.ts
M  tutorpaes/frontend/src/features/dashboard/components/quick-access.tsx
M  tutorpaes/frontend/src/features/dashboard/views/dashboard-view.tsx
M  tutorpaes/frontend/src/features/exams/components/question-card.tsx
M  tutorpaes/frontend/tailwind.config.ts
?? CLAUDE.md
?? docs/architecture/
?? docs/archive/ANALISIS_DETALLADO_PROYECTO.md
?? docs/archive/ESTUDIO_INTEGRAL_Y_CONSENSO_ESTADO_ACTUAL.md
?? docs/archive/GIT_AUDITORIA_2026-06-14.md
?? docs/archive/SCHEMA_UPDATE_SUMMARY.md
?? docs/archive/radiografias_2026-06/
?? docs/archive/scripts_migracion_2026-04/
?? docs/archive/test_openai_integration.py
?? docs/guides/
?? docs/operations/
?? docs/roadmap/
?? docs/security/
```

## 2. Métricas de Commits

- **Total commits en la rama actual:** 67
- **Total commits en main:** 67
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

- **feature/priority-1-security-testing**: ahead 14, behind 67
  *Nota: Evaluar si los cambios ya fueron integrados por partes o si debe ser archivada.*

## 5. Estado de Worktrees Activos
```text
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3  8ad00d1 [main]
```

## 6. Historial de Commits Recientes (Últimos 15)
```text
8ad00d1 (HEAD -> main) fix(ai-services): resolve OPENAI_TEMPERATURE attribute, cerebras import, sqlalchemy 2.0 query, and sync status documentation
d7e4a0a feat(auth): add student demo account and decouple demo button by role
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
```

---
*Este documento se actualiza automáticamente a través del script scripts/auto_update_docs.py en cada pre-commit o ejecución de integración.*
