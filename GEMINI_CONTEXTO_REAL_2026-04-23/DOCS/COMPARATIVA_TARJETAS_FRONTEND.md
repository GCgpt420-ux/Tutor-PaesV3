# Comparativa de Tarjetas / Cards del Frontend

> Generado: 2025-03  
> Propósito: mapa completo del estado actual de cada componente + gap de features para planificar nuevas funciones.

---

## Leyenda de columnas

| Columna | Significado |
|---|---|
| **Estado** | `✅ Completo` `🔶 Parcial` `❌ No existe` |
| **Tiene** | Funcionalidad ya implementada (verificada en código) |
| **Le falta** | Gap identificado — funciones útiles no presentes |
| **Prioridad** | `🔴 Alta` `🟡 Media` `🟢 Baja` |
| **Acción** | Qué hacer y en qué archivo |

---

## 1. Tarjetas existentes — Componentes de Dashboard

### 1.1 `QuickAccess`
**Archivo:** `src/features/dashboard/components/quick-access.tsx`  
**Estado:** 🔶 Parcial

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| 3 cards estáticas (Cursos / Ensayos / Progreso) | Saludo personalizado al usuario ("Hola, Juan") | 🔴 Alta | Recibir `userName` como prop desde la página |
| Animación hover + gradientes | Contador dinámico ("3 ensayos pendientes") | 🟡 Media | Conectar a API de stats |
| Links con `href` directo | Streak mini-widget embebido | 🟡 Media | Añadir `<StreakWidget compact />` al header de la card de Progreso |
| — | Notificación de badge ("Nuevo ensayo disponible") | 🟢 Baja | Depende del backend de notificaciones |

---

### 1.2 `SubjectCard`
**Archivo:** `src/features/dashboard/components/subject-card.tsx`  
**Estado:** 🔶 Parcial

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| Icono dinámico (`icon_url` con fallback `BookOpen`) | Anillo de progreso circular (% temas completados) | 🔴 Alta | Aceptar prop `progressPercent` + SVG ring en la card |
| Nombre + descripción + hover CTA | Precisión histórica del usuario en esa materia | 🔴 Alta | Prop `accuracy?: number` con badge de color |
| Navegación al subject_id | "Último practicado" timestamp | 🟡 Media | Prop `lastPracticed?: string` |
| — | Badge de dificultad o cantidad de temas | 🟢 Baja | Prop `topicCount?: number` |

---

### 1.3 `TopicCard`
**Archivo:** `src/features/dashboard/components/topic-card.tsx`  
**Estado:** ✅ Completo (buena base)

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| Barra de progreso accesible (aria-valuenow) | Mejor puntaje obtenido en ese tema | 🔴 Alta | Prop `bestScore?: number` debajo de la barra |
| 3 estados visuales (sin iniciar / en progreso / completado) | Badge "Recomendado" cuando accuracy < 60% | 🟡 Media | Lógica condicional en parent o prop `isRecommended` |
| Número del tema con badge azul | Tiempo estimado de práctica | 🟢 Baja | Prop `estimatedMinutes?: number` |
| — | Botón directo a AI chat sobre ese tema | 🟢 Baja | Enlace a `/protected/tutor?topic={id}` (requiere chat) |

---

### 1.4 `ExamCard`
**Archivo:** `src/features/dashboard/components/exam-card.tsx`  
**Estado:** 🔶 Parcial

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| Badge oficial / personalizado (color diferente) | Puntaje de último intento | 🔴 Alta | Prop `lastScore?: number` con chip de color |
| Duración + fecha | Número de preguntas | 🔴 Alta | Prop `questionCount?: number` |
| Hover CTA "Rendir / Ver Detalles" | Estado (no iniciado / en progreso / completado) | 🟡 Media | Prop `status?: 'pending' \| 'in_progress' \| 'done'` |
| — | Temas cubiertos (1-2 tags) | 🟢 Baja | Prop `topicTags?: string[]` |
| — | Botón "Repetir" si ya fue completado | 🟡 Media | CTA condicional según `status` |

---

