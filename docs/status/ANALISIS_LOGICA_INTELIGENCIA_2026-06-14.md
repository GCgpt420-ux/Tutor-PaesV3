# Analisis de logica e inteligencia del proyecto TutorPAES (2026-06-14)

## 1) Resumen ejecutivo

Estado actual:
- El sistema SI tiene una base de inteligencia aplicada a la tarea educativa (personalizacion por rendimiento + tutor conversacional contextual + trazabilidad de uso IA).
- Pero NO tiene aun memoria semantica de largo plazo, ni razonamiento adaptativo basado en conocimiento recuperado (RAG), ni bucle de aprendizaje automatico sobre resultados pedagogicos.

Conclusion:
- Hoy es una plataforma de tutor IA asistido por reglas + LLM multi-proveedor.
- Todavia no es un sistema cognitivo plenamente adaptativo de nivel avanzado.

## 2) Arbol de carpetas logicas (tecnico-funcional)

```text
Tutor-PaesV3/
├─ tutorpaes/
│  ├─ backend/
│  │  ├─ app/
│  │  │  ├─ api/v1/endpoints/        # Contratos HTTP: auth, quiz, ai, ai_chat, voice, payments, etc.
│  │  │  ├─ services/                # Logica de negocio e IA (feedback, chatbot, proveedores LLM)
│  │  │  ├─ db/                      # Modelo de datos SQLAlchemy (users, attempts, chat, ai_usage_logs...)
│  │  │  ├─ core/                    # Config, auth, rate limiting, seguridad, logging
│  │  │  ├─ schemas/                 # Contratos de entrada/salida (Pydantic)
│  │  │  └─ main.py                  # Bootstrap FastAPI + middlewares + routers
│  │  ├─ migrations/                 # Evolucion de esquema DB
│  │  ├─ tests/                      # Cobertura backend (chat, auth, quiz, seguridad, pagos)
│  │  └─ requirements.txt            # Dependencias Python
│  └─ frontend/
│     ├─ app/                        # Next.js App Router + API routes proxy
│     │  ├─ api/backend/[...path]/   # Proxy generico al backend Python
│     │  ├─ api/ai/explain/          # Proxy SSE de explicaciones IA
│     │  └─ protected/...            # Vistas autenticadas (ensayos, resultados, progreso, etc.)
│     ├─ src/
│     │  ├─ features/ai/             # Chat IA, hooks de stream y prompts UI
│     │  ├─ features/exams/          # Flujos de ensayo y resultados
│     │  ├─ hooks/useVoice.ts        # STT/TTS UX integrada al tutor
│     │  ├─ lib/api/                 # Cliente HTTP
│     │  └─ components/ui/           # Componentes visuales compartidos
│     └─ package.json
├─ docs/ + DOCS/                     # Estado, arquitectura, reportes, roadmap
└─ scripts/                          # Operacion local (up/down, backups, smoke)
```

## 3) Funcionamiento detallado de la logica IA

### 3.1 Logica de personalizacion (backend)

Nucleo:
- app/services/ai_service.py

Que hace realmente:
- Calcula nivel global del alumno (principiante/intermedio/avanzado) usando historico de intentos por tema.
- Detecta temas debiles por umbral de accuracy.
- Genera feedback por reglas cuando:
  - la respuesta es correcta (refuerzo positivo adaptado por nivel), o
  - falla OpenAI/LLM (fallback robusto).
- Usa cache de explicaciones por pregunta+alternativa incorrecta para reducir costo y latencia.

Fortaleza:
- Enfoque hibrido practico: regla + LLM + cache.

Limite:
- La personalizacion es estadistica y heuristica, no semantica.

### 3.2 Logica de chat tutor pedagogico

Nucleo:
- app/services/chatbot_service.py
- app/services/llm_provider_service.py

Que hace realmente:
- Arma un system prompt pedagogico con estilo socratico y tono chileno.
- Inyecta contexto del intento (pregunta, opciones, respuesta del alumno, resultado y feedback previo).
- Recupera historial de chat reciente desde BD.
- Emite respuesta en stream SSE usando proveedor LLM configurado (OpenAI/Groq/Cerebras).
- Tiene fallback textual si LLM falla.

Fortaleza:
- Excelente para acompanamiento conversacional en tiempo real.

Limite:
- Historial corto (ultimos mensajes), sin recuperacion semantica multi-sesion.

### 3.3 Logica de explicacion IA por pregunta

Nucleo:
- app/api/v1/endpoints/ai.py
- app/services/openai_service.py
- frontend app/api/ai/explain/route.ts
- frontend src/features/ai/hooks/use-ai-explanation.ts

Que hace realmente:
- Frontend pide explicacion por pregunta.
- Route Next.js proxea al endpoint stream del backend.
- Backend genera explicacion LLM personalizada por nivel.
- Si falla, cae a fallback.

Fortaleza:
- UX de streaming y tolerancia a fallos.

Limite:
- No usa corpus externo (material PAES, guias, clases) como memoria de apoyo.

### 3.4 Voz (STT/TTS)

Nucleo:
- app/api/v1/endpoints/voice.py
- frontend src/hooks/useVoice.ts

Que hace realmente:
- STT via Groq Whisper.
- TTS via OpenAI o ElevenLabs, con fallback browser speech.
- Integrado al chat para loop conversacional natural.

