# 📊 Auditoría Git Dinámica - Tutor-PaesV3

**Generado automáticamente:** 2026-10-04 15:12:49 Local  
**Repositorio:** https://github.com/GCgpt420-ux/Tutor-PaesV3.git  

---

## 1. Estado General del Repositorio

- **Rama Actual:** `main`
- **Remoto configurado:** `origin` (`https://github.com/GCgpt420-ux/Tutor-PaesV3.git`)
- **Estado de cambios locales:**
  Cambios locales sin confirmar:
```text
A  docs/design/ESTUDIO_IDENTIDAD_Y_MASCOTA_TUTO.md
```

## 2. Métricas de Commits

- **Total commits en la rama actual:** 98
- **Total commits en main:** 98
- **Merges integrados:** 6

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

- **feature/priority-1-security-testing**: ahead 14, behind 98
  *Nota: Evaluar si los cambios ya fueron integrados por partes o si debe ser archivada.*

## 5. Estado de Worktrees Activos
```text
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3                             e253561 [main]
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-backend   ca4ed82 [sprint-backend]
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3/.worktrees/sprint-frontend  e337091 [sprint-frontend]
```

## 6. Historial de Commits Recientes (Últimos 15)
```text
e253561 (HEAD -> main, origin/main, origin/HEAD) fix(tutor, math): forzar sintaxis LaTeX ($ y $$) en prompt de Tuto y normalizador KaTeX en frontend
450a43c merge: integración completa de sprint-frontend y sprint-backend en main
e337091 (sprint-frontend) docs(status): documentar paleta violeta/azul residual fuera del alcance de este sprint
95130c7 feat(quiz, ai): racha de aciertos + microfeedback de borde, avatar T con estados
450f37a feat(courses): ficha de estudio por tema antes del quiz (modal conceptual)
2fcd5f0 style(auth): rediseño login/registro a identidad High Performance Cockpit
ca4ed82 (sprint-backend) feat(backend): soporte de auditoria de usuarios del piloto y fichas de estudio DEMRE con ordenamiento canonico
7ef8459 docs(status): documentar 3 tests de race-condition fallando en quiz page (preexistente, no bloqueante)
2f9dbbd style(home): rediseño landing page a identidad High Performance Cockpit
b011f12 merge(main): sincronizar con main (be82dba), resolver conflictos en docs y preservar rutas y endpoints en backend
be82dba style(pricing): conversión al tema dark High Performance Cockpit
2d90cb6 style(identity): opción C — Geist+Inter fonts, paleta naranja fuego #FF6B35, superficies slate neutro
5f52095 fix(quiz, voice, catalog): fix question rendering, tutor voice, images, catalog order, report modal and telemetry
0630bb4 fix(client): normalizar endpoints eliminando trailing slash para evitar 308 redirects en Vercel
2e18ef5 fix(build): compilar con --webpack en Vercel para resolver ENOENT middleware.js.nft.json y forzar dynamic en route handler
```

---
*Este documento se actualiza automáticamente a través del script scripts/auto_update_docs.py en cada pre-commit o ejecución de integración.*
