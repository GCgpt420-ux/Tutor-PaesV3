# Diagrama de Base de Datos - TutorPAES

## Estado del documento
- Tipo: documento operativo de arquitectura de datos.
- Estado: vigente.
- Última actualización: 2026-03-14.

## Objetivo
Proveer un diagrama ER (Entidad-Relación) único y compartible del esquema principal de base de datos de TutorPAES.

## Alcance
- Esquema ORM definido en backend.
- Entidades de catálogo, usuarios, quiz, IA, sesiones y pagos.
- Relaciones principales y llaves foráneas.

## Contenido principal

```mermaid
erDiagram
    EXAMS {
        int id PK
        string code UK
        string name
        bool is_custom
        datetime created_at
    }

    SUBJECTS {
        int id PK
        int exam_id FK
        string code
        string name
    }

    TOPICS {
        int id PK
        int subject_id FK
        string code
        string name
    }

    QUESTIONS {
        int id PK
        int topic_id FK
        text prompt
        smallint difficulty
        string question_type
        bool is_active
        datetime created_at
    }

    QUESTION_CHOICES {
        int id PK
        int question_id FK
        string label
        text text
        bool is_correct
    }

    EXAM_QUESTIONS {
        int exam_id PK, FK
        int question_id PK, FK
    }

    USERS {
        int id PK
        string phone UK
        string email UK
        string role
        bool is_premium
        bool is_active
        bool is_admin
        datetime created_at
    }

    ATTEMPTS {
        int id PK
        int user_id FK
        int exam_id FK
        int subject_id FK
        int topic_id FK
        string status
        int total_questions
        int correct_count
        int incorrect_count
        int omitted_count
        int score
        datetime started_at
        datetime completed_at
    }

    ATTEMPT_FEEDBACK {
        int id PK
        int attempt_id FK
        int question_id FK
        int selected_choice_id FK
        bool is_correct
        int time_spent_seconds
        text feedback_text
        json ai_payload
        datetime created_at
    }

    CHAT_MESSAGES {
        int id PK
        int user_id FK
        int attempt_id FK
        string role
        text content
        datetime created_at
    }

    AI_USAGE_LOGS {
        int id PK
        int user_id FK
        string action_type
        string model
        int prompt_tokens
        int completion_tokens
        numeric total_cost
        int latency_ms
        datetime created_at
    }

    QUESTION_EXPLANATIONS {
        int id PK
        int question_id FK
        string wrong_option
        text explanation_text
        int times_used
        datetime created_at
    }

    STUDY_SESSIONS {
        int id PK
        int user_id FK
        string source
        datetime started_at
        datetime ended_at
        json meta
    }

    USER_PROGRESS {
        int id PK
        int user_id FK
        int topic_id FK
        int accuracy
        int streak
        int total_answered
        int total_correct
        datetime last_activity_at
        datetime updated_at
    }

    USER_ENTITLEMENTS {
        int id PK
        int user_id FK
        string plan
        datetime starts_at
        datetime ends_at
        bool is_active
        json meta
    }

    PAYMENTS {
        int id PK
        int user_id FK
        string buy_order UK
        string token_ws
        int amount
        string plan
        string status
        json transbank_response
        datetime created_at
        datetime updated_at
        datetime authorized_at
    }

    EXAMS ||--o{ SUBJECTS : has
    SUBJECTS ||--o{ TOPICS : has
    TOPICS ||--o{ QUESTIONS : has
    QUESTIONS ||--o{ QUESTION_CHOICES : has

    EXAMS ||--o{ EXAM_QUESTIONS : maps
    QUESTIONS ||--o{ EXAM_QUESTIONS : maps

    USERS ||--o{ ATTEMPTS : makes
    EXAMS ||--o{ ATTEMPTS : in
    SUBJECTS ||--o{ ATTEMPTS : scoped_to
    TOPICS o|--o{ ATTEMPTS : optional_scope

    ATTEMPTS ||--o{ ATTEMPT_FEEDBACK : contains
    QUESTIONS ||--o{ ATTEMPT_FEEDBACK : on_question
    QUESTION_CHOICES o|--o{ ATTEMPT_FEEDBACK : selected_choice

    USERS ||--o{ CHAT_MESSAGES : sends
    ATTEMPTS ||--o{ CHAT_MESSAGES : within

    USERS ||--o{ AI_USAGE_LOGS : logs
    QUESTIONS ||--o{ QUESTION_EXPLANATIONS : has_cache

    USERS ||--o{ STUDY_SESSIONS : starts
    USERS ||--o{ USER_PROGRESS : tracks
    TOPICS ||--o{ USER_PROGRESS : by_topic

    USERS ||--o{ USER_ENTITLEMENTS : owns
    USERS ||--o{ PAYMENTS : pays
```

## Criterios de validación
- El diagrama debe renderizar correctamente en GitHub y visores Mermaid.
- Las entidades y relaciones deben corresponder al esquema definido en backend.
- Debe existir una única fuente compartible para el ERD en la carpeta DOCS.

## Referencias relacionadas
- `tutorpaes/backend/app/db/models.py`
- `DOCS/ARQUITECTURA_Y_ROADMAP_PRODUCCION.md`
