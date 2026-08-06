# Guía Técnica de Arquitectura, Estudio de Costos (50 Alumnos) y Roadmap de IA Matemática

Hola Gabriel. Este documento está estructurado específicamente para ti como **desarrollador único** del proyecto. Su objetivo es doble:
1. Servir como tu manual de estudio personal para que comprendas a la perfección el flujo de la aplicación y puedas explicárselo de manera clara y profesional a tu **Jefe de Carrera**.
2. Entregar la estimación de costos precisa para la prueba piloto de **50 alumnos durante los 30 días de agosto**, detallando cómo funciona el cobro de Railway y cómo migrar a un modelo de IA local de matemáticas en el futuro.

---

## 1. Guía de Lectura para Explicar a tu Jefe de Carrera

Cuando presentes el proyecto a tu Jefe de Carrera, es recomendable que estructures la explicación siguiendo la separación de capas del sistema. Aquí tienes el guion de cómo funciona y por qué elegiste cada tecnología:

### 1.1 El Flujo General (Monorepo Full-Stack)
TutorPAES v2 es un sistema desacoplado. El **Frontend** corre en el navegador del usuario y se encarga exclusivamente de la experiencia visual. El **Backend** corre en un servidor seguro y controla la base de datos, la lógica del negocio, las finanzas y las llamadas de Inteligencia Artificial.
*   **¿Cómo se comunican?** Mediante peticiones HTTP REST. Cuando el frontend necesita datos (por ejemplo, cargar un quiz), le pide al backend un canal seguro enviando un token de sesión (JWT).

### 1.2 Capa 1: Frontend (Next.js 16)
*   **¿Para qué sirve?** Es la cara visible del software. Controla el temporizador de los quizzes, el renderizado de fórmulas matemáticas y las pantallas donde el alumno ve su progreso.
*   **¿Cómo está hecho?** En Next.js 16 usando el nuevo paradigma **App Router**. Los componentes visuales se construyen con **TailwindCSS** y **Shadcn UI** (lo que asegura que el diseño sea premium y accesible para personas con lectores de pantalla).
*   **¿Por qué Next.js y no React puro?**
    1.  **Seguridad de Tokens:** Next.js permite crear una capa intermedia (un "proxy" en `tutorpaes/frontend/proxy.ts`). Gracias a esto, los tokens JWT se almacenan en cookies seguras (`HttpOnly` y `Secure`), impidiendo que scripts maliciosos de terceros en el navegador puedan robar la sesión del usuario (vulnerabilidad XSS).
    2.  **Velocidad de carga (SSR):** Las páginas públicas se renderizan en el servidor, de modo que el sitio carga de forma instantánea.

### 1.3 Capa 2: Backend (FastAPI)
*   **¿Para qué sirve?** Procesa las respuestas de los estudiantes, calcula si están correctas, genera estadísticas de progreso, gestiona los tokens de pago y controla el flujo de IA.
*   **¿Cómo está hecho?** En **FastAPI** (Python 3.11). Toda la base de datos se maneja a través de un mapeador de datos (ORM) llamado **SQLAlchemy 2.0**, y los cambios estructurales en las tablas se versionan con **Alembic**.
*   **¿Por qué FastAPI?**
    1.  **Rendimiento:** Está basado en tecnologías asíncronas (`async/await`), lo que le permite manejar miles de peticiones simultáneas con un consumo mínimo de memoria (ideal para correr en servidores pequeños de bajo costo).
    2.  **Autodocumentación:** FastAPI genera automáticamente el mapa de la API (Swagger UI en `/docs`), lo que permite probar los endpoints de forma interactiva y documentar el backend sin trabajo extra.

### 1.4 Capa 3: Base de Datos (PostgreSQL 16)
*   **¿Para qué sirve?** Almacena el catálogo de preguntas matemáticas, los intentos de los alumnos y las respuestas que seleccionan.
*   **¿Cómo está hecha?** Es una base relacional de 15 tablas.
*   **¿Por qué PostgreSQL?** Es el estándar de la industria. Su robustez transaccional (ACID) garantiza que los datos nunca se corrompan (crítico para flujos como Transbank, donde no podemos permitir que un usuario pague y la base de datos falle al guardar su activación).

