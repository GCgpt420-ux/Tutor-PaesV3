# Investigacion Estrategica Extensa - TutorPAES

Fecha de corte: 2026-05-04
Alcance: estado actual integral del proyecto, escenarios posibles, riesgos, oportunidades y plan de ejecucion desde ahora en adelante.

## 1) Resumen ejecutivo

TutorPAES ya supero la etapa de MVP tecnico. El sistema presenta una base funcional completa en autenticacion, catalogo, quiz, tutor IA, pagos y facturacion. La madurez actual se puede clasificar como:

- Producto: medio-alto (flujo principal operativo).
- Tecnologia: alto en backend y medio-alto en frontend.
- Operacion: medio (faltan automatizaciones de CI/CD y observabilidad avanzada).
- Go-to-market: medio-bajo (todavia falta consolidar propuesta de valor diferenciada y conversion).

Conclusion principal:

- El proyecto no necesita una reescritura.
- El proyecto necesita una etapa de consolidacion y escalamiento controlado.
- El principal cuello de botella no es la falta de features, sino la falta de sistema de ejecucion continua (calidad, medicion y aprendizaje de negocio).

## 2) Evidencia usada para esta investigacion

Fuentes revisadas en el repositorio:

- README.md
- docs/status/PROJECT_STATUS_REPORT.md
- docs/status/PROGRESS_TRACKING.md
- docs/status/BILLING_INTEGRATION.md
- docs/status/OPENAI_VALIDATION_REPORT.md
- docs/status/LLM_PROVIDERS_SETUP.md
- tutorpaes/backend/railway.json
- tutorpaes/backend/app/core/config.py
- tutorpaes/backend/docker-compose.yml
- tutorpaes/frontend/package.json
- tutorpaes/frontend/proxy.ts
- Estado de cambios git sin commit en backend/frontend (chat contextual y mejora de profesor IA)

## 3) Estado real actual del sistema

### 3.1 Arquitectura y stack

Backend:

- FastAPI + Python 3.12
- SQLAlchemy + Alembic + PostgreSQL
- Multi LLM provider: OpenAI, Groq, Cerebras
- Integracion de pagos con Transbank
- Soporte de voz (STT/TTS)

Frontend:

- Next.js 15 + React 19 + TypeScript
- Tailwind + componentes modulares
- React Query para estado servidor
- Middleware/proxy con CSP y control de sesion

Infra:

- Railway para backend
- Vercel para frontend
- Salud API con healthcheck configurado
- Migraciones aplicadas en despliegue por preDeployCommand

### 3.2 Funcionalidades ya operativas

- Login y gestion de sesion
- Catalogo PAES
- Motor de quiz
- Resultados y progreso
- Tutor IA conversacional
- Flujo de pagos
- Emision logica de invoice
- Historial de billing
- Integracion de imagenes en quiz
- Voz en tutor IA

### 3.3 Cambios recientes en curso (sin commit)

Hay cambios importantes ya implementados localmente que impactan directamente la calidad del tutor IA:

- Se agrego contexto de pregunta al chat IA desde quiz.
- Se paso historial de conversacion y contexto de ejercicio al proveedor LLM.
- Se actualizo el prompt pedagogico a una version mas educativa y menos generica.
- Se mejoro UI del chat con identidad de profesor IA (Tuto).
- Se agrego test especifico para flujo de contexto conversacional.

Implicacion:

- El producto ya tiene una mejora real en inteligencia percibida del tutor.
- Falta cerrar ciclo operacional: commit, verificacion integral y despliegue controlado.

## 4) Diagnostico estrategico: donde esta fuerte y donde esta debil

### 4.1 Fortalezas

- Base full-stack integrada y coherente.
- Capacidad de fallback en IA (resiliencia funcional).
- Modelo de negocio conectado a pagos/facturacion.
- Evidencia de disciplina tecnica (tests y fases documentadas).
- Capacidad de personalizacion academica del tutor.

### 4.2 Debilidades

- Aun hay deuda de operacion continua:
- CI unificada pendiente.
- Smoke tests preproduccion pendientes.
- Observabilidad y alertas por endurecer.
- Parte de facturacion PDF aun con enfoque placeholder segun documentacion.
- Experiencia frontend percibida como poco distintiva (problema de experiencia, no de tecnologia).

### 4.3 Riesgo estructural principal

El mayor riesgo no es tecnico puntual: es de ejecucion estrategica.

Si se siguen agregando features sin sistema de medicion y release controlado:

- Subira complejidad.
- Bajara velocidad real.
- Se diluira la propuesta de valor.

## 5) Escenarios del proyecto a partir de hoy

## 5.1 Escenario A - Escalamiento saludable (objetivo)

Condiciones:

