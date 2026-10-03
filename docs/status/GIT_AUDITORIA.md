# 📊 Auditoría Git Dinámica - Tutor-PaesV3

**Generado automáticamente:** 2026-10-03 02:02:33 Local  
**Repositorio:** https://github.com/GCgpt420-ux/Tutor-PaesV3.git  

---

## 1. Estado General del Repositorio

- **Rama Actual:** `main`
- **Remoto configurado:** `origin` (`https://github.com/GCgpt420-ux/Tutor-PaesV3.git`)
- **Estado de cambios locales:**
  Cambios locales sin confirmar:
```text
A  docs/AUDITORIA_DEUDA_TECNICA.md
A  docs/LANZAMIENTO_PROYECTO.md
M  docs/status/GIT_AUDITORIA.md
M  docs/status/PROJECT_STATUS_REPORT.md
A  scripts/audit_pilot_users.py
A  scripts/seed_pilot_users.py
M  tutorpaes/backend/app/api/v1/endpoints/admin.py
M  tutorpaes/backend/app/api/v1/endpoints/catalog.py
M  tutorpaes/backend/app/main.py
M  tutorpaes/backend/app/schemas/admin.py
M  tutorpaes/backend/app/services/ai_service.py
A  tutorpaes/backend/app/services/study_notes_service.py
A  tutorpaes/backend/scripts/audit_pilot_users.py
M  tutorpaes/backend/scripts/seed_paes_data.py
A  tutorpaes/backend/scripts/seed_pilot_users.py
A  tutorpaes/backend/tests/test_admin_audit.py
A  tutorpaes/backend/tests/test_auth/test_seed_pilot_users.py
M  tutorpaes/backend/tests/test_catalog/test_catalog.py
M  tutorpaes/backend/tests/test_seed_paes_data_transform.py
```

## 2. Métricas de Commits

- **Total commits en la rama actual:** 92
- **Total commits en main:** 92
- **Merges integrados:** 4

## 3. Inventario de Ramas

### 3.1 Ramas Locales
```text
feature/priority-1-security-testing
main
sprint-backend
sprint-frontend
```

### 3.2 Ramas Remotas (origin)
```text
origin/HEAD -> origin/main
  origin/copilot/fix-pull-request-failure
  origin/feature/priority-1-security-testing
  origin/main
```

## 4. Análisis de Divergencia y Ramas Pendientes

- **feature/priority-1-security-testing**: ahead 14, behind 92
  *Nota: Evaluar si los cambios ya fueron integrados por partes o si debe ser archivada.*

## 5. Estado de Worktrees Activos
```text
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3                             e337091 [main]
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend   ca4ed82 [sprint-backend]
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-frontend  e337091 [sprint-frontend]
```

## 6. Historial de Commits Recientes (Últimos 15)
```text
e337091 (HEAD -> main, sprint-frontend) docs(status): documentar paleta violeta/azul residual fuera del alcance de este sprint
95130c7 feat(quiz, ai): racha de aciertos + microfeedback de borde, avatar T con estados
450f37a feat(courses): ficha de estudio por tema antes del quiz (modal conceptual)
2fcd5f0 style(auth): rediseño login/registro a identidad High Performance Cockpit
7ef8459 docs(status): documentar 3 tests de race-condition fallando en quiz page (preexistente, no bloqueante)
2f9dbbd style(home): rediseño landing page a identidad High Performance Cockpit
be82dba (origin/main, origin/HEAD) style(pricing): conversión al tema dark High Performance Cockpit
2d90cb6 style(identity): opción C — Geist+Inter fonts, paleta naranja fuego #FF6B35, superficies slate neutro
5f52095 fix(quiz, voice, catalog): fix question rendering, tutor voice, images, catalog order, report modal and telemetry
0630bb4 fix(client): normalizar endpoints eliminando trailing slash para evitar 308 redirects en Vercel
2e18ef5 fix(build): compilar con --webpack en Vercel para resolver ENOENT middleware.js.nft.json y forzar dynamic en route handler
32ba52d fix(proxy): forzar Accept-Encoding identity hacia Cloudflare tunnel para evitar streams truncados en Vercel
f7d138c fix(proxy): retornar cuerpo textual y cabeceras sanitizadas en proxy de Next.js para Vercel
545b5c5 fix(catalog): soportar rutas /exams, /subjects y /topics con y sin trailing slash para evitar 307 redirects en proxy Vercel
4667029 feat(frontend): integrar sprint-frontend (GenUI, puente tutor IA, debrief PAES) y corregir streaming proxy headers
```

---
*Este documento se actualiza automáticamente a través del script scripts/auto_update_docs.py en cada pre-commit o ejecución de integración.*
