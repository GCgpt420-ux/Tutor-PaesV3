# 📊 Auditoría Git Dinámica - Tutor-PaesV3

**Generado automáticamente:** 2026-08-06 16:49:47 Local  
**Repositorio:** https://github.com/GCgpt420-ux/Tutor-PaesV3.git  

---

## 1. Estado General del Repositorio

- **Rama Actual:** `main`
- **Remoto configurado:** `origin` (`https://github.com/GCgpt420-ux/Tutor-PaesV3.git`)
- **Estado de cambios locales:**
  Cambios locales sin confirmar:
```text
M DOCS/ESTUDIO_INTEGRAL_Y_CONSENSO_ESTADO_ACTUAL.md
 M scripts/dev-down.sh
 M scripts/dev-up.sh
 M scripts/smoke-demo.sh
 M scripts/smoke-horizon-0.sh
 M scripts/smoke-phase-2-2.sh
 M tutorpaes/backend/app/api/v1/endpoints/ai.py
M  tutorpaes/backend/app/db/models.py
 M tutorpaes/backend/app/main.py
 M tutorpaes/backend/app/services/ai_service.py
 M tutorpaes/backend/app/services/chatbot_service.py
 M tutorpaes/backend/app/services/openai_service.py
A  tutorpaes/backend/migrations/versions/08558639fa8a_add_question_id_to_chat_messages.py
A  tutorpaes/backend/migrations/versions/2c5fd0ff9850_add_courses_and_enrollments.py
 M tutorpaes/backend/tests/test_chatbot_service.py
 M tutorpaes/frontend/app/protected/admin/page.tsx
 M tutorpaes/frontend/app/protected/billing/page.tsx
 M tutorpaes/frontend/app/protected/cursos/[subject_id]/page.tsx
 M tutorpaes/frontend/app/protected/cursos/page.tsx
 M tutorpaes/frontend/app/protected/progreso/page.tsx
 M tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.tsx
 M tutorpaes/frontend/proxy.ts
 M tutorpaes/frontend/src/components/layout/sidebar.tsx
 M tutorpaes/frontend/src/features/ai/components/AiTutorChat.tsx
 M tutorpaes/frontend/src/features/auth/components/login-form.tsx
 M tutorpaes/frontend/src/features/auth/components/sign-up-form.tsx
 M tutorpaes/frontend/src/features/courses/hooks/use-courses.ts
 M tutorpaes/frontend/src/features/dashboard/views/dashboard-view.tsx
 M tutorpaes/frontend/src/features/ranking/views/ranking-page-view.tsx
 M tutorpaes/frontend/src/hooks/useVoice.ts
 M tutorpaes/frontend/src/lib/api/client.ts
 D tutorpaes/frontend/src/lib/api/exams.ts
 M tutorpaes/frontend/src/lib/auth/current-user.ts
 M tutorpaes/frontend/src/lib/server/auth-session.ts
?? DOCS/ESTRUCTURA_DE_LECTURA.md
?? DOCS/GUIA_ARQUITECTURA_Y_COSTOS.md
?? scripts/auto_update_docs.py
?? scripts/seed-teacher.sh
?? tutorpaes/backend/app/api/v1/endpoints/teacher.py
?? tutorpaes/backend/app/schemas/teacher.py
?? tutorpaes/backend/docs/
?? tutorpaes/frontend/src/features/ai/hooks/use-ai-explanation.test.ts
?? tutorpaes/frontend/src/features/courses/components/
?? tutorpaes/frontend/src/features/exams/components/start-diagnostic-button.tsx
```

## 2. Métricas de Commits

- **Total commits en la rama actual:** 53
- **Total commits en main:** 53
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

- **feature/priority-1-security-testing**: ahead 14, behind 53
  *Nota: Evaluar si los cambios ya fueron integrados por partes o si debe ser archivada.*

## 5. Estado de Worktrees Activos
```text
/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3  22c1134 [main]
```

## 6. Historial de Commits Recientes (Últimos 15)
```text
22c1134 (HEAD -> main) refactor(backend): extraer schemas Pydantic a app/schemas/
e10c401 (tag: pre-revision-2026-08-06, origin/main, origin/HEAD) perf(backend): optimize index strategy by removing redundant indexes and adding missing topic index
726a26c style(frontend): improve chatbot scroll behavior and introduce dashboard skeletal loaders
adb653d feat(frontend): add Probar Demostración button with simulated credentials typing and redirect
9ce3f84 feat(backend): add setup_demo.py script and fix duplicate SQLAlchemy user and question indexes
a38fa33 fix(frontend): import katex css to render math formulas correctly
75b9e05 docs: actualizar roadmap de ejecucion v2 a 80% en resiliencia y observabilidad despues de la implementacion
553aec7 feat: instrument LLM Provider Service with circuit breakers, retries, and fallbacks
0d7d41f feat: configure Prometheus metrics module and expose /metrics endpoint
a630573 feat: implement custom CircuitBreaker and unit tests
71f847b docs: actualizar roadmap de ejecucion v2 a fecha de hoy con progresos de deuda tecnica y resiliencia
e6286b3 design: refinar accesibilidad, de foco y elipsis tipografica en panel
b4d55aa feat: optimizar estadisticas del usuario leyendo directamente de UserProgress y unificar transacciones en quiz.py
09d803d style: remove trailing whitespace and log attempt creation conflict
e15bc41 style: fix PEP 8 line lengths and unused variable in user_progress_service.py
```

---
*Este documento se actualiza automáticamente a través del script scripts/auto_update_docs.py en cada pre-commit o ejecución de integración.*
