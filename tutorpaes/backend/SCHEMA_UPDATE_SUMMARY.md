# Schema Update Summary - Production Ready
**Fecha:** 26 de febrero de 2026  
**Objetivo:** Cerrar brecha con esquema Supabase y preparar para producción (10 → 50,000 usuarios)

---

##  CAMBIOS IMPLEMENTADOS

### 1. **Tabla User - Perfiles Académicos Completos**
**Campos agregados:**
- `avatar_url` (String 512) - URL del avatar del usuario
- `age` (Integer) - Edad del estudiante
- `academic_level` (String 64) - Ej: "4to medio", "1ro universidad"
- `target_university` (String 120) - Universidad objetivo
- `target_degree` (String 120) - Carrera objetivo (ej: "Ingeniería Civil")
- `target_score` (Integer) - Puntaje PAES objetivo
- `role` (String 32) - "student", "teacher", "admin"
- `is_premium` (Boolean, indexed) - Flag de usuario premium

**Índices agregados:**
- `ix_users_email_active` (email, is_active)
- `ix_users_premium` (is_premium)
- `ix_users_role` (role)

---

### 2. **Tabla Question - Soporte para Imágenes**
**Campo agregado:**
- `image_url` (String 512, nullable) - URL a gráficos/figuras matemáticas

**Índices agregados:**
- `ix_questions_topic_active` (topic_id, is_active)
- `ix_questions_difficulty` (difficulty)

**Relación agregada:**
- Many-to-many con `Exam` vía `exam_questions`

---

### 3. **Nueva Tabla: exam_questions (Association Table)**
**Propósito:** Relación many-to-many entre Exams y Questions

**Columnas:**
- `exam_id` (Integer, FK → exams.id, CASCADE)
- `question_id` (Integer, FK → questions.id, CASCADE)
- PK compuesto: (exam_id, question_id)

**Índices:**
- `ix_exam_questions_exam` (exam_id)
- `ix_exam_questions_question` (question_id)

**Caso de uso:** Permite crear ensayos personalizados mezclando preguntas de distintos temas.

---

### 4. **Nueva Tabla: ChatMessage**
**Propósito:** Tutor IA conversacional durante el ensayo

**Columnas:**
- `id` (Integer, PK)
- `user_id` (Integer, FK → users.id, CASCADE, indexed)
- `attempt_id` (Integer, FK → attempts.id, CASCADE, indexed)
- `role` (ENUM: "user", "assistant")
- `content` (Text) - Contenido del mensaje
- `created_at` (DateTime with TZ)

**Índices:**
- `ix_chat_attempt_created` (attempt_id, created_at)

**Caso de uso:** El alumno puede chatear con el tutor mientras resuelve preguntas.

---

### 5. **Nueva Tabla: AIUsageLog**
**Propósito:** Auditoría de costos OpenAI por usuario

**Columnas:**
- `id` (Integer, PK)
- `user_id` (Integer, FK → users.id, CASCADE, indexed)
- `action_type` (ENUM: "explanation", "hint", "chat", "feedback")
- `model` (String 64) - Ej: "gpt-4o-mini", "gpt-4"
- `prompt_tokens` (Integer)
- `completion_tokens` (Integer)
- `total_cost` (Numeric(10, 6)) - USD con 6 decimales
- `latency_ms` (Integer, nullable)
- `created_at` (DateTime with TZ)

**Índices:**
- `ix_ai_logs_user_date` (user_id, created_at)
- `ix_ai_logs_action` (action_type)

**Caso de uso:** 
- Controlar límites por usuario (ej: 10 explicaciones/mes en plan free)
- Auditar costos reales de OpenAI
- Detectar abusos

---

### 6. **Actualizaciones en Exam**
**Campo agregado:**
- `is_custom` (Boolean, indexed, default=False)

**Relación agregada:**
- Many-to-many con `Question` vía `exam_questions`

---

### 7. **Actualizaciones en Attempt**
**Campos agregados:**
- `incorrect_count` (Integer, default=0)
- `omitted_count` (Integer, default=0)

**Relación agregada:**
- `chat_messages` → List[ChatMessage]

**Índices agregados:**
- `ix_attempts_user_status` (user_id, status)
- `ix_attempts_user_completed` (user_id, completed_at)

---

### 8. **Actualizaciones en AttemptFeedback**
**Campo agregado:**
- `time_spent_seconds` (Integer, nullable)