### 1.5 `AttemptHistory`
**Archivo:** `src/features/dashboard/components/attempt-history.tsx`  
**Estado:** 🔶 Parcial

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| Agrupado por mes | Filtro por materia | 🔴 Alta | State local `filterSubject` + select dropdown |
| Correcto / Incorrecto / Omitido por intento | Paginación (actualmente carga todo) | 🔴 Alta | Mostrar últimos 10 + botón "Ver más" |
| Flecha tendencia (mejorando / empeorando) | Indicador "Mejor intento" (personal best) | 🟡 Media | Calcular max accuracy en el cliente |
| Link directo a resultados | Exportar historial a CSV/PDF | 🟢 Baja | Botón con lógica de descarga |
| — | Gráfico mini de distribución de puntajes | 🟢 Baja | Sparkline SVG dentro del componente |

---

### 1.6 `ProgressChart`
**Archivo:** `src/features/dashboard/components/progress-chart.tsx`  
**Estado:** 🔶 Parcial

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| Barras SVG manuales agrupadas por semana | Línea de benchmark PAES (ej. 600 pts) | 🔴 Alta | Prop `benchmark?: number` + línea horizontal SVG |
| Últimas 8 semanas con promedio | Filtro por materia (overlay de líneas) | 🟡 Media | Select + recalcular `chartData` por subject |
| TrendingUp icon + header | Selector de rango de fechas | 🟡 Media | Props `from` / `to` date |
| — | Eje Y con etiquetas de puntaje | 🟡 Media | Añadir labels en SVG |
| — | Tooltip al hover en cada barra | 🟢 Baja | `onMouseEnter` + posición absoluta |

---

### 1.7 `TopicStats`
**Archivo:** `src/features/dashboard/components/topic-stats.tsx`  
**Estado:** 🔶 Parcial

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| Orden por accuracy desc, 3 tiers de color | Filtro por materia | 🔴 Alta | Select local + filter en `sortedTopics` |
| Barra de progreso por tema | CTA "Practicar ahora" en temas débiles (<60%) | 🔴 Alta | Botón de link a quiz del tema en los rojos |
| Resumen: dominados/en progreso/débiles | Tendencia vs período anterior (flecha ↑↓) | 🟡 Media | Prop `previousAccuracy?: Record<string, number>` |
| — | Tiempo total invertido por tema | 🟢 Baja | Requiere tracking de tiempo en backend |

---

## 2. Tarjetas existentes — Componentes de Exams

### 2.1 `AiExplanation`
**Archivo:** `src/features/exams/components/AiExplanation.tsx`  
**Estado:** ✅ Completo (buen estado)

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| SSE streaming con cursor animado | Botón "Copiar explicación" | 🔴 Alta | `navigator.clipboard.writeText(explanation)` en header |
| Rotación de tips de estudio durante carga | Feedback de calidad (👍 / 👎) | 🔴 Alta | Botones con POST a `/api/v1/ai/feedback` |
| Paywall card con link a pricing si no es premium | Botón "Regenerar" para nueva explicación | 🟡 Media | Reset del stream + nuevo fetch |
| MarkdownMathRenderer + `$` / `$$` | Guardar / bookmark explicación | 🟡 Media | Conectar con sistema de bookmarks |
| Estado de error con link a pricing | Historial de explicaciones de sesión | 🟢 Baja | `sessionStorage` local |

---

### 2.2 `QuestionCard`
**Archivo:** `src/features/exams/components/question-card.tsx`  
**Estado:** 🔶 Parcial

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| fieldset/legend/radio — accesibilidad correcta | Animación feedback inmediata (verde/rojo en la opción) | 🔴 Alta | CSS transition en la radio option al revelar respuesta |
| Texto de lectura (`reading_text`) collapsible | Sistema de pistas (Hint) antes del AI | 🔴 Alta | Botón "Ver pista" → `<HintCard questionId={...} />` |
| WhatsApp help link | Bookmark / guardar pregunta | 🟡 Media | Ícono estrella + POST `/api/v1/bookmarks` |
| `AiExplanation` embebido (condicional) | Reportar pregunta incorrecta | 🟡 Media | Ícono flag + `<QuestionReportModal />` |
| Mostrar correctAnswer/distractors si se pasan | Atajos de teclado (1–5 para seleccionar) | 🟡 Media | `useEffect` con `keydown` listener |
| — | Progreso "Pregunta X de N" | 🔴 Alta | Prop `questionNumber` / `totalQuestions` → mostrar en header |
| — | Dificultad de la pregunta (badge) | 🟢 Baja | Prop `difficulty?: 'easy'\|'medium'\|'hard'` |

---

