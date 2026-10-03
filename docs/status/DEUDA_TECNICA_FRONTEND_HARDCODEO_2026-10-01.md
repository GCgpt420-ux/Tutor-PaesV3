# Deuda técnica y hardcodeo — Frontend (sprint piloto 2026-10-03)

Levantado durante el sprint final de GenUI/debrief (Tareas B1-B4, worktree `sprint-frontend`).
Solo documenta — no se tocó el sistema de tokens ni se eliminó código en este pase.

## 1. Dos sistemas de tokens de Tailwind en paralelo

`tailwind.config.ts` define dos familias de color:

- **Semántica activa** (`brand-*`, `surface-*`, `text-*`): basada en variables CSS de `globals.css`
  (`withOpacity('--color-brand-primary')`, etc.). Es la que usa el 100% de los componentes vivos
  (`AiTutorChat`, `exam-results-view`, la página de quiz, etc.).
- **Legacy `paes-*`** (`paes-dark`, `paes-darker`, `paes-card`, `paes-border`, `paes-text`,
  `paes-text-secondary`, `paes-emerald`, `paes-blue`): colores hex literales. Referenciados solo en
  `src/styles/design-system.css`, que a su vez **no se importa en ningún lugar** (`app/`, `src/`).
  Es decir: los tokens `paes-*` y su hoja de estilos son código muerto. Candidato a eliminar en una
  limpieza futura (fuera de alcance de este sprint, solo se documenta).

## 2. Componentes fantasma / duplicados

- `src/features/exams/components/question-card.tsx` + `AiExplanation.tsx`: implementan una tarjeta
  de pregunta con opciones, explicación estática y botón "Consultar al Tutor IA" vía
  `useAiExplanation` (endpoint `/api/ai/explain`, one-shot, no conversacional). **No están importados
  en ninguna ruta** (`app/`) — verificado con grep, solo los referencia su propio test. Es decir, es
  un flujo de feedback de pregunta completo pero inalcanzable para el usuario real.
- El flujo de pregunta que SÍ es real (`app/protected/quiz/[subject_code]/[topic_code]/page.tsx`)
  define su **propio** componente `QuestionCard` local (líneas ~56-105 del archivo), distinto y más
  simple que el de `features/exams/components/question-card.tsx`. Hay dos "QuestionCard" con el mismo
  nombre, uno vivo (inline, sin opciones tipadas por letra) y otro muerto (con opciones A/B/C/D,
  shuffle, dificultad).
- Consecuencia práctica para este sprint: la Tarea B1 ("Preguntar a la Tuto sobre esto") no se pudo
  anclar en `AiExplanation.tsx` porque ese componente no es alcanzable. Se implementó en su lugar en
  `exam-results-view.tsx` (usado por `/protected/resultados` y
  `/protected/ensayos/[exam_id]/resultados`), que es el debrief real post-intento.
- Recomendación: decidir si `question-card.tsx`/`AiExplanation.tsx` se conecta a una ruta real o se
  elimina antes del piloto, para no mantener dos implementaciones del mismo concepto.

## 3. Puntaje PAES: no hay fórmula oficial DEMRE en el repo

- El backend (`quiz.py`, 3 ocurrencias) calcula `score_paes = int((correct/total) * 1000)` — lineal,
  0-1000, sin piso en 100 ni curva IRT. No es la fórmula oficial DEMRE (que usa IRT/TRI calibrado por
  administración, no un porcentaje lineal).
- En `exam-results-view.tsx` el puntaje se **clampea visualmente** a `[100, 1000]`
  (`clampToPaesScale`) y se etiqueta explícitamente como "Puntaje PAES **estimado**" — nunca como
  oficial, siguiendo el posicionamiento ya declarado en
  `docs/contexto_agentes/01_vision_y_objetivos.md` ("no reemplaza la plataforma oficial del DEMRE").
- El marcador de "punto medio" de la barra de contexto (`PAES_SCALE_MIDPOINT = 550`) es una
  aproximación visual del centro de la escala, **no** un promedio nacional real (no hay esa cifra en
  el repo). Está rotulado como "punto medio de la escala", no como "promedio nacional", para no
  afirmar una estadística que no podemos verificar.
- Pendiente real: si el profesor/DEMRE entrega una tabla de conversión real, hay que moverla al
  backend (`quiz.py`) y el frontend solo necesitará ajustar el label, no la lógica de clamp.

## 4. Campos faltantes en tipos TS vs. API real

- `UserProfile` (`src/features/profile/hooks/use-profile.ts`) no declaraba `target_score`, aunque
  `/auth/me` ya lo devuelve (`auth.py`, `User.target_score` en `db/models.py`). Se agregó el campo
  (opcional) en este sprint para poder mostrar la meta del alumno en la barra de contexto de
  `exam-results-view.tsx`.
- `AttemptResultOut` / `AttemptFeedbackDetailOut` (backend, `schemas/quiz.py`) no incluyen `topic_id`
  por pregunta — solo hay un `topic_id` a nivel de intento completo (nullable, para ensayos
  multi-tema). Por eso **no se implementó** el "Desglose por eje/tópico" de la Tarea B2: no hay datos
  para agruparlo de forma honesta. Si se necesita, requiere un cambio de schema en el backend.

## 5. Hardcodeo puntual encontrado (no bloqueante, no tocado)

- `question-card.tsx`: `attemptId = 'test-attempt-id'` como default del prop — string de prueba
  filtrado a un componente que además está muerto (ver punto 2).
- `question-card.tsx`: `difficultyColors` asume literalmente `'facil' | 'medio' | 'dificil'` en
  español sin acento ni enum — si el backend cambia esas claves, el fallback silencioso es `medio`.
- `app/protected/quiz/[subject_code]/[topic_code]/page.tsx`: `useState(15)` como `totalQuestions`
  inicial hardcodeado, antes de que llegue la respuesta real de `next-question`.

## 6. No se tocó en este sprint

- El sistema de tokens `paes-*` / `design-system.css` (solo documentado, ver punto 1).
- `question-card.tsx` / `AiExplanation.tsx` (solo documentado, ver punto 2) — se dejaron intactos por
  si otro agente/sesión los está usando como base de otro flujo.
