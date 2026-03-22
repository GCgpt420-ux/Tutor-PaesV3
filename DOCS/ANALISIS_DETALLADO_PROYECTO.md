# Analisis Detallado del Proyecto TutorPAES

## 1. Objetivo del documento
Este documento describe el estado tecnico actual del proyecto, su arquitectura, flujos principales, riesgos y lineas de trabajo recomendadas para facilitar colaboracion y mantenimiento.

## 2. Contexto funcional
TutorPAES es una plataforma de preparacion academica con:
- Frontend web en Next.js para autenticacion, progreso, quizzes y experiencia de usuario.
- Backend en FastAPI para logica de negocio, autenticacion, catalogo, quiz, pagos y servicios IA.
- Persistencia en PostgreSQL con SQLAlchemy y migraciones Alembic.

## 3. Arquitectura general
### 3.1 Frontend
- Framework: Next.js App Router.
- Rutas principales:
  - `app/auth/*`
  - `app/protected/*`
  - `app/api/*` como capa proxy hacia backend.
- Capa de cliente API:
  - `src/lib/api/client.ts` centraliza requests y manejo de token.

### 3.2 Backend
- Framework: FastAPI.
- Endpoints principales:
  - `api/v1/auth`
  - `api/v1/quiz`
  - `api/v1/users`
  - `api/v1/payments`
  - `api/v1/ai`
- Capa de servicios:
  - `services/openai_service.py`
  - `services/transbank_service.py`
- Configuracion central:
  - `core/config.py`

### 3.3 Datos
- Base principal: PostgreSQL.
- ORM: SQLAlchemy 2.x.
- Migraciones: Alembic.
- Entidades principales: usuarios, intentos, feedback, pagos, progreso.

## 4. Flujos de negocio principales
### 4.1 Autenticacion
1. Usuario envia credenciales desde frontend.
2. Backend valida usuario y password.
3. Backend retorna JWT.
4. Frontend guarda `access_token` en cookie.
5. Rutas protegidas validan presencia y expiracion del token.

### 4.2 Quiz
1. Frontend solicita pregunta por materia/tema.
2. Usuario responde.
3. Backend registra intento y respuesta.
4. Backend calcula si es correcta y genera feedback.
5. Frontend renderiza resultado y seguimiento del intento.

### 4.3 Pagos
1. Frontend solicita crear orden (`/api/payments/create`).
2. Backend crea orden en Transbank y guarda `payment` pendiente.
3. Usuario completa flujo en Webpay.
4. Backend confirma pago y activa entitlement.

### 4.4 IA
1. Frontend consulta endpoint proxy `app/api/ai/explain`.
2. Backend procesa prompt y selecciona logica (LLM o fallback).
3. Backend retorna explicacion final al cliente.

## 5. Estado de calidad tecnica
### 5.1 Fortalezas
- Separacion clara frontend/backend.
- Endpoints de dominio identificables.
- Migraciones y modelos estructurados.
- Validacion de token en proxy y cliente.

### 5.2 Riesgos abiertos
- Falta de estandar completo de comentarios y convenciones por modulo.
- Deuda documental historica con informacion redundante en algunos MD.
- Requiere endurecimiento adicional de seguridad para produccion (rate limiting, rotation de secretos, monitoreo).

## 6. Criterios de limpieza aplicados
- Eliminacion de emojis en codigo y documentacion versionada.
- Homogeneizacion de comentarios clave al espanol en archivos de infraestructura y flujo critico.
- Eliminacion de logica sensible de IA/Transbank desde frontend, manteniendo backend como fuente de verdad.

## 7. Recomendaciones para siguiente iteracion
1. Estandarizar convenciones por modulo (nombres, comentarios, manejo de errores).
2. Implementar checklist de QA regresivo por release.
3. Definir politica de documentacion viva (owner por archivo critico).
4. Agregar CI para lint, test y chequeos de seguridad.

## 8. Entregables minimos para onboarding
- Este analisis.
- Documento de procesos operativos.
- Documento de seguridad base.
- Guia de colaboradores.
