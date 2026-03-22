# Contraste Walkthrough vs Estado Real (2026-03-16)

## Resumen Ejecutivo

El walkthrough sigue siendo correcto en direccion, pero este documento ahora se expresa como auditoria verificable para distinguir claramente:
1. Lo validado en codigo/ejecucion.
2. Lo parcialmente validado.
3. Lo no verificable en este entorno.

Estado global actual:
1. Frontend: estable a nivel estatico y de build.
2. Contratos backend/frontend: significativamente mas alineados que en la version previa.
3. Riesgo principal remanente: evidencia automatizada backend incompleta en este entorno local (pytest no disponible).

## Metodologia de contraste

Se contrastaron afirmaciones del walkthrough con evidencia en:
1. Endpoints backend (quiz, ai, catalog, auth).
2. Capa frontend de consumo (`features/*/api` y `src/lib/api/*`).
3. Verificaciones ejecutadas localmente:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run test -- --runInBand`

## Matriz de validacion

| Afirmacion | Evidencia | Estado | Riesgo |
|---|---|---|---|
| Hay endpoint de resultados por intento | `GET /api/v1/quiz/attempts/{attempt_id}/results` en `backend/app/api/v1/endpoints/quiz.py` | Validado | Bajo |
| SSE del Tutor IA funciona por `text/event-stream` | `StreamingResponse(..., media_type="text/event-stream")` en `backend/app/api/v1/endpoints/ai.py` | Validado | Bajo |
| Frontend consume APIs via `apiFetch` y sin doble prefijo legacy | `frontend/src/lib/api/client.ts` + rutas en `frontend/src/features/*/api/*.ts` | Validado | Bajo |
| Contrato de catalogo para `topic by id` y `exam questions` esta cubierto | `backend/app/api/v1/endpoints/catalog.py` y uso en `frontend/src/features/{courses,exams}/api` | Validado | Bajo |
| Render de explicaciones IA soporta Markdown + LaTeX | `frontend/src/features/exams/components/exam-results-view.tsx` usa renderer de markdown/math | Validado | Bajo |
| Quality gate frontend esta verde | `lint`, `typecheck`, `build` y `test` ejecutados exitosamente | Validado | Bajo |
| Recuperacion de password E2E quedo operativa | `/forgot-password` y `/reset-password` en backend + formulario frontend con token | Validado (flujo tecnico) | Medio (email real aun simulado) |
| Eliminacion de wrapper legacy de auth | `frontend/src/lib/api/auth.ts` no existe en estructura actual | Validado | Bajo |
| Backend tests 21/21 siguen verdes | No verificable aqui: `pytest` no esta instalado en el entorno actual | No verificable | Medio |

## Cambios relevantes respecto a la version anterior de este contraste

1. Se elimina el gap previo de "endpoints no existentes" para:
  - `getExamQuestions(examId)`
  - `getTopicById(topicId)`
  Ambos contratos hoy existen y se consumen desde frontend.
2. El bloqueo SSR por `useSearchParams` en update-password queda corregido mediante `Suspense` en la pagina de auth.
3. El estado de frontend pasa de "apto para lint/typecheck" a "apto para build de produccion" en este entorno.

## Gaps vigentes

1. Evidencia backend automatizada incompleta en esta ejecucion:
  - No fue posible ejecutar `pytest` por ausencia del comando en el entorno.
2. Recuperacion de password con email comercial:
  - El flujo existe tecnicamente, pero el envio real sigue marcado para integracion comercial (SendGrid/Mailgun).

## Conclusiones

1. El walkthrough esta mayormente alineado con el estado real del repositorio.
2. El frontend queda validado de forma robusta para despliegue tecnico (build incluido).
3. El contrato backend/frontend en catalogo y resultados esta cerrado en los puntos que antes estaban desalineados.
4. El unico punto de confianza parcial en esta auditoria es la falta de corrida `pytest` dentro de este entorno especifico.

## Siguiente paso recomendado

1. Ejecutar backend tests en un entorno con `pytest` disponible para cerrar evidencia de regresion end-to-end.
2. Conectar proveedor de correo transaccional para completar el circuito comercial de recuperacion de password.
