# Auditoría de Deuda Técnica y Valores Hardcodeados

**Proyecto:** Tutor PAES V3 (Sprint Final Pre-Piloto)  
**Fecha:** 1 de Octubre de 2026  
**Ámbito:** Backend FastAPI (`tutorpaes/backend`) y Scripts de Infraestructura  
**Objetivo:** Identificar y catalogar valores fijos, credenciales por defecto, URLs locales y comentarios de deuda técnica para su resolución en el ciclo de endurecimiento post-piloto.

---

## 1. Valores Hardcodeados en Scripts de Seed

Los scripts de inicialización contienen valores fijos convenientes para el despliegue del piloto pero que deben externalizarse o parametrizarse para entornos de producción formal:

### A. `seed_pilot_users.py` (`scripts/seed_pilot_users.py` y `tutorpaes/backend/scripts/seed_pilot_users.py`)
- **Contraseña universal del piloto:** `PILOT_PASSWORD = os.getenv("PILOT_PASSWORD", "paes2026")`. Aunque tiene soporte de variable de entorno, el fallback por defecto `"paes2026"` está fijado en código.
- **Correo y nombre del docente:**
  - `TEACHER_EMAIL = "profesor.hermano@tutorpaes.cl"`
  - `TEACHER_NAME = "Profesor Hermano"`
  - `COURSE_NAME = "Curso Piloto PAES 2026"`
- **Listado estático de alumnos:**
  - 20 correos con patrón `alumno{01..20}@tutorpaes.cl` con nombres chilenos fijos en `UNIVERSITY_NAMES`.
  - 10 correos con patrón `escolar{01..10}@tutorpaes.cl` con nombres fijos en `SCHOOL_NAMES`.
  - Carreras y universidades asignadas mediante rotación aritmética fija sobre listas constantes (`UNIVERSITIES`, `SCHOOL_UNIVERSITIES`, etc.).

### B. `seed_user.py` (`tutorpaes/backend/scripts/seed_user.py`)
- **Contraseñas por defecto:** `"demo123"`, `"admin123"`, `"profesor123"`.
- **Correos fijos:** `"demo@example.com"`, `"admin@tutorpaes.cl"`, `"profesor@tutorpaes.cl"`, `"estudiante@example.com"`.

### C. `setup_demo.py` (`tutorpaes/backend/scripts/setup_demo.py`)
- **Credenciales fijas:** `"demo@example.com"` / `"demo123"`.
- Códigos de asignaturas y tópicos fijos en estructura monolítica (`"MAT"`, `"LENG"`, `"CIEN"`).

### D. `seed_paes_data.py` (`tutorpaes/backend/scripts/seed_paes_data.py`)
- **Rutas locales de Gabriel:**
  - `DEFAULT_JSONL_FILE = "/home/gabriel/Escritorio/Proyectos2026/Procesamiento_Datos_Psu/salida_lista_hoy/preguntas_demre_2026_auditadas_final.jsonl"`
  - `DEFAULT_IMAGES_DIR = "/home/gabriel/Escritorio/Proyectos2026/Procesamiento_Datos_Psu/salida_lista_hoy/imagenes_2026"`
  *(Mitigación: cuentan con variables de entorno `PAES_JSONL_FILE` y `PAES_IMAGES_DIR`, pero las rutas por defecto son absolutas al entorno local)*.

---

## 2. IDs Hardcodeados en Consultas SQL y Lógica de Negocio

### A. IDs de Materias y Exámenes en `seed_pilot_users.py`
En `sync_pilot_dashboard_metrics()` se asumen los IDs autoincrementales asignados en la primera corrida del seeder:
- `Topic.subject_id == 1` $\rightarrow$ Asume que Matemática M1 es `id=1`.
- `Topic.subject_id == 4` $\rightarrow$ Asume que Matemática M2 es `id=4`.
- `Topic.subject_id == 6` $\rightarrow$ Asume que Biología es `id=6`.
- `Topic.subject_id == 7` $\rightarrow$ Asume que Física es `id=7`.
- `Topic.subject_id == 8` $\rightarrow$ Asume que Química es `id=8`.
- `Topic.subject_id == 9` $\rightarrow$ Asume que Competencia Lectora es `id=9`.
- `exam_id = 1` $\rightarrow$ Asume que el examen oficial PAES es `id=1`.
- `subject_id = 1` y `subject_id = 9` al crear registros de `Attempt`.
*(Riesgo: Si la base de datos se limpia o se pueblan materias en orden diferente, las consultas fallan o quedan huérfanas. Debe resolverse consultando `Subject.code` en lugar de `subject_id` directo)*.

