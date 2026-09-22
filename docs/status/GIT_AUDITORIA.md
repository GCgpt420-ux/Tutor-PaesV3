# 📊 Auditoría Git Dinámica - Tutor-PaesV3

**Generado automáticamente:** 2026-09-22 16:31:18 Local  
**Repositorio:** https://github.com/GCgpt420-ux/Tutor-PaesV3.git  

---

## 1. Estado General del Repositorio

- **Rama Actual:** `main`
- **Remoto configurado:** `origin` (`https://github.com/GCgpt420-ux/Tutor-PaesV3.git`)
- **Estado de cambios locales:**
  Cambios locales sin confirmar:
```text
M  .gitignore
A  CLAUDE.md
M  README.md
M  docs/NAVIGATION.md
R  DOCS/AI_PERSONALIZATION_SYSTEM.md -> docs/architecture/AI_PERSONALIZATION_SYSTEM.md
R  DOCS/ARQUITECTURA_Y_ROADMAP_PRODUCCION.md -> docs/architecture/ARQUITECTURA_Y_ROADMAP_PRODUCCION.md
R  DOCS/DIAGRAMA_BASE_DE_DATOS.md -> docs/architecture/DIAGRAMA_BASE_DE_DATOS.md
R  DOCS/GUIA_ARQUITECTURA_Y_COSTOS.md -> docs/architecture/GUIA_ARQUITECTURA_Y_COSTOS.md
R  DOCS/ANALISIS_DETALLADO_PROYECTO.md -> docs/archive/ANALISIS_DETALLADO_PROYECTO.md
R  DOCS/ESTUDIO_INTEGRAL_Y_CONSENSO_ESTADO_ACTUAL.md -> docs/archive/ESTUDIO_INTEGRAL_Y_CONSENSO_ESTADO_ACTUAL.md
R  docs/status/GIT_AUDITORIA_2026-06-14.md -> docs/archive/GIT_AUDITORIA_2026-06-14.md
R  tutorpaes/backend/SCHEMA_UPDATE_SUMMARY.md -> docs/archive/SCHEMA_UPDATE_SUMMARY.md
R  documentos_backend/RADIOGRAFIA_BACKEND_2026-06-21.md -> docs/archive/radiografias_2026-06/RADIOGRAFIA_BACKEND_2026-06-21.md
R  documentos_frontend/RADIOGRAFIA_FRONTEND_2026-06-21.md -> docs/archive/radiografias_2026-06/RADIOGRAFIA_FRONTEND_2026-06-21.md
R  scripts/delete_questions.sql -> docs/archive/scripts_migracion_2026-04/delete_questions.sql
R  scripts/execute_delete.py -> docs/archive/scripts_migracion_2026-04/execute_delete.py
R  scripts/fix_future.py -> docs/archive/scripts_migracion_2026-04/fix_future.py
R  scripts/fix_utcnow2.py -> docs/archive/scripts_migracion_2026-04/fix_utcnow2.py
R  scripts/mig_utcnow.py -> docs/archive/scripts_migracion_2026-04/mig_utcnow.py
R  test_openai_integration.py -> docs/archive/test_openai_integration.py
R  DOCS/ESTRUCTURA_DE_LECTURA.md -> docs/guides/ESTRUCTURA_DE_LECTURA.md
R  DOCS/GEMINI_TUTORIAL_REPOSITORIO.md -> docs/guides/GEMINI_TUTORIAL_REPOSITORIO.md
R  DOCS/GUIA_COLABORADORES.md -> docs/guides/GUIA_COLABORADORES.md
R  DOCS/INDICE_MAESTRO_COLABORADORES.md -> docs/guides/INDICE_MAESTRO_COLABORADORES.md
R  DOCS/LECTURA_RAPIDA_IA.md -> docs/guides/LECTURA_RAPIDA_IA.md
R  DOCS/REFERENCIA_DE_ARCHIVOS.md -> docs/guides/REFERENCIA_DE_ARCHIVOS.md
R  DOCS/BACKUP_Y_ROLLBACK.md -> docs/operations/BACKUP_Y_ROLLBACK.md
R  DOCS/CHECKLIST_DESPLIEGUE_PREPROD_PROD.md -> docs/operations/CHECKLIST_DESPLIEGUE_PREPROD_PROD.md
R  DOCS/OPENAI_QUICK_START.md -> docs/operations/OPENAI_QUICK_START.md
R  DOCS/OPENAI_SETUP.md -> docs/operations/OPENAI_SETUP.md
R  DOCS/PROCESOS_OPERATIVOS.md -> docs/operations/PROCESOS_OPERATIVOS.md
R  DOCS/ROADMAP_EJECUCION_V2.md -> docs/roadmap/ROADMAP_EJECUCION_V2.md
R  DOCS/API_KEY_ROTATION_POLICY.md -> docs/security/API_KEY_ROTATION_POLICY.md
R  DOCS/BASES_SEGURIDAD.md -> docs/security/BASES_SEGURIDAD.md
M  scripts/auto_update_docs.py
D  scripts/db_backup.sh
```

## 2. Métricas de Commits

- **Total commits en la rama actual:** 68
- **Total commits en main:** 68
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

- **feature/priority-1-security-testing**: ahead 14, behind 68
  *Nota: Evaluar si los cambios ya fueron integrados por partes o si debe ser archivada.*

## 5. Estado de Worktrees Activos
```text
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3  b3c419c [main]
```

## 6. Historial de Commits Recientes (Últimos 15)
```text
b3c419c (HEAD -> main) feat(frontend): refinar tokens semanticos tailwind 3, accesibilidad en quiz y tests unitarios
8ad00d1 fix(ai-services): resolve OPENAI_TEMPERATURE attribute, cerebras import, sqlalchemy 2.0 query, and sync status documentation
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
```

---
*Este documento se actualiza automáticamente a través del script scripts/auto_update_docs.py en cada pre-commit o ejecución de integración.*
