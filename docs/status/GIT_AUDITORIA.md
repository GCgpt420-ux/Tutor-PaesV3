# 📊 Auditoría Git Dinámica - Tutor-PaesV3

**Generado automáticamente:** 2026-10-03 00:59:41 Local  
**Repositorio:** https://github.com/GCgpt420-ux/Tutor-PaesV3.git  

---

## 1. Estado General del Repositorio

- **Rama Actual:** `main`
- **Remoto configurado:** `origin` (`https://github.com/GCgpt420-ux/Tutor-PaesV3.git`)
- **Estado de cambios locales:**
  Cambios locales sin confirmar:
```text
M  tutorpaes/frontend/app/globals.css
M  tutorpaes/frontend/app/layout.tsx
M  tutorpaes/frontend/package-lock.json
M  tutorpaes/frontend/package.json
M  tutorpaes/frontend/tailwind.config.ts
```

## 2. Métricas de Commits

- **Total commits en la rama actual:** 84
- **Total commits en main:** 84
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

- **feature/priority-1-security-testing**: ahead 14, behind 84
  *Nota: Evaluar si los cambios ya fueron integrados por partes o si debe ser archivada.*

## 5. Estado de Worktrees Activos
```text
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3                             5f52095 [main]
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend   ebc7e5b [sprint-backend]
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-frontend  fad2f04 [sprint-frontend]
```

## 6. Historial de Commits Recientes (Últimos 15)
```text
5f52095 (HEAD -> main, origin/main, origin/HEAD) fix(quiz, voice, catalog): fix question rendering, tutor voice, images, catalog order, report modal and telemetry
0630bb4 fix(client): normalizar endpoints eliminando trailing slash para evitar 308 redirects en Vercel
2e18ef5 fix(build): compilar con --webpack en Vercel para resolver ENOENT middleware.js.nft.json y forzar dynamic en route handler
32ba52d fix(proxy): forzar Accept-Encoding identity hacia Cloudflare tunnel para evitar streams truncados en Vercel
f7d138c fix(proxy): retornar cuerpo textual y cabeceras sanitizadas en proxy de Next.js para Vercel
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
```

---
*Este documento se actualiza automáticamente a través del script scripts/auto_update_docs.py en cada pre-commit o ejecución de integración.*
