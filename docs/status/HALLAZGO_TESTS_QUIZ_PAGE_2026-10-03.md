# Hallazgo: 3 tests de race-condition fallando en la página de quiz

**Fecha:** 2026-10-03 · **Worktree:** sprint-frontend · **Piloto:** aplazado a lunes.

Al verificar la suite completa durante la Tarea 2A se encontró que
`app/protected/quiz/[subject_code]/[topic_code]/page.test.tsx` (agregado hace
tiempo en `b3c419c`) tenía 4 tests fallando. No se originan en el trabajo de
este sprint — ya fallaban tras el commit `5f52095` ("fix(quiz, voice, catalog):
...") que llegó por el fast-forward de `main`.

## Lo que sí se corrigió (bajo riesgo, ya commiteado en `2f9dbbd`)
La suite entera fallaba con un `SyntaxError` de ESM porque `page.tsx` ahora
importa `MarkdownMathRenderer` directamente (antes no lo hacía) y el test no
lo mockeaba. Se agregó el mock estándar ya usado en el resto del proyecto.
Esto no cambia comportamiento, solo deja la suite corriendo.

## Lo que queda sin investigar (pendiente, no bloqueante)
Con la suite corriendo, 4 tests fallan:

1. `exposes progress, selection state, and mobile sizing` — espera la clase
   `pb-40` en el `<main>`, que ya no existe (el layout de padding cambió en
   `5f52095`). **Esto es solo un test desactualizado**, no un bug.
2. `ignores an older question response that resolves after the current request`
3. `aborts a pending question request when the page unmounts`
4. `keeps the current hint active when a stale StrictMode request resolves with the same id`

Los tests 2-4 verifican que `loadNextQuestion`/`ai/hint` cancelen correctamente
peticiones obsoletas con `AbortController` al cambiar de pregunta o desmontar.
Uno de ellos (`aborts a pending...`) muestra la página congelada en el loader
(`quiz.loading && !quiz.question` nunca se resuelve en el mock), y espera que
`apiFetch` reciba un `AbortSignal` real donde recibe `undefined`.

**No se determinó** si esto refleja un bug real de condición de carrera
introducido en `5f52095`, o si los tests simplemente quedaron desalineados
con un cambio de orden/temporización legítimo en esa misma lógica. Requiere
revisar `5f52095` en detalle o hacer una verificación manual en navegador del
flujo "cambiar de pregunta rápido" / "salir de la página mientras carga".

**Recomendación:** verificar manualmente en el navegador antes del piloto del
lunes: cambiar de pregunta varias veces rápido y confirmar que la pista del
tutor y la siguiente pregunta no se mezclan ni quedan pistas de la pregunta
anterior colgando.
