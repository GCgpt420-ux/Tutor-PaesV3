# Estudio Integral y Consenso de Estado Actual

## Estado del documento
- Tipo: documento de sintesis ejecutiva y tecnica.
- Estado: vigente.
- Ultima revision: 2026-04-23.
- Objetivo: consolidar el contexto real del proyecto, cruzando documentacion, codigo, pruebas, CI y scripts operativos.

## Actualizacion de consenso (2026-04-23)
- Estado consolidado: post-MVP tecnico avanzado, con fases base completadas.
- Implementacion: alta en nucleo backend y alta en integraciones clave (IA y pagos/facturacion).
- Madurez global: medio-alta para piloto y escalamiento controlado; aun con brechas operativas para produccion de mayor exigencia.

## 1. Proposito
Este documento resume en un solo lugar:
- que es TutorPAES v2,
- que componentes existen realmente,
- que partes estan maduras,
- que partes siguen parciales,
- y en que punto de avance se encuentra el proyecto.

No reemplaza la documentacion canonica. La organiza y la contrasta con evidencia del repositorio.

## 2. Corpus documental recomendado

### 2.1 Documentos de contexto general
1. [README.md](../README.md)
2. [DOCS/ANALISIS_DETALLADO_PROYECTO.md](./ANALISIS_DETALLADO_PROYECTO.md)
3. [DOCS/ARQUITECTURA_Y_ROADMAP_PRODUCCION.md](./ARQUITECTURA_Y_ROADMAP_PRODUCCION.md)
4. [DOCS/ROADMAP_EJECUCION_V2.md](./ROADMAP_EJECUCION_V2.md)

### 2.2 Documentos operativos y de seguridad
1. [DOCS/PROCESOS_OPERATIVOS.md](./PROCESOS_OPERATIVOS.md)
2. [DOCS/BASES_SEGURIDAD.md](./BASES_SEGURIDAD.md)
3. [DOCS/BACKUP_Y_ROLLBACK.md](./BACKUP_Y_ROLLBACK.md)
4. [DOCS/CHECKLIST_DESPLIEGUE_PREPROD_PROD.md](./CHECKLIST_DESPLIEGUE_PREPROD_PROD.md)

### 2.3 Documentos de IA e integraciones
1. [OPENAI_INTEGRATION_COMPLETE.md](../docs/status/OPENAI_INTEGRATION_COMPLETE.md)
2. [OPENAI_VALIDATION_REPORT.md](../docs/status/OPENAI_VALIDATION_REPORT.md)
3. [DOCS/OPENAI_SETUP.md](./OPENAI_SETUP.md)
4. [DOCS/OPENAI_QUICK_START.md](./OPENAI_QUICK_START.md)

### 2.4 Documentos de onboarding y estructura
1. [DOCS/INDICE_MAESTRO_COLABORADORES.md](./INDICE_MAESTRO_COLABORADORES.md)
2. [DOCS/GUIA_COLABORADORES.md](./GUIA_COLABORADORES.md)
3. [DOCS/REFERENCIA_DE_ARCHIVOS.md](./REFERENCIA_DE_ARCHIVOS.md)
4. [DOCS/DIAGRAMA_BASE_DE_DATOS.md](./DIAGRAMA_BASE_DE_DATOS.md)

## 3. Vision consolidada del producto
TutorPAES v2 es una plataforma de preparacion PAES con arquitectura full-stack en monorepo. Su objetivo real ya no es solo validar una idea; el repositorio muestra una evolucion hacia una plataforma operable con:
- autenticacion JWT,
- catalogo academico,
- quiz por tema,
- explicaciones asistidas por IA con fallback,
- pagos por Transbank,
- progreso del usuario,
- pruebas backend,
- pipelines CI,
- y procesos de backup/rollback.

En otras palabras, el proyecto ya paso la etapa de maqueta. Esta en una etapa de consolidacion tecnica previa a endurecimiento final de produccion.