Fortaleza:
- Aumenta accesibilidad y engagement.

Limite:
- No hay razonador de prosodia o deteccion automatica de confusion emocional.

### 3.5 Datos y telemetria para inteligencia

Nucleo:
- app/db/models.py

Datos relevantes ya disponibles:
- attempts, attempt_feedback, user_progress
- chat_messages
- ai_usage_logs (tokens, costo, latencia)
- question_explanations (cache)

Fortaleza:
- Base de datos suficiente para construir memoria semantica y modelos adaptativos.

Limite:
- Falta capa de embeddings/vector store y pipeline de aprendizaje continuo.

## 4) Diagnostico: que tan inteligente es hoy

Escala propuesta:
- Nivel 1: Automatizacion con reglas
- Nivel 2: Recomendacion adaptativa basica
- Nivel 3: Tutor contextual multi-turno
- Nivel 4: Memoria semantica longitudinal
- Nivel 5: Tutor cognitivo con evaluacion de aprendizaje causal

TutorPAES actual:
- Entre Nivel 3 y un inicio de Nivel 4 (por datos historicos), pero sin memoria semantica real implementada.

## 5) Donde apretar las tuercas (priorizado)

### Prioridad alta (impacto pedagogico directo)

1. Memoria semantica por alumno
- Crear embeddings de:
  - errores recurrentes,
  - explicaciones previas efectivas,
  - fragmentos de contenido curricular,
  - resumenes por sesion.
- Recuperar top-k contexto antes de responder chat/explain.

2. RAG pedagogico con fuentes confiables
- Indexar banco de guias PAES y contenido interno curado.
- Citar fuente interna en explicaciones para trazabilidad.

3. Politica de tutor adaptativo por estado de aprendizaje
- Detectar estado: confusion, estancamiento, dominio superficial, dominio profundo.
- Cambiar estrategia automaticamente (socratico, analogia, paso-a-paso, mini test).

### Prioridad media (calidad del sistema)

4. Evaluacion real de efectividad
- KPI no solo de uso: medir mejora de score por topico tras intervencion IA.
- A/B de prompts y estrategias pedagogicas.

5. Memoria episodica segura
- Resumen por sesion + objetivos + errores persistentes.
- Versionar perfil cognitivo del estudiante con expiracion y control de sesgo.

6. Motor de recomendacion de practica
- Siguiente pregunta optimizada por skill gap, no aleatoria.

## 6) Ideas fuertes (antes parecian descabelladas, hoy viables)

1. Tutor dual (Socratico + Verificador)
- Agente A ensena.
- Agente B audita precision pedagogica y sesgos antes de mostrar respuesta.

2. Mapa de conocimiento por estudiante (Knowledge Graph)
- Nodos: conceptos PAES.
- Aristas: prerequisitos.
- Estado por nodo: no visto / fragil / consolidado.
- El tutor elige intervencion por grafo, no por prompt plano.

3. Diagnostico de misconceptions
- Clasificar errores por tipo (conceptual, calculo, lectura, estrategia).
- Entrenar respuesta personalizada por tipo de error.

4. Simulador de meta PAES
- Planificador que proyecta progreso esperado segun ritmo real y propone micro-acciones.

## 7) Arquitectura objetivo recomendada para memoria semantica

Pipeline minimo:
1. Ingestion
- Intentos, chat, feedback y material curricular.

2. Segmentacion
- Chunks por unidad semantica (pregunta, error, explicacion, concepto).

3. Embeddings
- Modelo de embedding robusto y costo-efectivo.

4. Almacen vectorial
- Opcion A: pgvector en PostgreSQL (simple y cercano a stack actual).
- Opcion B: Qdrant/Weaviate si crece mucho volumen.

5. Retrieval hibrido
- BM25 + vector search + reranking.

6. Orquestacion
- Construir contexto final con:
  - perfil del usuario,
  - memoria semantica recuperada,
  - contexto del intento actual,
  - politica pedagogica.

7. Guardrails
- Filtros de seguridad, control de costo, trazabilidad de fuentes.

## 8) Riesgos tecnicos a vigilar

- Prompt injection via contexto libre del usuario.
- Sobre-personalizacion (encasillar alumno en nivel bajo).
- Deriva de calidad por prompts sin evaluacion A/B.
- Costos LLM sin cache semantica ni politicas de truncado inteligente.

## 9) Plan de investigacion recomendado (8 semanas)

Semana 1-2:
- Definir taxonomia de errores y esquema de memoria.
- Crear tabla/indice vectorial inicial (pgvector).

Semana 3-4:
- Implementar retrieval semantico para chat IA.
- Medir latencia, costo, precision pedag.

Semana 5-6:
- Implementar retrieval en explain IA.
- Agregar citacion de fuente y score de confianza.

Semana 7-8:
- Evaluacion A/B en cohortes.
- Ajuste de politicas pedagogicas y roadmap productivo.

## 10) Veredicto final

- Si: el proyecto ya tiene una base inteligente util y diferenciadora para tutoria PAES.
- No aun: todavia no tiene memoria semantica longitudinal ni motor de adaptacion cognitiva completo.
- Proximo salto real: pasar de "prompt + historial corto" a "memoria semantica + politicas pedagogicas dinamicas + evaluacion de impacto en aprendizaje".