### 1.5 Capa 4: Motor de IA Resiliente
*   **¿Para qué sirve?** Genera retroalimentación socrática y personalizada para guiar al estudiante a resolver su error matemático, sin darle la respuesta de inmediato.
*   **¿Cómo está hecho?** El código está modularizado en `llm_provider_service.py`. Admite OpenAI, Groq y Cerebras. Cuenta con un sistema de **Circuit Breaker** (cortacircuitos) y reintentos automáticos. Si OpenAI falla, el backend redirige la petición a Groq o Cerebras en milisegundos sin que el alumno note el corte.
*   **¿Por qué en Backend y no en Frontend?** Si llamáramos a OpenAI directamente desde Next.js en el navegador, cualquier estudiante podría inspeccionar el código de la página, robar tu `OPENAI_API_KEY` y usar tu saldo de crédito. Al llamarlo desde FastAPI, la clave está oculta en las variables de entorno del servidor.

---

## 2. Estudio de Costos para 50 Alumnos en Agosto (30 Días)

A continuación, detallamos la estimación de costos reales asumiendo un uso intensivo por parte de **50 alumnos**.

### 2.1 Supuestos de Consumo para Agosto
1.  **Días de uso:** Cada uno de los 50 alumnos realiza prácticas durante **20 días** del mes.
2.  **Preguntas por día:** Cada alumno responde **15 preguntas** por sesión (1 quiz diario).
3.  **Total de preguntas respondidas:** 50 alumnos × 20 días × 15 preguntas = **15.000 preguntas procesadas en agosto**.
4.  **Tasa de precisión promedio (Accuracy):** 60% correctas / 40% incorrectas.
    *   **Preguntas correctas (60% = 9.000):** Se resuelven con el **sistema de reglas locales** (`ai_service.py` - no consumen llamadas de IA).
    *   **Preguntas incorrectas (40% = 6.000):** Llaman al LLM para generar una explicación interactiva o pista (hint).

---

### 2.2 Costos Detallados de API Keys (IA y Voz)

#### A. Costo del LLM (Procesamiento de Explicaciones)
*   **Promedio por pregunta:** 500 tokens de entrada (enunciado + alternativas + nivel del alumno) y 250 tokens de salida (explicación socrática paso a paso). Total = **750 tokens por llamada**.
*   **Volumen mensual de llamadas:** 6.000 llamadas a la IA.
*   **Tokens totales:** 3M de entrada / 1.5M de salida.

| Modelo de IA | Costo de Entrada (por 1M) | Costo de Salida (por 1M) | Costo Total para 50 Alumnos |
| :--- | :--- | :--- | :--- |
| **OpenAI GPT-4o-mini** | $0.15 USD | $0.60 USD | **$1.35 USD** (~$1.250 CLP) |
| **OpenAI GPT-3.5-turbo** | $0.50 USD | $1.50 USD | **$3.75 USD** (~$3.500 CLP) |
| **Groq (Llama-3.1-70b)** | Capa Gratuita | Capa Gratuita | **$0.00 USD** |
| **Cerebras (Llama-3.1-70b)** | Capa Gratuita | Capa Gratuita | **$0.00 USD** |

> [!TIP]
> **Recomendación:** Configura `gpt-4o-mini` como tu modelo predeterminado de OpenAI. Es un 70% más económico que GPT-3.5 y tiene un razonamiento matemático infinitamente superior.

#### B. Costo del Sintetizador de Voz (Audio)
*   **Web Speech API (Nativo en Navegador):** **$0.00 USD**. Al correr en el cliente usando los motores de voz del sistema operativo (Google/Apple), el costo es cero y la latencia es nula.
*   **ElevenLabs (Opcional):** El plan gratuito ofrece 10.000 caracteres al mes. Generar voz para 15.000 respuestas superaría con creces este límite, requiriendo un plan mensual de más de $22 USD.
*   **Recomendación:** Mantener la **Web Speech API** activa por defecto para el piloto de 50 alumnos.

