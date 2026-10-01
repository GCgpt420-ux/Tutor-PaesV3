# 📊 Auditoría Git Dinámica - Tutor-PaesV3

**Generado automáticamente:** 2026-10-01 15:58:41 Local  
**Repositorio:** https://github.com/GCgpt420-ux/Tutor-PaesV3.git  

---

## 1. Estado General del Repositorio

- **Rama Actual:** `main`
- **Remoto configurado:** `origin` (`https://github.com/GCgpt420-ux/Tutor-PaesV3.git`)
- **Estado de cambios locales:**
  Cambios locales sin confirmar:
```text
A  docs/contexto_agentes/07_DATASET_DEMRE_2026_AUDITADO.md
A  docs/contexto_agentes/08_PLAN_OPERATIVO_PILOTO_OCTUBRE.md
A  docs/contexto_agentes/09_ESTADO_HERDR_Y_AGENTES.md
A  docs/contexto_agentes/PROMPT_REINICIO_SESION_LIMPIA.md
M  docs/status/GIT_AUDITORIA.md
M  docs/status/PROJECT_STATUS_REPORT.md
A  scripts/start-local-tunnel.sh
M  tutorpaes/backend/app/services/chatbot_service.py
```

## 2. Métricas de Commits

- **Total commits en la rama actual:** 74
- **Total commits en main:** 74
- **Merges integrados:** 3

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

- **feature/priority-1-security-testing**: ahead 14, behind 74
  *Nota: Evaluar si los cambios ya fueron integrados por partes o si debe ser archivada.*

## 5. Estado de Worktrees Activos
```text
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3                             cece03c [main]
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend   cece03c [sprint-backend]
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-frontend  6e56652 [sprint-frontend]
```

## 6. Historial de Commits Recientes (Últimos 15)
```text
cece03c (HEAD -> main, sprint-backend) feat(llm): soporte oficial para proveedor OpenRouter con circuit breaker y streaming
6e56652 (sprint-frontend) docs(architecture): especificacion de arquitectura para Generative UI (GenUI) en tutor socratico
f787d05 docs: radiografia completa del proyecto para onboarding multiagente (docs/contexto_agentes)
b408e36 chore(claude): fijar directiva de aislamiento estricto de boveda Obsidian
7e4556d chore(status): actualizar auditoria git post-limpieza
3a3ddbc refactor(docs): consolidar estructura canonica docs, reparar generador de metricas y podar artefactos obsoletos
b3c419c feat(frontend): refinar tokens semanticos tailwind 3, accesibilidad en quiz y tests unitarios
8ad00d1 fix(ai-services): resolve OPENAI_TEMPERATURE attribute, cerebras import, sqlalchemy 2.0 query, and sync status documentation
d7e4a0a feat(auth): add student demo account and decouple demo button by role
04a7e8c fix(dev-ux): stabilize dev server with webpack and role-based views
27ea449 fix(auth-ux): retransmitir role en login proxy, condicionar CSP por entorno y limpiar LaTeX en TTS
e65467e fix(pre-pilot): consolidación de parches P0, P1, P2 y corrección de pruebas de rate limiter
3908323 docs: guia de arquitectura/costos, índice de lectura y status report actualizado
9d80b2d feat(scripts): dev-up en puerto 8001 + guard de Alembic stamp y utilidades de seed/docs
9e00b56 refactor(frontend-portal): actualizar pages protegidas, AiTutorChat, ranking, sidebar y proxies
```

---
*Este documento se actualiza automáticamente a través del script scripts/auto_update_docs.py en cada pre-commit o ejecución de integración.*