### 2.3 `ExamResultsView`
**Archivo:** `src/features/exams/components/exam-results-view.tsx`  
**Estado:** 🔶 Parcial

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| Puntaje total + header visual | CTA "Intentar de nuevo" | 🔴 Alta | Botón con `router.push(\`/protected/ensayos/${examId}\`)` |
| Desglose por pregunta (correcto / incorrecto) | Filtro "Ver solo incorrectas" | 🔴 Alta | Toggle de estado local + `.filter()` |
| `ai_explanation` via MarkdownMathRenderer | Gráfico de distribución por materia/tema | 🟡 Media | Mini donut chart SVG con correctas/incorrectas por materia |
| Link al enunciado original de cada pregunta | Botón compartir resultado | 🟡 Media | `navigator.share()` o copiar link |
| — | Tiempo invertido por pregunta | 🟡 Media | Requiere tracking en backend (`time_spent_seconds`) |
| — | Descargar PDF del resultado | 🟢 Baja | `window.print()` o librería jsPDF |
| — | Comparar con intento anterior | 🟢 Baja | Requiere prop `previousAttempt` |

---

### 2.4 `ExamTimer`
**Archivo:** `src/features/exams/components/exam-timer.tsx`  
**Estado:** ✅ Completo (buen estado)

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| 3 estados de color (verde / naranja / rojo) | Alerta sonora opcional (toggle) | 🟡 Media | `AudioContext` + prop `soundEnabled` |
| Barra de progreso + texto contextual | Modal de confirmación para salir / pausar | 🟡 Media | Evento `beforeunload` + dialog de confirmación |
| Transición suave de colores | Tiempo extra (+5 min) si admin lo permite | 🟢 Baja | Prop `onExtendTime?` callback |

---

### 2.5 `CreateExamModal`
**Archivo:** `src/features/exams/components/create-exam-modal.tsx`  
**Estado:** 🔶 Parcial

| Tiene | Le falta | Prioridad | Acción |
|---|---|---|---|
| Fetch de catálogo PAES (exams/subjects/topics) | Presets rápidos ("Ensayo corto 20q / 45min") | 🔴 Alta | Botones de preset que setean form fields |
| Multi-select de materias y temas | Preview de distribución antes de crear | 🟡 Media | Mostrar breakdown de qué temas cubre con N preguntas |
| Selector de dificultad (any/easy/medium/hard) | Guardar configuración favorita | 🟡 Media | `localStorage` + botón "Cargar config" |
| Número de preguntas + duración | Validación de combinaciones inválidas (0 preguntas) | 🟡 Media | Disable de submit si el backend no puede satisfacer los filtros |
| — | Modo "ensayo de práctica" (sin límite de tiempo) | 🟢 Baja | Checkbox `durationMinutes = null` |

---

## 3. Tarjetas existentes — Autenticación

### 3.1 Formularios de Auth
**Archivos:** `src/components/` (login-form, sign-up-form, forgot-password-form, update-password-form)

| Componente | Tiene | Le falta | Prioridad |
|---|---|---|---|
| `LoginForm` | Email + contraseña + submit | Login con Google (OAuth) / Magic Link | 🟡 Media |
| `SignUpForm` | Email + pass + confirmación | Selector de plan al registrarse, checkbox T&C | 🟡 Media |
| `ForgotPasswordForm` | Input email + SMTP real (nuevo) | Countdown UI antes de reenvío, mensaje de rate limit | 🔴 Alta |
| `UpdatePasswordForm` | Nueva pass + confirmación + Suspense wrapper | Medidor de fortaleza de contraseña, show/hide toggle | 🔴 Alta |

---

## 4. Tarjetas / Screens NO existentes — Propuestas

> Estas secciones no tienen archivo en el repo. Cada una incluye el **archivo a crear** y el **endpoint backend requerido**.

---

### 4.1 `AiChatTutor` — Tutor conversacional
**Estado:** ❌ No existe  
**Prioridad:** 🔴 Alta  
**Archivo a crear:** `src/features/chat/components/chat-tutor.tsx`  
**Ruta:** `/protected/tutor`  
**Backend requerido:** `POST /api/v1/ai/chat` con historial de mensajes

| Funcionalidad | Notas |
|---|---|
| Chat estilo WhatsApp (burbuja usuario + burbuja AI) | Diferente al AiExplanation per-question; es conversacional libre |
| Contexto de materia/tema inyectable ("explícame Geometría") | Pasar `subject_id` / `topic_code` como system prompt |
| Soporte de LaTeX en respuestas | Reusar `MarkdownMathRenderer` ya existente |
| Historial de conversación en sesión | `sessionStorage` o tabla `chat_sessions` en DB |
| Límite de mensajes por plan (free/premium) | Misma lógica de paywall que `AiExplanation` |