---

### 2.3 Análisis de Infraestructura (Vercel y Railway)

#### Vercel (Frontend Next.js)
*   **Tu estado actual:** Ya pagaste los **$20.00 USD** de la suscripción Pro.
*   **Análisis de carga:** El plan Pro te da 1 TB de transferencia de datos mensuales. 50 alumnos haciendo quizzes generarán menos de 5 GB de transferencia. **No tendrás ningún cargo adicional en Vercel.**

#### Railway (Backend FastAPI y PostgreSQL)
*   **Tu estado actual:** Pagas **$5.00 USD mensuales** de suscripción (Plan Hobby).
*   **¿Cómo funciona el cobro en Railway?**
    El plan Hobby de $5 te otorga **$5.00 USD en créditos de uso** de manera mensual. Railway te cobra por segundo exacto según los recursos de hardware que utilices. Si tus servicios están encendidos 24/7 sin límites, consumirán créditos continuamente aunque no tengan interacciones (ya que Railway por defecto no escala a cero en el plan Hobby).
*   **Cálculo de Consumo 24/7 para Agosto:**
    1.  **FastAPI (Server Backend):** Configurado a 0.25 vCPU ($5.00/mes) + 512 MB RAM ($5.00/mes) = **$10.00 USD**.
    2.  **PostgreSQL (Base de Datos):** Configurado a 0.25 vCPU ($5.00/mes) + 512 MB RAM ($5.00/mes) + 5 GB almacenamiento ($0.75/mes) = **$10.75 USD**.
    3.  **Consumo bruto total:** $20.75 USD.
    4.  **Descuento de tus créditos incluidos:** $20.75 - $5.00 = **$15.75 USD de sobre cargo**.
    5.  **Cobro total final en tu tarjeta:** $5.00 (suscripción) + $15.75 (sobrante) = **$20.75 USD** (~$19.500 CLP).

#### ¿Cómo monitorear y optimizar esto en Railway?
1.  **Pestaña de Métricas:** Entra a tu proyecto en Railway y haz clic en cada servicio. En la pestaña **Metrics** verás gráficos en tiempo real de uso de CPU y RAM. Si ves que el backend consume constantemente menos de 150 MB de RAM y el CPU está al 1%, puedes ir a los ajustes del servicio y reducir los límites (ej. a 0.1 vCPU y 256 MB RAM) para bajar el costo a la mitad.
2.  **Pestaña de Facturación:** En tu configuración de cuenta en Railway, ve a **Billing**. Ahí verás una proyección exacta de cuánto vas a gastar al final del ciclo de facturación y cuántos créditos te quedan.
3.  **Configurar Alertas:** En la misma pestaña de Billing, activa el **Usage Limit** en $25 USD. Esto garantiza que si hay un bucle infinito en tu código o un ataque de peticiones, los servidores se apagarán antes de que te cobren de más en tu tarjeta de crédito.

---

### 2.4 Resumen del Presupuesto Final para Agosto (50 Alumnos)

| Concepto | Costo Fijo (USD) | Costo por Uso Estimado (USD) | Total Estimado (USD) |
| :--- | :--- | :--- | :--- |
| **Vercel Pro (Suscripción)** | $20.00 | $0.00 | $20.00 |
| **Railway (Backend + DB 24/7)** | $5.00 | $15.75 | $20.75 |
| **OpenAI GPT-4o-mini** | $0.00 | $1.35 | $1.35 |
| **Voz (Web Speech API)** | $0.00 | $0.00 | $0.00 |
| **Dominio `.cl` (Prorrateado)** | $1.00 | $0.00 | $1.00 |
| **Total Mensual** | **$26.00 USD** | **$17.10 USD** | **$43.10 USD** (~$40.000 CLP) |

---

