# Contexto Global Tutor PAES
*Documento maestro para alinear la Memoria de Título y alimentar el contexto de cualquier IA.*

Este documento concentra el 100% de la comprensión técnica, académica y de negocio del proyecto Tutor PAES. Úsalo como "Megaprompt" de contexto para iniciar nuevas sesiones de chat.

---

## 1. Contexto Académico y Científico (Memoria de Título)
*(Nota: Completa aquí con la información formal de tu tesis)*

- **Problema de Investigación:** 
  > [Escribe aquí el problema formal]
- **Objetivo General:** 
  > [Escribe aquí el objetivo general]
- **Objetivos Específicos:** 
  > [Escribe aquí los objetivos específicos]
- **Marco Teórico y Métricas Pedagógicas:** 
  > [Describe cómo validarás académicamente que el alumno "aprendió". Ej: Uso de taxonomía de Bloom, medición de retención, pre/post test, etc.]

---

## 2. Reglas de Negocio y Modelo Económico (SaaS)

- **Estructura de Precios:** 
  > [Completa aquí tu estrategia: Suscripción mensual, freemium, pago por uso, etc.]
  *Contexto técnico actual: La base de datos soporta planes "free", "pro" y "school" a través de la tabla `user_entitlements`.*

- **Control de Costos (Unit Economics):** 
  > [Completa aquí tus cálculos de costos por uso de tokens OpenAI/Groq por alumno/ensayo]
  *Contexto técnico actual: El backend ya recolecta esta telemetría en la tabla `ai_usage_logs` calculando tokens prompt/completion y el costo en USD exacto por cada interacción.*

- **Módulo de Pagos (Transbank):** 
  > [Completa aquí el flujo pensado o el estado de pruebas]
  *Contexto técnico actual: El sistema posee un modelo `payments` con registros del `buy_order`, tokens y transacciones de Transbank, además de un módulo `invoices` para la generación de boletas con desglose de IVA.*

---

## 3. Modelado de Datos Profundo (Base de Datos)
*(Esta sección está completada basada en la arquitectura PostgreSQL de `app/db/models.py`)*

El sistema utiliza un modelado relacional optimizado (con migraciones Alembic) agrupado en 5 núcleos:

1. **Catálogo Core (Exámenes y Temario):**
   - **`exams`, `subjects`, `topics`:** Jerarquía de ensayos oficiales y personalizados.
   - Los ensayos personalizados usan una tabla intermedia (`exam_questions`) para mezclar preguntas dinámicamente.

2. **Perfiles e Identidad (Usuarios):**
   - **`users`:** Soporta autenticación híbrida (Email/Password y WhatsApp). Almacena métricas objetivo (`target_university`, `target_score`) y roles (`student`, `teacher`, `admin`).
   - **`user_entitlements`:** Gestiona periodos de suscripción activos.

3. **Motor de Preguntas:**
   - **`questions` y `question_choices`:** Soporta enunciados con textos de lectura adjuntos, URLs de imágenes, tipos de pregunta (MCQ, texto abierto) y nivel de dificultad.

4. **Telemetría Pedagógica y de Intentos (El Diferenciador):**
   - **`attempts`:** Registra intentos de ensayos (en progreso, abandonados, completados), puntajes y conteo de respuestas correctas/omitidas.
   - **`attempt_feedback` (Telemetría del Error):** Por CADA pregunta respondida, se guarda: el tiempo exacto en segundos (`time_spent_seconds`), la opción elegida, si fue correcta o no, y un campo clave `ai_payload` (JSONB) que almacena la inferencia y análisis de la IA sobre *por qué* el alumno falló.
   - **`user_progress`:** Mantiene un caché actualizado con el % de éxito (accuracy), días de racha (streak) y preguntas totales por cada Tema para renderizar en el Dashboard.

5. **IA y Auditoría:**
   - **`chat_messages`:** Historial de conversación multimodal (Tutor AI) durante un ensayo en progreso.
   - **`question_explanations`:** Caché de explicaciones generadas previamente por la IA para la combinación [Pregunta + Alternativa Incorrecta], ahorrando llamadas repetidas a las APIs (reducción de costos).

---

## 4. Flujos de Usuario (User Journeys) y Casos de Borde

- **¿Qué pasa cuando un alumno se queda sin internet a mitad de un ensayo?**
  > [Completa con la regla de UX de frontend]
  *Nota técnica: El estado se guarda en la BD como `in_progress` en la tabla `attempts`, las respuestas previas quedan almacenadas.*

- **Flujo de Onboarding (Primera vez en la plataforma):**
  > [Completa: ¿Se hará un test diagnóstico? ¿Cómo llenan el perfil?]
  *Nota técnica: El modelo de datos ya contempla atributos como `academic_level` y `target_score` para configurar un perfil.*

- **Panel de Control (Dashboard Profesor/Admin):**
  > [Completa: ¿Qué podrán visualizar los profesores sobre sus alumnos?]

---

## 5. Roadmap a Mediano y Largo Plazo

- **Finalización de Beta Cerrada (Artefacto 6):** Validación en liceo con 10-15 estudiantes.
- **Fase 2:** 
  > [Completa: Ej. Nuevas funcionalidades, expansión de materias, modelos predictivos de deserción, etc.]
- **Fase 3:** 
  > [Completa: Escalamiento comercial B2B para colegios (SaaS Institutional), generación de PDFs, etc.]
