# 📊 Auditoría Git Dinámica - Tutor-PaesV3

**Generado automáticamente:** 2026-10-01 20:10:17 Local  
**Repositorio:** https://github.com/GCgpt420-ux/Tutor-PaesV3.git  

---

## 1. Estado General del Repositorio

- **Rama Actual:** `main`
- **Remoto configurado:** `origin` (`https://github.com/GCgpt420-ux/Tutor-PaesV3.git`)
- **Estado de cambios locales:**
  Cambios locales sin confirmar:
```text
M  tutorpaes/frontend/app/api/backend/[...path]/route.ts
```

## 2. Métricas de Commits

- **Total commits en la rama actual:** 80
- **Total commits en main:** 80
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

- **feature/priority-1-security-testing**: ahead 14, behind 80
  *Nota: Evaluar si los cambios ya fueron integrados por partes o si debe ser archivada.*

## 5. Estado de Worktrees Activos
```text
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3                             f7d138c [main]
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend   ebc7e5b [sprint-backend]
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-frontend  fad2f04 [sprint-frontend]
```

## 6. Historial de Commits Recientes (Últimos 15)
```text
f7d138c (HEAD -> main, origin/main, origin/HEAD) fix(proxy): retornar cuerpo textual y cabeceras sanitizadas en proxy de Next.js para Vercel
545b5c5 fix(catalog): soportar rutas /exams, /subjects y /topics con y sin trailing slash para evitar 307 redirects en proxy Vercel
4667029 feat(frontend): integrar sprint-frontend (GenUI, puente tutor IA, debrief PAES) y corregir streaming proxy headers
fad2f04 (sprint-frontend) feat(ux): puente tutor IA desde pregunta fallada, debrief PAES 100-1000 y starter questions
881df05 feat(ai): interceptar marcadores [WIDGET:PARABOLA|...] en el chat del tutor
cec7d9c feat(ux): puente tutor IA desde pregunta fallada, debrief PAES 100-1000 y mejoras de baja friccion
cece03c feat(llm): soporte oficial para proveedor OpenRouter con circuit breaker y streaming
6e56652 docs(architecture): especificacion de arquitectura para Generative UI (GenUI) en tutor socratico
f787d05 docs: radiografia completa del proyecto para onboarding multiagente (docs/contexto_agentes)
b408e36 chore(claude): fijar directiva de aislamiento estricto de boveda Obsidian
7e4556d chore(status): actualizar auditoria git post-limpieza
3a3ddbc refactor(docs): consolidar estructura canonica docs, reparar generador de metricas y podar artefactos obsoletos
b3c419c feat(frontend): refinar tokens semanticos tailwind 3, accesibilidad en quiz y tests unitarios
8ad00d1 fix(ai-services): resolve OPENAI_TEMPERATURE attribute, cerebras import, sqlalchemy 2.0 query, and sync status documentation
d7e4a0a feat(auth): add student demo account and decouple demo button by role
```

---
*Este documento se actualiza automáticamente a través del script scripts/auto_update_docs.py en cada pre-commit o ejecución de integración.*