---

### 4.2 `StreakWidget` — Racha de estudio
**Estado:** ❌ No existe  
**Prioridad:** 🔴 Alta  
**Archivo a crear:** `src/features/dashboard/components/streak-widget.tsx`  
**Dónde embeber:** header de `/protected/progreso` o dentro de `QuickAccess`  
**Backend requerido:** `GET /api/v1/stats/streak` → `{ current: 5, best: 12, todayDone: true }`

| Funcionalidad | Notas |
|---|---|
| Contador de días consecutivos + llama 🔥 | Motivacional, equivalente a Duolingo |
| Indicador "hoy completado" (check verde) | `todayDone` boolean del backend |
| Mini-calendario heatmap (últimos 7 días) | 7 cuadros coloreados según actividad |
| Mejor racha personal | `best` del endpoint |

---

### 4.3 `SubjectProgressRing` — Anillo de progreso por materia
**Estado:** ❌ No existe  
**Prioridad:** 🔴 Alta  
**Archivo a crear:** `src/features/dashboard/components/subject-progress-ring.tsx`  
**Dónde embeber:** `subject-card.tsx` (corner top-right) y página de detalle de materia  
**Backend requerido:** Reusar `GET /api/v1/stats/dashboard` (ya tiene `topicStats`)

| Funcionalidad | Notas |
|---|---|
| SVG circular con `stroke-dashoffset` | Radio configurable, porcentaje de temas ≥60% |
| Color según accuracy (verde/amarillo/rojo) | Misma lógica de tier que `TopicStats` |
| Tooltip al hover con número exacto | "8 de 12 temas completados" |

---

### 4.4 `NotificationCenter` — Centro de notificaciones
**Estado:** ❌ No existe  
**Prioridad:** 🟡 Media  
**Archivo a crear:** `src/features/notifications/components/notification-center.tsx`  
**Dónde embeber:** `app/protected/layout.tsx` (header global)  
**Backend requerido:** `GET /api/v1/notifications` + `PATCH /api/v1/notifications/{id}/read`

| Funcionalidad | Notas |
|---|---|
| Ícono de campana con badge número | En el header, siempre visible |
| Dropdown con lista de notificaciones | "Nuevo ensayo PAES 2024 disponible", "Alcanzaste 7 días de racha" |
| Marcar como leído / leído todo | PATCH endpoint |
| Recordatorios de estudio programados | Ej. "No has practicado en 3 días" |

---

### 4.5 `HintCard` — Sistema de pistas
**Estado:** ❌ No existe  
**Prioridad:** 🔴 Alta  
**Archivo a crear:** `src/features/exams/components/hint-card.tsx`  
**Dónde embeber:** `question-card.tsx` — botón "Ver pista" antes del AiExplanation  
**Backend requerido:** `GET /api/v1/ai/hint?question_id={id}` (respuesta corta, 2 frases, gratuito)

| Funcionalidad | Notas |
|---|---|
| 1-2 pistas sin revelar la respuesta | Redacción guiada: "Piensa en la fórmula de..." |
| Disponible para todos los planes (free) | Diferenciador: pista = free, explicación completa = premium |
| Se muestra una vez (no infinite hints) | Estado: `hintUsed: boolean` por pregunta |
| Animación de aparición (fade-in) | Transición suave al renderizar |

---

### 4.6 `OnboardingTour` — Tour de primera vez
**Estado:** ❌ No existe  
**Prioridad:** 🟡 Media  
**Archivo a crear:** `src/features/onboarding/components/onboarding-tour.tsx`  
**Dónde embeber:** `app/protected/layout.tsx` (condicional `user.onboarding_complete === false`)  
**Backend requerido:** `PATCH /api/v1/users/me` con `{ onboarding_complete: true }`

| Funcionalidad | Notas |
|---|---|
| Pasos guiados (highlight de elementos) | Paso 1: elige materia → Paso 2: primer quiz → Paso 3: ver resultado |
| Skip disponible en cualquier paso | Siempre escapable |
| No se vuelve a mostrar (flag en DB) | `onboarding_complete` en modelo User |
| Confetti al terminar | Motivacional para primera sesión |

---

