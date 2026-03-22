# Indice Maestro para Colaboradores

## 1. Objetivo
Centralizar el orden de lectura, responsabilidades y ruta de ejecución para incorporar colaboradores sin fricción.

## 2. Orden de lectura recomendado
1. [DOCS/ESTUDIO_INTEGRAL_Y_CONSENSO_ESTADO_ACTUAL.md](DOCS/ESTUDIO_INTEGRAL_Y_CONSENSO_ESTADO_ACTUAL.md)
2. [DOCS/ANALISIS_DETALLADO_PROYECTO.md](DOCS/ANALISIS_DETALLADO_PROYECTO.md)
3. [DOCS/PROCESOS_OPERATIVOS.md](DOCS/PROCESOS_OPERATIVOS.md)
4. [DOCS/BASES_SEGURIDAD.md](DOCS/BASES_SEGURIDAD.md)
5. [DOCS/GUIA_COLABORADORES.md](DOCS/GUIA_COLABORADORES.md)
6. [DOCS/ARQUITECTURA_Y_ROADMAP_PRODUCCION.md](DOCS/ARQUITECTURA_Y_ROADMAP_PRODUCCION.md)
7. [DOCS/ROADMAP_EJECUCION_V2.md](DOCS/ROADMAP_EJECUCION_V2.md)

## 3. Mapa de módulos críticos
### 3.1 Frontend
- Auth:
  - [tutorpaes/frontend/app/auth/login/page.tsx](tutorpaes/frontend/app/auth/login/page.tsx)
  - [tutorpaes/frontend/app/auth/sign-up/page.tsx](tutorpaes/frontend/app/auth/sign-up/page.tsx)
- Dashboard y progreso:
  - [tutorpaes/frontend/app/protected/progreso/page.tsx](tutorpaes/frontend/app/protected/progreso/page.tsx)
  - [tutorpaes/frontend/app/protected/layout.tsx](tutorpaes/frontend/app/protected/layout.tsx)
- Quiz:
  - [tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.tsx](tutorpaes/frontend/app/protected/quiz/[subject_code]/[topic_code]/page.tsx)
- Infraestructura frontend:
  - [tutorpaes/frontend/src/lib/api/client.ts](tutorpaes/frontend/src/lib/api/client.ts)
  - [tutorpaes/frontend/proxy.ts](tutorpaes/frontend/proxy.ts)
  - [tutorpaes/frontend/app/layout.tsx](tutorpaes/frontend/app/layout.tsx)

### 3.2 Backend
- Auth:
  - [tutorpaes/backend/app/api/v1/endpoints/auth.py](tutorpaes/backend/app/api/v1/endpoints/auth.py)
- Quiz:
  - [tutorpaes/backend/app/api/v1/endpoints/quiz.py](tutorpaes/backend/app/api/v1/endpoints/quiz.py)
- Configuración:
  - [tutorpaes/backend/app/core/config.py](tutorpaes/backend/app/core/config.py)

## 4. Distribución sugerida para 2 ayudantes
### Ayudante A: Frontend
- Objetivo: UX, sesión, dashboard y flujo de quiz.
- Enfoque:
  1. Validar flujo auth completo.
  2. Validar estado y errores en quiz.
  3. Revisar consistencia de textos y mensajes al usuario.

### Ayudante B: Backend
- Objetivo: seguridad, estabilidad de endpoints y configuración.
- Enfoque:
  1. Validar errores HTTP y contratos API.
  2. Revisar settings de seguridad y entorno.
  3. Asegurar consistencia de respuesta en auth/quiz/pagos.

## 5. Checklist de entrada para cada colaborador
1. Levantar entorno local con scripts del proyecto.
2. Confirmar backend health y frontend activo.
3. Ejecutar flujo auth y una prueba de quiz.
4. Registrar dudas técnicas en documento compartido de trabajo.

## 6. Criterios de salida de cada tarea
- Cambios acotados por módulo.
- Sin emojis en código y documentación.
- Comentarios y mensajes en español técnico.
- Validación mínima reportada (qué se probó y resultado).
