# Sistema de Personalización de IA - TutorPAES

## Resumen General

El sistema de IA de TutorPAES ahora genera respuestas **completamente personalizadas** según el perfil académico del usuario. Esto mejora significativamente la efectividad del aprendizaje adaptativo.

---

## Características Principales

### 1. **Análisis del Perfil del Usuario**

El sistema analiza automáticamente:

- **Nivel General del Usuario**: `principiante` | `intermedio` | `avanzado`
  - Basado en la precisión promedio en las últimas 4 semanas
  - `principiante`: < 50% de accuracy
  - `intermedio`: 50% - 75% de accuracy
  - `avanzado`: ≥ 75% de accuracy

- **Desempeño por Tema**: Accuracy individual para cada tema
  - Álgebra (ALG)
  - Geometría (GEO)
  - Lectura Comprensiva (LECT)
  - Ciencias (CIEN)
  - Historia (HIST)
  - Y más...

- **Temas Débiles**: Nuevos patrones de error (threshold: 60% accuracy)
  - El sistema identifica automáticamente dónde el usuario tiene dificultad
  - Activa hints especiales y motivación extra

- **Historial de Errores**: Patrones de opciones incorrectas seleccionadas
  - Ayuda a generar explicaciones más targeted

---

## Generación Personalizada de Feedback

### Respuestas Correctas

El sistema varía los mensajes de felicitación según el nivel del usuario:

**Usuario PRINCIPIANTE:**
```
 ¡Excelente! Respuesta correcta. Vas mejorando.
 ¡Correcto! Así se aprende paso a paso.
 ¡Perfecto! Sigue practicando, vas bien.
```

**Usuario INTERMEDIO:**
```
 ¡Muy bien! Demostraste dominar este concepto.
 ¡Excelente! Tu comprensión va en aumento.
 ¡Correcto! Mantén este ritmo de aprendizaje.
```

**Usuario AVANZADO:**
```
 ¡Perfecto! Excelente precisión.
 ¡Súper! Dominas este contenido completamente.
 ¡Exacto! Un acierto más en tu camino.
```

---

### Respuestas Incorrectas

El sistema genera hints personalizados:

**Sistema de Intensidad del Hint:**
- **Principiante**: Hints muy detallados, paso a paso
- **Intermedio**: Hints moderados, con conceptos clave
- **Avanzado**: Hints sutiles, con referencias a conceptos relacionados

**Detección de Tema Débil:**
```
 Tema recurrente para ti: [CONSEJO]. Practica más en este tópico.
```

**Ejemplo completo:**
```
Respuesta incorrecta.  En Álgebra, enfócate en las propiedades 
de las operaciones. Intenta substituir valores específicos para verificar.

Respuesta correcta: B. x = 5
```

---

## Arquitectura Técnica

### Componentes Clave

#### 1. **Backend: `app/services/ai_service.py`**

**Funciones de Profiling:**
- `_get_user_performance_by_topic()`: Obtiene accuracy por tema
- `_get_user_weak_topics()`: Identifica temas con bajo desempeño
- `_get_user_overall_level()`: Calcula nivel general
- `_get_common_wrong_options()`: Analiza patrones de error

**Funciones de Generación:**
- `_build_personalized_hint()`: Genera hints contextualizados
- `generate_feedback_phase1()`: Feedback adaptativo por nivel

#### 2. **Endpoints Principales**

**POST `/api/v1/ai/explain`** - Explicación de Pregunta
```python
Request:
  {
    "question_id": 123
  }

Response:
  {
    "explanation": "Explicación personalizada...",
    "question_content": "¿Cuál es...?",
    "correct_answer": "La respuesta correcta es...",
    "metadata": {
      "model": "personalized_rule_based",
      "user_level": "intermedio",
      "topic": "Álgebra"
    }
  }
```

**GET `/api/v1/ai/feedback/{feedback_id}`** - Feedback de Intento
- Retorna feedback personalizado para un intento específico
- Consulta automáticamente el perfil del usuario
- Aplica hints contextualizados

---

## Personalización Aplicada

### Escenarios de Uso

#### Escenario 1: Usuario Principiante con Tema Débil
```
Usuario: 32% accuracy en Geometría
Acción: 
- Feedback muy positivo en respuestas correctas 
- Hints DETALLADOS en respuestas incorrectas
- Identificación: " Tema recurrente para ti"
```

#### Escenario 2: Usuario Avanzado
```
Usuario: 85% accuracy general
Acción:
- Feedback breve y conciso
- Hints motivadores
- Énfasis en precisión y excelencia
```