- Se consolida CI/CD minima.
- Se prioriza calidad y producto antes que nuevas features grandes.
- Se miden KPIs de aprendizaje y conversion semanalmente.

Resultado esperado en 8-12 semanas:

- Menos regresiones.
- Mejor satisfaccion del alumno.
- Mayor retencion y conversion a pago.
- Mayor confianza para pilotos institucionales.

Probabilidad actual: media-alta, si se ejecuta con foco.

## 5.2 Escenario B - Estancamiento por disperso de foco

Condiciones:

- Se lanzan muchas mejoras visuales sin instrumentacion.
- No se cierra pipeline de calidad.
- No se define un north star metric.

Resultado:

- Sensacion de avance, pero bajo impacto real.
- Errores intermitentes en produccion.
- Dificultad para demostrar valor ante aliados/financiamiento.

Probabilidad actual: media.

## 5.3 Escenario C - Escala rapida sin hardening

Condiciones:

- Aumenta trafico rapidamente (campanas, prensa, semilleros).
- Infra y observabilidad no endurecidas.

Resultado:

- Saturacion en endpoints IA/voz.
- Costos inesperados de LLM.
- Caidas parciales y mala experiencia en horas peak.

Probabilidad actual: media-baja hoy, alta si hay crecimiento brusco sin preparacion.

## 5.4 Escenario D - Plataforma robusta para institucionalizacion

Condiciones:

- Se cierra deuda operativa + seguridad + contratos API.
- Se implementa estrategia de contenido y aprendizaje adaptativo medible.
- Se construye capa B2B (reportes para docentes/colegios).

Resultado:

- Plataforma apta para convenios formales.
- Mayor ticket promedio por cliente institucional.
- Mejor posicion para fondos y aliados.

Probabilidad actual: media en horizonte 3-6 meses.

## 6) Mapa de riesgos por dominio

### 6.1 Riesgos tecnicos

Riesgo: regresiones por cambios simultaneos backend/frontend.

- Impacto: alto
- Probabilidad: media
- Mitigacion: CI unificada + smoke tests de flujo critico antes de deploy.

Riesgo: inconsistencias de contrato en payload chat/contexto.

- Impacto: medio-alto
- Probabilidad: media
- Mitigacion: tests de contrato + validacion estricta de schemas en endpoint.

Riesgo: dependencia variable de proveedor IA (cuota/latencia/disponibilidad).

- Impacto: alto
- Probabilidad: media
- Mitigacion: enrutamiento dinamico por SLA/costo + fallback con trazabilidad.

### 6.2 Riesgos de producto

Riesgo: UX correcta pero no diferenciada.

- Impacto: alto en conversion
- Probabilidad: alta
- Mitigacion: estrategia UX educativa con narrativa de aprendizaje y feedback accionable.

Riesgo: tutor IA percibido como "generico" en algunos casos.

- Impacto: alto
- Probabilidad: media
- Mitigacion: refuerzo de prompts por materia y evaluacion sistematica de calidad de respuesta.

### 6.3 Riesgos de negocio

Riesgo: costos LLM crecen mas rapido que ingresos.

- Impacto: alto
- Probabilidad: media
- Mitigacion: presupuesto por usuario, rate limits por plan, modelos por tier.

Riesgo: embudo de pago con fricciones en estados borde.

- Impacto: medio-alto
- Probabilidad: media
- Mitigacion: UX de retries, mensajes de estado claros, trazabilidad de pagos.

### 6.4 Riesgos de seguridad y compliance

Riesgo: manejo de secretos disperso en entornos.

- Impacto: muy alto
- Probabilidad: media
- Mitigacion: politica de rotacion y secret manager por ambiente.

Riesgo: trazabilidad insuficiente para auditoria institucional.

- Impacto: alto
- Probabilidad: media
- Mitigacion: bitacora de eventos de auth/pago/administracion.

## 7) Oportunidades de mayor retorno (ROI)

Oportunidad 1: cerrar operacion continua (CI + smoke + alertas).

- Retorno: reduce regresiones y costos de soporte.
- Tiempo estimado: corto (1-2 semanas).

Oportunidad 2: mejorar percepcion de valor educativo del tutor IA.

- Retorno: sube retencion y recomendacion.
- Tiempo estimado: corto-medio (1-3 semanas).

Oportunidad 3: tablero de progreso orientado a accion (no solo metricas).

- Retorno: mejora adherencia al estudio.
- Tiempo estimado: medio (2-4 semanas).

Oportunidad 4: robustecer capa de billing para operacion real.

- Retorno: menos friccion post-pago y mayor confianza.
- Tiempo estimado: medio (2-4 semanas).

## 8) Modelo de priorizacion desde ahora (simple y ejecutable)

Usar 4 criterios por iniciativa:

- Impacto en aprendizaje del estudiante
- Impacto en conversion/retencion
- Reduccion de riesgo operativo
- Esfuerzo tecnico