## 4. Evidencia tecnica del estado real

### 4.1 Backend
Evidencia base:
- [tutorpaes/backend/app/main.py](../tutorpaes/backend/app/main.py)
- [tutorpaes/backend/app/api/v1/endpoints/auth.py](../tutorpaes/backend/app/api/v1/endpoints/auth.py)
- [tutorpaes/backend/app/api/v1/endpoints/quiz.py](../tutorpaes/backend/app/api/v1/endpoints/quiz.py)
- [tutorpaes/backend/app/api/v1/endpoints/payments.py](../tutorpaes/backend/app/api/v1/endpoints/payments.py)
- [tutorpaes/backend/app/api/v1/endpoints/ai.py](../tutorpaes/backend/app/api/v1/endpoints/ai.py)

Estado observado:
- El backend registra routers de health, auth, ai, catalog, quiz, users, questions, payments y admin.
- Existe manejo global de errores, correlation IDs y rate limiting.
- Hay integracion base con Sentry y logging estructurado JSON.
- La configuracion critica falla rapido si faltan variables sensibles como `DATABASE_URL`, `SECRET_KEY` y `PAYMENT_RETURN_URL`.

Lectura de estado:
- Backend funcionalmente fuerte.
- Backend operativamente mejor que lo que suele tener un MVP.
- Aun no completamente endurecido para produccion plena.

### 4.2 IA
Evidencia base:
- [tutorpaes/backend/app/api/v1/endpoints/ai.py](../tutorpaes/backend/app/api/v1/endpoints/ai.py)
- [tutorpaes/backend/app/services/openai_service.py](../tutorpaes/backend/app/services/openai_service.py)
- [DOCS/OPENAI_SETUP.md](./OPENAI_SETUP.md)
- [OPENAI_VALIDATION_REPORT.md](../docs/status/OPENAI_VALIDATION_REPORT.md)

Estado observado:
- Existe endpoint `GET /api/v1/ai/health`.
- Existe endpoint autenticado `POST /api/v1/ai/explain`.
- El servicio OpenAI usa fallback cuando falta `OPENAI_API_KEY` o el proveedor falla.
- La IA esta integrada desde backend, no desde frontend, lo que respeta el modelo de seguridad esperado.

Lectura de estado:
- Integracion real y usable.
- Todavia dependiente de configuracion de entorno para entregar el valor completo del LLM.
- La experiencia sin clave valida sigue siendo aceptable, pero menos diferencial.

### 4.3 Pagos
Evidencia base:
- [tutorpaes/backend/app/api/v1/endpoints/payments.py](../tutorpaes/backend/app/api/v1/endpoints/payments.py)
- [tutorpaes/backend/app/services/transbank_service.py](../tutorpaes/backend/app/services/transbank_service.py)

Estado observado:
- Existe flujo de creacion y confirmacion de pago.
- La logica principal esta en backend.
- El proyecto aun opera con foco en entorno de integracion y no hay evidencia en este estudio de validacion final con credenciales productivas.

Lectura de estado:
- Pagos implementados a nivel de codigo.
- Falta validacion final de salida a produccion.

### 4.4 Frontend
Evidencia base:
- [tutorpaes/frontend/app/layout.tsx](../tutorpaes/frontend/app/layout.tsx)
- [tutorpaes/frontend/app/protected/progreso/page.tsx](../tutorpaes/frontend/app/protected/progreso/page.tsx)
- [tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.tsx](../tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.tsx)
- [tutorpaes/frontend/app/protected/ensayos/[exam_id]/resultados/page.tsx](../tutorpaes/frontend/app/protected/ensayos/[exam_id]/resultados/page.tsx)
- [tutorpaes/frontend/src/lib/api/client.ts](../tutorpaes/frontend/src/lib/api/client.ts)