#### Escenario 3: Usuario en Mejora
```
Usuario: Pasó de 45% a 62% en últimas 2 semanas
Acción:
- Mensajes motivadores: "Tu comprensión va en aumento "
- Reconocimiento del progreso
```

---

## Roadmap: Próximas Mejoras

### Fase 2: LLM Integration (Próximas 2-4 semanas)
```python
# Pseudo-código del futuro
from openai import OpenAI

def generate_llm_explanation(
    question: Question,
    user_profile: UserProfile,
    selected_choice: QuestionChoice
) -> str:
    prompt = f"""
    Eres un tutor personalizado para estudiantes de PSU/PAES.
    
    Nivel del estudiante: {user_profile.level}
    Temas débiles: {user_profile.weak_topics}
    Desempeño promedio: {user_profile.accuracy}%
    
    La pregunta fue: {question.prompt}
    El estudiante seleccionó: {selected_choice.text}
    La respuesta correcta es: [...]
    
    Genera una explicación concisa, motivadora y contextualizada
    para ayudar al estudiante a comprender.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content
```

### Fase 3: Adaptive Learning Paths
- Recomendaciones de temas a practicar
- Secuencia inteligente de dificultad
- Predictions de desempeño futuro

### Fase 4: Social Learning
- Comparación anónima de desempeño
- Grupos de estudio recomendados
- Tendencias de temas más difíciles

---

## Integración con Frontend

### Cambios en UI

El componente `AiExplanation.tsx` ahora:
1. Recibe feedback personalizado del backend
2. Muestra metadata del usuario (`user_level`)
3. Aplica estilos según el nivel del usuario
4. Muestra emojis contextuales

```tsx
const { explanation, metadata } = response.json();

if (metadata.user_level === 'principiante') {
  // Mostrar explicación con más detalle
  // Layout más espacioso
} else if (metadata.user_level === 'avanzado') {
  // Mostrar versión más concisa
  // Énfasis en precisión
}
```

---

## Configuración y Deployment

### Variables de Entorno
```env
# En .env backend
AI_PERSONALIZATION_ENABLED=true
AI_LLM_PROVIDER=openai  # future: openai|anthropic|gemini
AI_LLM_MODEL=gpt-4      # para cuando usemos LLM
OPENAI_API_KEY=sk-...   # cuando integremos OpenAI
```

### Performance
- **Caché de Perfil**: Refresca cada 1 hora (configurable)
- **Query Optimization**: Índices en user_id, topic_id, created_at
- **Fallback**: Si el análisis falla, usa feedback genérico

---

## Testing

### Test Cases Incluidos

```python
# test_ai_personalization.py

def test_user_level_calculation():
    """Verifica que el nivel del usuario se calcula correctamente"""
    level, accuracy = _get_user_overall_level(user, db)
    assert level in ['principiante', 'intermedio', 'avanzado']

def test_weak_topics_detection():
    """Verifica que se detectan los temas débiles"""
    weak = _get_user_weak_topics(user, db)
    for topic in weak:
        assert topic in expected_weak_topics

def test_personalized_feedback():
    """Verifica que el feedback es diferente por nivel"""
    fb_advanced = generate_feedback_phase1(feedback, db, user_advanced)
    fb_beginner = generate_feedback_phase1(feedback, db, user_beginner)
    assert fb_advanced["explanation"] != fb_beginner["explanation"]
```

---

## Métricas de Éxito

### KPIs Recomendados
1. **Engagement**: Usuarios que usan explicaciones de IA (% diario)
2. **Learning Outcome**: Mejora en accuracy tras usar feedback (delta %)
3. **Retention**: % de users que retornan luego de usar IA
4. **Satisfaction**: NPS sobre explicaciones personalizadas

---

## FAQ

**P: ¿Cómo inicio la personalización si el usuario es nuevo?**
R: El sistema comienza en `"principiante"` con feedback muy positivo. Conforme obtiene datos, mejora la personalización.

**P: ¿Cada cuánto se actualiza el perfil del usuario?**
R: Se recalcula on-demand. Para optimización, caché por 1 hora entre recálculos.

**P: ¿Qué pasa si OpenAI no está disponible?**
R: Fallback automático a sistema de reglas personalizado (es robusto).

**P: ¿Puedo editar los templates de hints?**
R: Sí, están en `_build_personalized_hint()` de `ai_service.py`. Cambia los diccionarios `topic_hints`.

---

## Referencias

- Sistema: `backend/app/services/ai_service.py`
- Endpoints: `backend/app/api/v1/endpoints/ai.py`
- Frontend: `frontend/src/features/exams/components/AiExplanation.tsx`
- Modelo: `backend/app/db/models.py` (User, Attempt, etc.)