Regla de priorizacion:

- Primero todo lo que sea alto impacto + bajo/medio esfuerzo + reduce riesgo.

## 9) Plan recomendado por horizontes

## 9.1 Horizonte 0-14 dias (estabilizacion inteligente)

Objetivo: cerrar deuda inmediata y asegurar una base operable.

Acciones:

- Commit y despliegue controlado de cambios recientes de chat contextual + prompt.
- Correr verificacion completa backend/frontend antes de merge.
- Definir pipeline CI minima:
- backend pytest
- frontend test
- frontend lint/typecheck
- Crear smoke test automatizado de 5 flujos:
- login
- abrir quiz
- responder pregunta
- conversar con tutor IA
- iniciar flujo de pago
- Instrumentar eventos basicos de producto:
- chat_started
- question_answered
- hint_requested
- payment_started
- payment_confirmed

Entregables concretos:

- Pipeline verde en cada push.
- Script smoke ejecutable en predeploy.
- Dashboard simple de errores y uptime.

## 9.2 Horizonte 15-45 dias (diferenciacion educativa)

Objetivo: transformar experiencia de "correcta" a "excelente".

Acciones:

- Rediseno educativo del dashboard:
- foco diario recomendado
- brechas prioritarias
- progreso por objetivo
- Flujo quiz por fases:
- lectura
- respuesta
- analisis
- Rubricas de calidad del profesor IA por materia.
- A/B test de mensajes y estructura de feedback.

Entregables:

- Incremento medible en sesiones por usuario por semana.
- Mayor tasa de finalizacion de quiz.

## 9.3 Horizonte 45-90 dias (escalado y posicionamiento)

Objetivo: preparar base para crecimiento institucional y comercial.

Acciones:

- Contratos API y versionado formal.
- Hardening de seguridad y auditoria.
- Cost governance de IA por plan.
- Modulo inicial para stakeholders institucionales (reportes agregados).

Entregables:

- Evidencia de fiabilidad para alianzas.
- Narrativa clara para postulaciones y fondos.

## 10) Roadmap tecnico detallado por frente

### 10.1 Backend

Prioridad alta:

- Validacion estricta de payload chat/contexto con modelos Pydantic.
- Tests de contrato para endpoint de chat.
- Politica de fallback y timeouts por proveedor IA.

Prioridad media:

- Capa de cache para consultas repetitivas de catalogo.
- Mejoras de observabilidad por endpoint critico.

### 10.2 Frontend

Prioridad alta:

- UX educativa orientada a accion.
- Menos ruido visual, mas claridad de aprendizaje.
- Mensajeria contextual en resultados y tutor.

Prioridad media:

- Estados vacios y errores de pago mas robustos.
- Consistencia tipografica y tokens visuales.

### 10.3 QA y confiabilidad

Prioridad alta:

- CI obligatoria para merge.
- Smoke test preproduccion.
- Politica de rollback validada.

Prioridad media:

- Pruebas de carga en endpoint IA y quiz.
- Pruebas de caos livianas (fallo proveedor IA, retry de pago).

### 10.4 Data y analitica

Prioridad alta:

- Definir eventos minimos de funnel.
- Definir north star metric.

Prioridad media:

- Cohortes de retencion por semana.
- Segmentacion por materia y dificultad.

## 11) North Star y KPIs recomendados

North Star Metric propuesta:

- Estudiantes que completan al menos 3 sesiones de estudio efectivas por semana.

KPIs operativos:

- Availability API (% uptime)
- Error rate en chat endpoint
- P95 latencia chat
- Tasa de fallback IA
- Tasa de finalizacion quiz
- Retencion semana 1 y semana 4
- Conversion free a pago
- CAC/LTV inicial (si hay pauta)

KPIs pedagogicos:

- Mejora promedio de precision por tema (7 y 30 dias)
- Tiempo medio hasta dominar un objetivo
- Reincidencia de error por tipo de habilidad

## 12) Estrategia de IA: calidad, costo y resiliencia

### 12.1 Calidad

- Estandarizar prompts por materia y objetivo.
- Evaluacion semanal con set de casos canonicos.
- Score de calidad: claridad, correccion, utilidad, accionabilidad.

### 12.2 Costo

- Presupuestos mensuales por ambiente.
- Limites por usuario/plan para features costosas.
- Routing inteligente por tarea:
- consultas simples a modelo mas economico
- analisis complejos a modelo premium

### 12.3 Resiliencia

- Fallback automatico con politicas claras.
- Mensajes de degradacion transparentes al usuario.
- Alertas cuando fallback supere umbral.

## 13) Estrategia de producto y experiencia educativa

### 13.1 Principios de UX educativa