Estado observado:
- Existen pantallas de landing, auth, pricing, dashboard protegido, perfil, admin, cursos, ensayos y quiz.
- El cliente API maneja sesion, refresh y errores.
- Hay validaciones de expiracion de JWT y endurecimiento de cabeceras en Next.js.
- La pagina de resultados de ensayos sigue marcada como pendiente de backend, aunque ya existen partes de analitica en backend.
- Existen modulos frontend con `TODO` y adaptadores aun no conectados completamente a endpoints reales.

Lectura de estado:
- Frontend utilizable y relativamente amplio.
- Frontend menos consolidado que backend.
- Hay deuda de integracion en ensayos/resultados y algunas APIs de apoyo.

### 4.5 Tests backend
Evidencia base:
- [tutorpaes/backend/tests/test_auth/test_login.py](../tutorpaes/backend/tests/test_auth/test_login.py)
- [tutorpaes/backend/tests/test_auth/test_refresh.py](../tutorpaes/backend/tests/test_auth/test_refresh.py)
- [tutorpaes/backend/tests/test_auth/test_password_policy.py](../tutorpaes/backend/tests/test_auth/test_password_policy.py)
- [tutorpaes/backend/tests/test_health/test_readiness.py](../tutorpaes/backend/tests/test_health/test_readiness.py)
- [tutorpaes/backend/tests/test_security/test_rate_limit.py](../tutorpaes/backend/tests/test_security/test_rate_limit.py)
- [tutorpaes/backend/tests/test_security/test_error_sanitization.py](../tutorpaes/backend/tests/test_security/test_error_sanitization.py)
- [tutorpaes/backend/tests/test_payments/test_states.py](../tutorpaes/backend/tests/test_payments/test_states.py)

Estado observado:
- Hay pruebas para auth, refresh token, politica de contraseñas, readiness, rate limiting, sanitizacion de errores, IDOR y pagos.
- La cobertura se concentra en backend.
- No se observa en este estudio una bateria equivalente de pruebas integrales del frontend.

Lectura de estado:
- El proyecto ya protege flujos sensibles.
- La capa de pruebas existe y aporta confianza.
- Falta mayor cobertura end-to-end o de integracion cruzada frontend-backend.

### 4.6 CI, seguridad y operacion
Evidencia base:
- [.github/workflows/backend-ci.yml](../.github/workflows/backend-ci.yml)
- [.github/workflows/frontend-ci.yml](../.github/workflows/frontend-ci.yml)
- [.github/workflows/security-ci.yml](../.github/workflows/security-ci.yml)
- [.github/workflows/db-backup.yml](../.github/workflows/db-backup.yml)
- [scripts/dev-up.sh](../scripts/dev-up.sh)
- [scripts/db-backup.sh](../scripts/db-backup.sh)
- [scripts/db-restore.sh](../scripts/db-restore.sh)
- [scripts/db-rollback.sh](../scripts/db-rollback.sh)

Estado observado:
- Hay pipeline backend con instalacion, auditoria de dependencias, compilacion e integracion de tests.
- Hay pipeline frontend con lint, typecheck, build y audit.
- Hay pipeline de seguridad con Semgrep, Gitleaks y Trivy FS.
- Hay workflow dedicado de backup de base de datos.
- El script `dev-up.sh` ya incluye logica para reconstruir el venv si esta incompleto.

Lectura de estado:
- La capa operativa esta bastante por encima de un proyecto experimental.
- Seguridad y operacion avanzaron de forma real durante marzo de 2026.
- Observabilidad y resiliencia aun no alcanzan el mismo nivel de madurez.

## 5. Brechas detectadas entre documentacion y codigo

### 5.1 Lo que si coincide
- La narrativa de arquitectura general coincide con el monorepo real.
- El roadmap operativo coincide con la introduccion reciente de seguridad en pipeline, Sentry base, correlation IDs y backup/rollback.
- La integracion OpenAI esta efectivamente implementada en backend con fallback.

