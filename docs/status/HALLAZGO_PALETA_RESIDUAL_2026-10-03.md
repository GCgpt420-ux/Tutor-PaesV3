# Hallazgo: violeta/índigo/azul cielo residual fuera del alcance de hoy

**Fecha:** 2026-10-03 · **Worktree:** sprint-frontend.

Al cerrar las Tareas 2A/2B/3A/4A/4B se hizo un barrido final (`grep` de
`rgba(59,130,246)`, `rgba(99,102,241)`, `rgba(147,51,234)`, `rgba(168,85,247)`
y clases `*-purple-*`) para confirmar que no quedaba paleta vieja en lo que
toqué. **Sí quedó limpio todo lo tocado hoy** (home, auth, quiz, AiTutorChat,
topic-card, topic-study-modal). Pero el grep encontró que el resto del
frontend **todavía usa la paleta anterior de forma extensa y deliberada**,
no son restos sueltos — esto excede por mucho el alcance de las 4 tareas de
este sprint, así que se documenta en vez de tocarse sin que Agy/Gabriel lo
decidan.

## Alcance del hallazgo (no corregido)

**Morado (`purple-400`/`purple-500`) usado como acento secundario deliberado**
("estadística destacada" / "maestría" / "logro especial"), no como accidente:
- `src/features/dashboard/views/dashboard-view.tsx` (líneas ~559-563: card "Respuestas OK")
- `src/features/courses/components/teacher-course-detail-view.tsx` (líneas ~149-157, ~351: mismo patrón para profesores)
- `app/protected/progreso/page.tsx` (líneas ~347-368, ~505, ~556: card de racha/meta, grid de fondo, badge de "Maestría")
- `src/features/onboarding/components/OnboardingWizard.tsx` (línea ~128-129: icono de bienvenida)

**Azul cielo / índigo (`rgba(59,130,246)` / `rgba(99,102,241)` / `rgba(168,85,247)`) en sombras y gradientes:**
- `src/components/layout/sidebar.tsx` (indicador de item activo)
- `src/features/pricing/views/pricing-view.tsx` (card destacada — curioso, ya se dijo "pricing ya convertido a dark theme", pero esta sombra puntual quedó)
- `src/features/dashboard/components/quick-access.tsx`, `topic-stats.tsx`, `progress-chart.tsx`
- `src/features/exams/components/question-card.tsx` y `start-diagnostic-button.tsx` (parte del código fantasma ya documentado, pero por si se reactiva)
- `src/features/onboarding/components/OnboardingWizard.tsx` (barra de progreso y botones)
- `app/protected/quiz/[subject_code]/[topic_code]/page.tsx` línea 658 (sombra inset en alternativa seleccionada — distinta del borde ya corregido hoy en el contenedor)
- `app/globals.css` líneas 196-197 (keyframe `animate-border-beam`, morado — solo lo usa `AiExplanation.tsx`, ya documentado como código muerto), 242 (`.glass-card-strong`, también sin uso real), 319-320 (otro radial-gradient morado/índigo de fondo, revisar en qué shell se usa)

## Por qué no se corrigió ahora
- Es un volumen grande (≈15 archivos) con un patrón de uso **intencional**
  (morado = "este número es especial"), no un simple find-and-replace de
  color — reemplazarlo bien implica decidir qué token semántico lo reemplaza
  (¿success? ¿otro tono de brand-primary? ¿se elimina el énfasis especial?).
- Las 4 tareas de Agy para este sprint no lo pedían explícitamente.
- Dashboard, progreso, onboarding y la vista de profesor son superficies
  grandes que no se tocaron hoy; cambiarlas de pasada sin pedido explícito
  es más riesgo del que vale la pena asumir sin confirmación.

## Recomendación
Tratarlo como una tarea aparte ("Tarea 5: purga de paleta residual") cuando
Agy/Gabriel decidan priorizarla, idealmente antes de mostrar el dashboard o
la vista de progreso a usuarios reales — ahí es donde más se nota la mezcla
de dos identidades visuales.