- Claridad primero.
- Feedback especifico, no generico.
- Progreso visible y accionable.
- Friccion minima en habito diario.

### 13.2 Recomendaciones de interfaz

- Dashboard con "que estudiar hoy".
- Indicador de brechas prioritarias por materia.
- Resultados con explicacion de siguiente paso.
- Tutor IA como mentor contextual, no chat aislado.

### 13.3 Recomendaciones de contenido

- Banco de ejercicios por competencias PAES.
- Metadatos de dificultad y habilidad evaluada.
- Ruta de aprendizaje por objetivos desbloqueables.

## 14) Gobernanza operativa minima (indispensable)

Cadencia semanal sugerida:

- Reunion 1: salud tecnica (errores, uptime, deuda)
- Reunion 2: salud de producto (retencion, finalizacion, conversion)
- Reunion 3: decisiones de roadmap (solo con datos)

Definir 3 roles operativos claros (aunque una persona cubra varios):

- Owner de producto
- Owner tecnico
- Owner de crecimiento/negocio

Sin esta gobernanza, el proyecto seguira avanzado tecnicamente pero con bajo impacto acumulado.

## 15) Plan de mitigacion para 10 escenarios criticos

Escenario 1: proveedor IA principal caido.

- Respuesta: fallback inmediato + notificacion interna + degradacion controlada.

Escenario 2: aumento brusco de latencia IA.

- Respuesta: timeout adaptativo + modelo alterno + cola de solicitudes.

Escenario 3: pago autorizado pero invoice no generado.

- Respuesta: job de reconciliacion nocturna + endpoint de reparacion manual.

Escenario 4: deploy rompe quiz en produccion.

- Respuesta: smoke predeploy obligatorio + rollback en menos de 10 min.

Escenario 5: error de CORS en dominio productivo.

- Respuesta: checklist de dominios y test de humo post-config.

Escenario 6: fuga de secreto.

- Respuesta: rotacion inmediata, invalidez de claves, postmortem y control preventivo.

Escenario 7: crecimiento de costos IA no previsto.

- Respuesta: cuotas por plan, caching de respuestas recurrentes, analitica de consumo.

Escenario 8: baja retencion pese a estabilidad tecnica.

- Respuesta: rediseno de loop de habito diario y experimentacion UX educativa.

Escenario 9: regresiones silenciosas por cambios de prompt.

- Respuesta: suite de evaluacion de prompts versionada.

Escenario 10: necesidad de presentar traccion a fondos/aliados.

- Respuesta: tablero ejecutivo mensual con KPIs tecnicos, pedagogicos y comerciales.

## 16) Backlog priorizado inmediato (accionable esta semana)

Prioridad P0:

- Cerrar y desplegar cambios recientes de chat contextual y Tuto.
- CI minima obligatoria.
- Smoke preproduccion automatizado.

Prioridad P1:

- Instrumentar eventos clave de funnel.
- Dashboard educativo "foco de hoy".
- Validacion de contratos chat payload.

Prioridad P2:

- Hardening observabilidad.
- Mejora de billing en estados borde.
- Pruebas de carga iniciales.

## 17) Checklist de salida para pasar a etapa de crecimiento

El proyecto se considera listo para etapa de crecimiento cuando se cumpla:

- Todos los merges pasan CI.
- Smoke test pasa antes de cada deploy.
- Error budget semanal definido y monitoreado.
- KPI north star medido semanalmente.
- Flujo IA-quiz demuestra mejora en retencion.
- Facturacion y pagos sin incidentes recurrentes.

## 18) Conclusion final

TutorPAES esta en un punto estrategico muy favorable: la base tecnica ya existe y funciona. El siguiente salto no depende de agregar muchas funciones nuevas, sino de ejecutar con disciplina tres pilares al mismo tiempo:

- Confiabilidad operativa
- Diferenciacion educativa real
- Medicion de impacto en negocio y aprendizaje

Si se ejecuta este plan por fases en 90 dias, el proyecto puede pasar de "producto funcional" a "plataforma confiable y diferenciada", lista para escalar usuarios y conversaciones institucionales con evidencia robusta.

---

## Anexo A - Comandos de verificacion sugeridos

Backend:

- cd tutorpaes/backend
- source venv/bin/activate
- python3 -m pytest -q

Frontend:

- cd tutorpaes/frontend
- npm test -- --runInBand
- npm run lint
- npm run typecheck

Deploy sanity:

- Verificar /api/v1/health y /api/v1/health/readiness
- Verificar login frontend
- Verificar quiz + chat
- Verificar inicio de pago

## Anexo B - Decision log recomendado

Mantener un registro semanal con:

- Decision
- Motivo
- Riesgo aceptado
- KPI que valida la decision
- Fecha de reevaluacion

Este log evitara cambios impulsivos y permitira aprender de forma acumulativa.