### 5.2 Lo que esta parcial o desalineado
- El frontend ofrece paginas de recuperacion/cambio de password, pero no se identificaron endpoints backend equivalentes para forgot/reset password en este estudio.
- La pagina de resultados de ensayos permanece como placeholder visible.
- Parte de la narrativa de observabilidad mas avanzada sigue siendo aspiracional porque no hay Prometheus ni dashboards operativos en el repositorio.
- La integracion Transbank esta implementada, pero este estudio no confirma cierre productivo completo.

## 6. Consenso de estado actual

### 6.1 Punto del proyecto
Consenso propuesto:

TutorPAES v2 esta en una fase de **post-MVP tecnico con consolidacion preproduccion**.

Esto significa:
- ya tiene nucleo funcional real,
- ya tiene backend serio y operable,
- ya tiene medidas iniciales de seguridad y observabilidad,
- pero todavia conserva deuda funcional y operativa en frontend, resiliencia, metricas y cierre de algunos flujos.

### 6.2 Nivel de madurez por area
Estimacion razonable basada en evidencia del repo:

| Area | Estado estimado | Lectura breve |
|---|---:|---|
| Backend funcional | 75% | Solido en auth, quiz, catalogo, IA, pagos y administracion |
| Frontend funcional | 55% | Amplio en superficie, pero con huecos y placeholders |
| Integracion IA | 70% | Real, segura y con fallback, aun dependiente de configuracion completa |
| Seguridad aplicada | 70% | Mejoro claramente con rate limiting, sanitizacion, CI y hardening base |
| Observabilidad | 35% | Logging, request ID y Sentry base; sin metricas operativas completas |
| Resiliencia | 20% | Backup/rollback existe, pero faltan cache, circuit breaker y retries maduros |
| Preparacion productiva global | 60% | El proyecto puede demostrarse y evolucionar, pero aun no esta cerrado para escala ni operacion robusta |

### 6.3 Lo que ya esta resuelto
- Arquitectura full-stack definida.
- Base de datos y migraciones en uso.
- Flujo principal de autenticacion y sesion.
- Flujo principal de quiz.
- Integracion de IA desde backend.
- Integracion de pagos a nivel de codigo.
- Pipelines CI para backend, frontend y seguridad.
- Automatizacion de backup/rollback.

### 6.4 Lo que todavia te frena
- Falta completar ciertos flujos frontend-backend.
- Falta convertir ensayos/resultados en una experiencia cerrada y coherente.
- Falta observabilidad de nivel operativo real.
- Falta resiliencia ante fallas externas y carga.
- Falta cerrar algunos puntos de validacion productiva en pagos e integraciones.

## 7. En que punto estas hoy
La foto mas precisa es esta:

No estas construyendo una idea desde cero. Estas cerrando la brecha entre un producto tecnicamente funcional y una plataforma realmente lista para operacion confiable.

Tu punto actual no es "MVP temprano". Tampoco es "produccion madura". Estas en el tramo intermedio mas importante:

**estabilizacion, endurecimiento y cierre de brechas de integracion**.

## 8. Prioridades recomendadas para la siguiente etapa
1. Cerrar el flujo de resultados/ensayos en frontend usando las estadisticas reales del backend.
2. Definir e implementar password reset completo o eliminar temporalmente la superficie frontend incompleta.
3. Completar Fase 3 de observabilidad con metricas y dashboards minimos.
4. Ejecutar pruebas integrales de pagos e IA en entorno cercano a produccion.
5. Entrar a Fase 4 de resiliencia con cache, retry y proteccion de dependencias externas.

## 9. Conclusiones ejecutivas
1. El proyecto tiene suficiente densidad tecnica y documental para producir un estudio serio.
2. El backend es hoy el activo mas maduro del sistema.
3. El frontend requiere cierre de integraciones para igualar la madurez del backend.
4. Marzo de 2026 muestra un salto real en seguridad operativa y capacidad de mantenimiento.
5. El consenso mas defendible es que TutorPAES v2 se encuentra en fase de consolidacion preproduccion, no en etapa conceptual.