### B. IDs en `seed_teacher_data.py` (Script histórico en scratch)
- `demo_user = db.scalar(select(User).where(User.id == 1))`
- `topic_id=1`, `topic_id=2`, `topic_id=10`, `topic_id=11`, `topic_id=4` hardcodeados directamente en `UserProgress`.

### C. Referencias a `exam_id=1` en Docstrings de Endpoints (`catalog.py`)
- `GET /api/v1/catalog/subjects/?exam_id=1` (L150, L425)
- `GET /api/v1/catalog/topics/?subject_id=1` (L210)
*(Solo en documentación y ejemplos Swagger/OpenAPI, no bloquea lógica)*.

---

## 3. Comentarios de Deuda Técnica: `TODO`, `FIXME` y `HACK`

Se realizó una búsqueda exhaustiva (`grep -rn -E "TODO|FIXME|HACK"`) en todo el backend y frontend:

1. **`tutorpaes/backend/app/services/invoice_service.py:221`**:
   ```python
   # TODO: Implementar generación real de PDF
   ```
   *Impacto:* En el módulo de facturación Transbank, la generación del archivo PDF de la boleta electrónica actualmente emite un archivo simulado/placeholder en lugar de invocar una librería como `WeasyPrint` o `ReportLab`.

2. **`tutorpaes/backend/app/api/v1/endpoints/payments.py:352`**:
   ```python
   # TODO: Implementar generación real de PDF
   ```
   *Impacto:* Idem anterior; el endpoint de descarga de factura no genera el documento tributario real.

3. **`tutorpaes/backend/app/db/models.py:218`**:
   ```python
   # lazy="select" (default): carga bajo demanda. NO usar selectin aquí porque
   # get_current_user() corre en cada request y selectin cargaría TODOS los attempts
   # del usuario en memoria, lo que es costoso para usuarios activos.
   ```
   *Nota de diseño:* Documenta deliberadamente la mitigación de sobrecarga de memoria en `User.attempts`.

*Nota sobre frontend:* En `tutorpaes/frontend/src/` y `tutorpaes/frontend/app/` no existen comentarios `TODO`, `FIXME` ni `HACK`.

---

## 4. URLs Hardcodeadas en el Backend (Localhost, Puertos y Terceros)

### A. Fallbacks Locales y CORS (`app/core/config.py`)
- `FRONTEND_URL: str = Field(default="http://localhost:3000", ...)`
- `CORS_ORIGINS`: Contiene por defecto `http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001`.
- `PAYMENT_RETURN_URL`: Por defecto `http://localhost:8001/api/v1/payments/confirm`.
- Método `get_frontend_url()` (L197): Retorna `"http://localhost:3000"` si no está definido en variables de entorno.

### B. Servidor de Archivos Estáticos Legacy (`scripts/seed_paes_data.py`)
- Línea 161:
  ```python
  return f"http://localhost:8000/static/imagenes/{parts[1]}"
  ```
  *(Ruta residual del antiguo esquema de imágenes previas a la migración oficial DEMRE 2026)*.

### C. Proveedores de IA y Servicios Externos
- `tutorpaes/backend/app/services/llm_provider_service.py:117`:
  - `base_url="https://openrouter.ai/api/v1"`
  - `"HTTP-Referer": "https://tutorpaes.cl"`
- `tutorpaes/backend/app/services/transbank_service.py:118`:
  - URL de integración Transbank comentada (`https://webpay3gint.transbank.cl/webpayserver/initTransaction`).
- `tutorpaes/backend/app/api/v1/endpoints/voice.py`:
  - L50: `"https://api.groq.com/openai/v1/audio/transcriptions"` (Whisper Groq)
  - L96: `"https://api.openai.com/v1/audio/speech"` (TTS OpenAI)
  - L135: `f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}"` (ElevenLabs)

---

## 5. Recomendaciones de Mitigación Post-Piloto

1. **Parametrización de IDs:** Sustituir en los seeders las referencias numéricas directas (`subject_id == 1`) por búsquedas dinámicas `select(Subject.id).where(Subject.code == 'M1')`.
2. **URLs Relativas en Imágenes:** Unificar todas las rutas de imágenes en `/static/...` sin prefijo de host ni puerto para desacoplar el backend del entorno donde se ejecute el frontend o el túnel.
3. **Módulo de Facturación:** Implementar motor real de generación de PDFs con plantilla HTML/CSS para cumplir normativas tributarias formales si se pasa a producción comercial.
4. **Secretos en Producción:** Asegurar que en el despliegue de producción las variables `PILOT_PASSWORD`, `SECRET_KEY`, y tokens Transbank se inyecten exclusivamente mediante bóveda de secretos o variables de entorno del servidor.
