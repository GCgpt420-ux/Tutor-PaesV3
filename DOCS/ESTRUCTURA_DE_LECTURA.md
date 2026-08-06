# Estructura y Orden de Lectura de la Documentación (Tutor-PaesV3)

Esta guía organiza los documentos de la carpeta `DOCS` para facilitar la comprensión integral del proyecto. Se divide en fases de lectura sugeridas, desde una introducción de alto nivel hasta detalles operativos específicos.

## Fase 1: Introducción y Estado del Proyecto (Lectura Obligatoria)
*Comienza aquí para entender de qué trata el proyecto, en qué estado se encuentra y hacia dónde va.*

1. **[ESTUDIO_INTEGRAL_Y_CONSENSO_ESTADO_ACTUAL.md](./ESTUDIO_INTEGRAL_Y_CONSENSO_ESTADO_ACTUAL.md)**
   > **El punto de partida.** Resumen del estado actual, consenso del equipo y las metas generales.
2. **[ANALISIS_DETALLADO_PROYECTO.md](./ANALISIS_DETALLADO_PROYECTO.md)**
   - Profundización en los aspectos clave analizados en la fase inicial.
3. **[LECTURA_RAPIDA_IA.md](./LECTURA_RAPIDA_IA.md)**
   - Contexto rápido diseñado tanto para humanos como para asistentes de IA.

## Fase 2: Arquitectura y Roadmap (Visión Técnica)
*Para comprender cómo está construido el sistema y cuáles son los próximos pasos técnicos.*

1. **[ARQUITECTURA_Y_ROADMAP_PRODUCCION.md](./ARQUITECTURA_Y_ROADMAP_PRODUCCION.md)**
   > Documento extenso pero vital. Explica cómo se comunican el frontend y backend, la infraestructura en producción y el roadmap general.
2. **[GUIA_ARQUITECTURA_Y_COSTOS.md](./GUIA_ARQUITECTURA_Y_COSTOS.md)**
   - Desglose de los servicios utilizados y el estimado de costos asociados a la infraestructura.
3. **[DIAGRAMA_BASE_DE_DATOS.md](./DIAGRAMA_BASE_DE_DATOS.md)**
   - Estructura de los datos, tablas y relaciones en PostgreSQL.
4. **[ROADMAP_EJECUCION_V2.md](./ROADMAP_EJECUCION_V2.md)**
   - Plan de acción específico y tareas detalladas para la versión 2 del sistema.

## Fase 3: Integración de IA (El "Cerebro" de TutorPAES)
*Documentos esenciales para entender cómo se integran los modelos de lenguaje (LLMs).*

1. **[AI_PERSONALIZATION_SYSTEM.md](./AI_PERSONALIZATION_SYSTEM.md)**
   - Cómo el sistema se adapta y personaliza el aprendizaje para cada estudiante.
2. **[OPENAI_QUICK_START.md](./OPENAI_QUICK_START.md)** y **[OPENAI_SETUP.md](./OPENAI_SETUP.md)**
   - Guías para configurar e interactuar con la API de OpenAI.
3. **[GEMINI_TUTORIAL_REPOSITORIO.md](./GEMINI_TUTORIAL_REPOSITORIO.md)**
   - Instructivo sobre el uso de Gemini en el contexto de este repositorio.

## Fase 4: Operaciones, Seguridad y Despliegue
*Orientado a mantenedores y operaciones de DevOps/SecOps.*

1. **[BASES_SEGURIDAD.md](./BASES_SEGURIDAD.md)**
   > Reglas de oro sobre manejo de datos, autenticación y prevención de vulnerabilidades.
2. **[API_KEY_ROTATION_POLICY.md](./API_KEY_ROTATION_POLICY.md)**
   - Procedimientos obligatorios para la gestión y rotación segura de credenciales (API Keys, secretos).
3. **[PROCESOS_OPERATIVOS.md](./PROCESOS_OPERATIVOS.md)**
   - Flujos de trabajo del día a día para el mantenimiento.
4. **[CHECKLIST_DESPLIEGUE_PREPROD_PROD.md](./CHECKLIST_DESPLIEGUE_PREPROD_PROD.md)**
   - Pasos estrictos a seguir antes y durante el paso a producción.
5. **[BACKUP_Y_ROLLBACK.md](./BACKUP_Y_ROLLBACK.md)**
   - Estrategias de recuperación ante desastres y restauración de base de datos.

## Fase 5: Guías para Colaboradores y Referencias
*Material de consulta y reglas para el equipo de desarrollo.*

1. **[INDICE_MAESTRO_COLABORADORES.md](./INDICE_MAESTRO_COLABORADORES.md)**
   - Resumen del flujo de trabajo y división de responsabilidades (Frontend/Backend).
2. **[GUIA_COLABORADORES.md](./GUIA_COLABORADORES.md)**
   - Normas de código, convenciones de commits y estilo general.
3. **[REFERENCIA_DE_ARCHIVOS.md](./REFERENCIA_DE_ARCHIVOS.md)**
   - Diccionario extenso de qué hace cada archivo en el repositorio. Excelente para consultas puntuales.

---

### ¿Cómo utilizar esta guía?
Te sugiero marcar en un checklist mental conforme vayas leyendo. 
Si quieres **entender el negocio y la visión general**, enfócate en la **Fase 1**. 
Si eres un **desarrollador que va a tocar código**, necesitas leer obligatoriamente las **Fases 2, 4 y 5**.