## 3. Hoja de Ruta: Refinamiento de IA y Futuro LLM Local Matemático

Dado que el foco académico y las pruebas piloto de la universidad se centrarán exclusivamente en **Matemáticas**, debemos estructurar cómo refinar el motor actual y cómo migrar a un modelo open-source local.

### 3.1 Refinamiento del Prompt Matemático Actual
Para que las explicaciones socráticas de matemáticas sean impecables:
1.  **Forzar Formato LaTeX:** Asegurar que el LLM devuelva las fórmulas en formato LaTeX (encapsulado entre `$` o `$$`) para que el frontend (usando KaTeX o MathJax) las renderice de forma nativa con tipografía matemática premium.
2.  **Modificar el Prompt de `openai_service.py`:** Ajustar el prompt del sistema para que la IA actúe explícitamente como evaluadora del razonamiento algebraico del alumno. Debes guiarla a:
    *   Identificar en qué paso del cálculo se equivocó el alumno (ej. error de signos, mal despeje de la ecuación).
    *   No revelar la resolución final, sino proponer un ejercicio simplificado análogo para que el alumno entienda el método.

---

### 3.2 Planificación del LLM Local de Matemáticas

Para eliminar la dependencia de OpenAI y procesar todo de forma gratuita y local en la universidad, la arquitectura de TutorPAES ya está preparada.

#### A. Modelos de Matemáticas Recomendados (Open Source)
*   **Qwen2.5-Math-7B-Instruct:** Actualmente es el mejor modelo de código abierto de tamaño intermedio especializado en matemáticas. Supera a modelos mucho más grandes en razonamiento y resolución algebraica.
*   **DeepSeek-Math-7B-Instruct:** Altamente eficiente en la resolución de problemas lógicos y aritméticos complejos.

#### B. Infraestructura Requerida para Servir el Modelo Local
Para correr un modelo de 7 billones de parámetros de manera fluida (generando texto a una velocidad aceptable para un alumno), la universidad debe facilitar una estación de trabajo o servidor con:
*   **Tarjeta Gráfica (GPU):** Mínimo una GPU NVIDIA con **16 GB de VRAM** (ej. NVIDIA RTX 4060 Ti 16GB, RTX 3090, o RTX 4090).
*   **Alternativa Apple Silicon:** Un Mac con chip M2/M3 Pro o Max y 32 GB de memoria unificada.

#### C. Cómo Servir el Modelo (Ollama o vLLM)
La forma más robusta es instalar **Ollama** en el servidor de la universidad y descargar el modelo:
```bash
ollama run qwen2.5-math:7b-instruct
```
Ollama expondrá una API local en el puerto `11434`. Lo mejor es que la API de Ollama es **100% compatible con el formato de OpenAI**.

#### D. Cómo Integrar el LLM Local en tu Código de TutorPAES
Gracias a la estructura de tu código en `llm_provider_service.py`, agregar este nuevo proveedor local tomará menos de 10 líneas de código.

```python
# Solo tendrías que añadir un nuevo proveedor en app/services/llm_provider_service.py:

class LocalMathLLMProvider(LLMProvider):
    """Proveedor local de matemáticas corriendo en servidor de la universidad"""
    name = "local_math"
    
    def __init__(self):
        from openai import OpenAI
        # Apuntamos el cliente estándar al endpoint de Ollama en la red local
        self.client = OpenAI(
            base_url="http://192.168.1.XX:11434/v1",  # IP del servidor de la universidad
            api_key="ollama"  # Ollama no requiere clave real
        )
        
    def stream_completion(self, system_prompt, user_message, **kwargs):
        # Mismo código que OpenAIProvider, pero apuntando a 'qwen2.5-math:7b-instruct'
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_message}]
        stream = self.client.chat.completions.create(
            model="qwen2.5-math:7b-instruct",
            messages=messages,
            stream=True
        )
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
```

Esto te permitirá desconectar completamente las llamadas a APIs de pago de cara a la versión final de tu tesis y desarrollo universitario.