**Índice agregado:**
- `ix_feedback_attempt_question` (attempt_id, question_id)

---

### 9. **Actualizaciones en UserProgress**
**Campos agregados:**
- `total_answered` (Integer, default=0)
- `total_correct` (Integer, default=0)

**Índice agregado:**
- `ix_progress_user_activity` (user_id, last_activity_at)

---

### 10. **Nuevos ENUMs**
```python
ChatRole = ENUM("user", "assistant")
AIActionType = ENUM("explanation", "hint", "chat", "feedback")
```

---

##  MEJORAS DE SEGURIDAD Y RENDIMIENTO

### Índices Estratégicos (50k usuarios)
1. **Usuarios activos:** `ix_users_email_active` - consultas de login rápidas
2. **Premium:** `ix_users_premium` - filtrar usuarios pagados
3. **Intentos completados:** `ix_attempts_user_completed` - dashboard "Mi Progreso"
4. **Logs de IA por fecha:** `ix_ai_logs_user_date` - auditoría rápida de costos
5. **Preguntas activas por tema:** `ix_questions_topic_active` - generación de ensayos

### Lazy Loading Optimizado
- Se usa `lazy="selectinload"` en relaciones frecuentemente accedidas:
  - `Exam.subjects`
  - `Subject.topics`
  - `Topic.questions`
  - `Question.choices`
  - `User.attempts`

**Resultado:** Evita N+1 queries al cargar catálogos completos.

### Constraints y Cascades
- **CASCADE:** Cuando se borra un usuario, se borran sus attempts, payments, chat_messages, ai_logs
- **RESTRICT:** No se puede borrar un Exam/Subject/Topic si tiene attempts activos
- **SET NULL:** Si se borra una choice, el feedback mantiene el attempt_id pero choice_id = NULL

---

##  ESTADÍSTICAS FINALES

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Tablas** | 11 | 14 (+3) |
| **Campos en User** | 9 | 17 (+8) |
| **Índices totales** | ~15 | ~28 (+13) |
| **Tablas de auditoría IA** | 0 | 1 (AIUsageLog) |
| **Relaciones many-to-many** | 0 | 1 (exam_questions) |
| **ENUMs** | 4 | 6 (+2) |

---

##  PRÓXIMOS PASOS

### 1. Generar migración Alembic
```bash
cd backend
source venv/bin/activate
alembic revision --autogenerate -m "Production schema update: profiles, chat, AI audit"
```

### 2. Revisar la migración generada
- Verificar que los ENUMs nuevos se crean correctamente
- Confirmar que los índices se generan en orden correcto
- Validar que las relaciones FK están bien referenciadas

### 3. Aplicar migración
```bash
alembic upgrade head
```

### 4. Actualizar endpoints del backend
- `POST /ai/chat` - Crear mensajes de chat
- `GET /users/{id}/ai-usage` - Consultar consumo de IA
- `GET /catalog/exams/{id}/custom` - Crear ensayo personalizado
- `PUT /users/{id}/profile` - Actualizar perfil académico

### 5. Testing de rendimiento
- Seed de 1,000 preguntas
- 100 usuarios con 50 attempts cada uno
- Medir tiempos de:
  - `GET /catalog/exams` con `selectinload`
  - Dashboard "Mi Progreso" (agregar por topic)
  - Generación de ensayo personalizado (JOIN exam_questions)

---

##  NOTAS IMPORTANTES

1. **PKs mantienen Integer:** No se migró a UUID por compatibilidad con migraciones existentes. Para un sistema nuevo, UUID sería recomendado.

2. **Backup creado:** Se guardó `models_backup_YYYYMMDD_HHMMSS.py` antes de reemplazar.

3. **Comprobación exitosa:** 
  - Compilación Python OK
  - Importación de modelos OK
  - 14 modelos detectados

4. **Escalabilidad:** El esquema está diseñado para soportar 50k usuarios con consultas optimizadas y índices estratégicos.

---

##  CHECKLIST DE VALIDACIÓN

- [x] Modelos compilados sin errores
- [x] Todos los modelos importan correctamente
- [x] Backup del archivo original creado
- [ ] Migración Alembic generada
- [ ] Migración revisada manualmente
- [ ] Migración aplicada en dev
- [ ] Tests de integración actualizados
- [ ] Endpoints del backend actualizados
- [ ] Schemas Pydantic actualizados
- [ ] Frontend actualizado para nuevos campos de perfil