### 4.7 `SavedQuestions` — Preguntas guardadas / Bookmarks
**Estado:** ❌ No existe  
**Prioridad:** 🟡 Media  
**Archivo a crear:** `src/features/bookmarks/components/saved-questions.tsx`  
**Ruta:** `/protected/guardadas`  
**Backend requerido:** `GET/POST/DELETE /api/v1/bookmarks` con FK a `Question`

| Funcionalidad | Notas |
|---|---|
| Lista de preguntas marcadas con estrella | Guardadas desde `QuestionCard` |
| Reproducir quiz solo con guardadas | Botón "Practicar guardadas" |
| Notas personales por pregunta (opcional) | Campo texto editable en cada item |
| Filtrar por materia/tema | Igual que AttemptHistory |

---

### 4.8 `StudyPlan` — Plan de estudio / Metas
**Estado:** ❌ No existe  
**Prioridad:** 🟡 Media  
**Archivo a crear:** `src/features/planning/components/study-plan.tsx`  
**Ruta o tab:** `/protected/progreso` (pestaña adicional)  
**Backend requerido:** `GET/POST /api/v1/goals` con `{ weekly_questions_goal: 100 }`

| Funcionalidad | Notas |
|---|---|
| Meta semanal configurable (nº preguntas) | Slider o input numérico |
| Barra de progreso hacia la meta | Preguntas completadas esta semana / meta |
| Temas sugeridos en base a debilidades | Lógica en backend: temas con accuracy < 60% |
| Calendario de actividad (heatmap 30 días) | GitHub-style squares |

---

### 4.9 `ExamPreview` — Vista previa antes del ensayo
**Estado:** ❌ No existe  
**Prioridad:** 🟡 Media  
**Archivo a crear:** `src/features/exams/components/exam-preview.tsx`  
**Dónde embeber:** Página de detalle del ensayo antes de iniciar (`/protected/ensayos/[exam_id]`)  
**Backend requerido:** `GET /api/v1/exams/{id}` ya existe — añadir breakdown de temas

| Funcionalidad | Notas |
|---|---|
| Distribución de preguntas por tema (donut/barra) | Antes de comenzar para prepararse |
| Tiempo estimado + nº preguntas | Resumen ejecutivo |
| Último intento + puntaje (si existe) | "La última vez obtuviste 650 pts" |
| Botón "Comenzar" prominente | CTA principal |

---

### 4.10 `QuestionReportModal` — Reportar pregunta
**Estado:** ❌ No existe  
**Prioridad:** 🟡 Media  
**Archivo a crear:** `src/features/exams/components/question-report-modal.tsx`  
**Dónde embeber:** `question-card.tsx` — ícono small `⚑` en la esquina  
**Backend requerido:** `POST /api/v1/questions/{id}/report` con `{ reason: string }`

| Funcionalidad | Notas |
|---|---|
| Opciones de motivo (enunciado incorrecto / imagen rota / respuesta errónea / otro) | Radio buttons |
| Campo de texto libre | Textarea opcional |
| Confirmación visual tras envío | Toast "Gracias, revisaremos la pregunta" |
| Panel admin para ver reportes | Ya existe `/protected/admin` — añadir tabla de reportes |

---

### 4.11 `SessionSummary` — Resumen de sesión post-quiz
**Estado:** ❌ No existe  
**Prioridad:** 🟡 Media  
**Archivo a crear:** `src/features/exams/components/session-summary.tsx`  
**Dónde embeber:** Modal/overlay al finalizar quiz (antes de `ExamResultsView` completo)  
**Backend requerido:** Reusar datos del intento

| Funcionalidad | Notas |
|---|---|
| "¡Completaste el quiz!" con puntaje grande | Pantalla de celebración |
| Tiempo total + preguntas por minuto | Estadística de eficiencia |
| Comparativa con media personal | "Tu mejor marca anterior fue X" |
| Próximo paso sugerido | "Tu punto débil: Geometría → Practicar ahora" |

---

### 4.12 `Leaderboard` — Tabla de clasificación
**Estado:** ❌ No existe  
**Prioridad:** 🟢 Baja  
**Archivo a crear:** `src/features/social/components/leaderboard.tsx`  
**Ruta:** `/protected/ranking`  
**Backend requerido:** `GET /api/v1/social/leaderboard?subject_id=...&period=week`

| Funcionalidad | Notas |
|---|---|
| Top 10 usuarios por precisión (anonimizados) | Solo avatar/iniciales, sin datos personales |
| Filtro por materia y período (semana/mes/total) | Select + fetch |
| Posición del usuario actual resaltada | Aunque no esté en top 10 |
| Badges de logros ("Primer lugar en Matemáticas") | Gamificación ligera |

---

## 5. Resumen ejecutivo — Prioridades de implementación

### Sprint inmediato (Alta prioridad 🔴)

| # | Feature | Componente a tocar | Esfuerzo est. |
|---|---|---|---|
| 1 | Contador/progreso "Pregunta X de N" en quiz | `question-card.tsx` | 1h |
| 2 | Animación feedback correcto/incorrecto en opciones | `question-card.tsx` | 2h |
| 3 | CTA "Intentar de nuevo" en resultados | `exam-results-view.tsx` | 1h |
| 4 | Filtro "Solo incorrectas" en resultados | `exam-results-view.tsx` | 2h |
| 5 | Presets rápidos en modal de creación | `create-exam-modal.tsx` | 2h |
| 6 | Botón copiar + feedback 👍👎 en AiExplanation | `AiExplanation.tsx` | 2h |
| 7 | `HintCard` (pistas antes de AI, nivel free) | NUEVO `hint-card.tsx` | 4h |
| 8 | `StreakWidget` con datos reales del backend | NUEVO `streak-widget.tsx` | 4h |
| 9 | Anillo de progreso en `SubjectCard` | `subject-card.tsx` + ring SVG | 3h |
| 10 | Medidor de fortaleza en `UpdatePasswordForm` | `update-password-form.tsx` | 2h |

### Siguiente iteración (Media prioridad 🟡)

| # | Feature | Componente | Esfuerzo est. |
|---|---|---|---|
| 11 | Filtro por materia en TopicStats y AttemptHistory | 2 componentes existentes | 3h |
| 12 | Línea benchmark PAES en ProgressChart | `progress-chart.tsx` | 2h |
| 13 | `ExamPreview` antes de iniciar ensayo | NUEVO `exam-preview.tsx` | 4h |
| 14 | `OnboardingTour` de primer acceso | NUEVO, requiere backend flag | 6h |
| 15 | `AiChatTutor` conversacional | NUEVO + endpoint backend | 8h |
| 16 | `QuestionReportModal` con flag en admin | NUEVO + backend CRUD | 4h |
| 17 | `SessionSummary` post-quiz | NUEVO overlay | 4h |
| 18 | `SavedQuestions` (bookmarks) | NUEVO + backend CRUD | 6h |

### Backlog (Baja prioridad 🟢)

| # | Feature | Componente |
|---|---|---|
| 19 | `StudyPlan` / metas semanales | NUEVO |
| 20 | `NotificationCenter` global | NUEVO + backend |
| 21 | `Leaderboard` anónimo | NUEVO + backend |
| 22 | Exportar PDF de resultados | `exam-results-view.tsx` |
| 23 | OAuth Google en login | `login-form.tsx` + Supabase OAuth |
| 24 | Tooltips en `ProgressChart` | `progress-chart.tsx` |

---

## 6. Mapa de dependencias entre nuevas features

```
AiChatTutor ──── requiere ──── POST /api/v1/ai/chat (nuevo endpoint)
HintCard ──────── requiere ──── GET /api/v1/ai/hint (nuevo endpoint, ligero)
StreakWidget ───── requiere ──── GET /api/v1/stats/streak (nuevo endpoint)
SavedQuestions ─── requiere ──── CRUD /api/v1/bookmarks (nuevo)
QuestionReportModal ─ requiere ─ POST /api/v1/questions/{id}/report (nuevo)
OnboardingTour ──── requiere ──── PATCH /api/v1/users/me (ya existe)
StudyPlan ──────── requiere ──── CRUD /api/v1/goals (nuevo)
Leaderboard ──────── requiere ──── GET /api/v1/social/leaderboard (nuevo)
NotificationCenter ── requiere ── GET/PATCH /api/v1/notifications (nuevo)

SubjectProgressRing ── reutiliza ── GET /api/v1/stats/dashboard (ya existe)
ExamPreview ─────── reutiliza ──── GET /api/v1/exams/{id} (ya existe)
SessionSummary ────── reutiliza ── datos del intento (ya existe)
```

---

*Archivo generado para guía de desarrollo. Actualizar columna "Estado" a medida que se implementan features.*
