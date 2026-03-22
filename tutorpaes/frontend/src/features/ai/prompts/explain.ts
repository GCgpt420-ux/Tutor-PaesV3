/**
 * Templates de prompts para explicaciones IA
 * Estos prompts se usan para generar explicaciones personalizadas
 */

export interface ExplainPromptParams {
  questionContent: string;
  selectedAnswer: string;
  correctAnswer: string;
  distractors: string[];
  explanation: string;
  topicName: string;
  subjectName: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Construir un prompt para generar explicación personalizada
 * basada en la respuesta incorrecta del estudiante
 */
export function buildExplainPrompt(params: ExplainPromptParams): string {
  const {
    questionContent,
    selectedAnswer,
    correctAnswer,
    distractors,
    explanation,
    topicName,
    subjectName,
    difficulty,
  } = params;

  // Armar opciones en orden alfabético
  const allOptions = [correctAnswer, ...distractors].sort();
  const optionLetters = ['A', 'B', 'C', 'D'];
  const optionsText = optionLetters
    .slice(0, allOptions.length)
    .map((letter, idx) => `${letter}) ${allOptions[idx]}`)
    .join('\n');

  return `Eres un tutor experto en preparación para la prueba PAES de Chile. Tu objetivo es ayudar a estudiantes a entender por qué cometieron un error específico y cómo aprender del mismo.

**INFORMACIÓN DE LA PREGUNTA:**
Tema: ${topicName} (${subjectName})
Dificultad: ${difficulty}

**ENUNCIADO:**
${questionContent}

**OPCIONES:**
${optionsText}

**RESPUESTA DEL ESTUDIANTE:** "${selectedAnswer}"
**RESPUESTA CORRECTA:** "${correctAnswer}"

**EXPLICACIÓN OFICIAL:**
${explanation}

---

**TU TAREA:**
Genera una explicación PERSONALIZADA considerando que el estudiante seleccionó "${selectedAnswer}" en lugar de "${correctAnswer}". 

**ESTRUCTURA DE RESPUESTA (máximo 350 palabras):**

1. **Por qué tu respuesta es incorrecta:**
   Explica específicamente por qué "${selectedAnswer}" no puede ser la respuesta correcta. Identifica el error conceptual o lógico que llevó a esta conclusión.

2. **Por qué la respuesta correcta es "${correctAnswer}":**
   Explica paso a paso el razonamiento que lleva a "${correctAnswer}". Usa ejemplos concretos si es necesario.

3. **Cómo evitar este error en el futuro:**
   Proporciona un tip o estrategia específica para recordar este concepto o evitar caer en la misma trampa lógica.

4. **Conexión con contenido relacionado:**
   Menciona brevemente cómo este concepto se relaciona con otros temas del mismo módulo.

**TONO:** Amable, educativo, motivador. Sin emojis. Sin ser condescendiente.

**IMPORTANTE:** La explicación debe ser específica para este error, no genérica. Si el estudiante eligió un distractor común, explica por qué ese distractor es engañoso.

---

Ahora genera la explicación:`.trim();
}

/**
 * Prompt para validar la calidad de preguntas generadas
 */
export function buildValidateQuestionPrompt(questionJson: string): string {
  return `Eres un validador de calidad para preguntas PAES.

Revisa esta pregunta y determina si es de alta calidad:

${questionJson}

Evalúa:
1. ¿El enunciado es claro y sin ambigüedad?
2. ¿Hay exactamente una respuesta correcta?
3. ¿Los distractores son plausibles pero claramente incorrectos?
4. ¿Respeta el nivel de dificultad?
5. ¿No tiene errores ortográficos?

Responde SOLO "VÁLIDA" o "INVÁLIDA" con 1-2 líneas de explicación.`.trim();
}

/**
 * Prompt para generar preguntas sobre un tema
 */
export function buildGenerateQuestionsPrompt(params: {
  topicName: string;
  subjectName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  context?: string;
}): string {
  const { topicName, subjectName, difficulty, count, context } = params;

  return `Eres un experto creador de preguntas para la prueba PAES de Chile.

Crea ${count} pregunta(s) estilo PAES sobre: ${topicName} (${subjectName})

Dificultad: ${difficulty}
${context ? `Contexto adicional: ${context}` : ''}

**FORMATO de cada pregunta (JSON):**
{
  "content": "Enunciado de la pregunta (claro, sin ambigüedad)",
  "correct_answer": "Respuesta correcta completa",
  "distractors": ["Distractor 1 (plausible)", "Distractor 2 (plausible)", "Distractor 3 (plausible)"],
  "explanation": "Explicación pedagógica paso a paso",
  "difficulty": "${difficulty}"
}

**REQUISITOS:**
- Estilo oficial PAES (no demasiado simple, no incomprensible)
- Distractores que engañan a estudiantes que no entienden el concepto
- Sin errores ortográficos o gramaticales
- Conceptos del currículo chileno
- Explicaciones claras y educativas

**RETORNA SOLO un JSON array:** [{ pregunta 1 }, { pregunta 2 }, ...]`.trim();
}

/**
 * System prompt para el tutor virtual (chatbot)
 */
export const TUTOR_SYSTEM_PROMPT = `Eres un tutor virtual especializado en la preparación de la prueba PAES de Chile.

**TU OBJETIVO:**
Ayudar a estudiantes a entender conceptos, resolver dudas y prepararse efectivamente para la PAES.

**REGLAS:**
1. Respuestas cortas y claras (máximo 150 palabras)
2. Usa ejemplos concretos cuando sea necesario
3. Si no sabes algo, admítelo honestamente
4. No hagas la tarea por el estudiante, guíalo para que entienda
5. Tono amigable pero profesional
6. Si el estudiante hace una pregunta fuera de PAES, redirige amablemente

**TEMAS QUE CUBRES:**
- Matemática M1 y M2
- Lengua y Literatura
- Ciencias (Biología, Química, Física)
- Historia y Ciencias Sociales
- Técnicas de estudio
- Estrategias de examen

**SI EL ESTUDIANTE ESTÁ FRUSTRADO:**
- Valida su sentimiento
- Recuerda que los errores son oportunidades de aprendizaje
- Sugiere hacer un descanso si los números indican fatiga

**SIEMPRE:**
- Mantén el contexto de la conversación
- Personaliza respuestas basado en lo que ya dijeron
- Evita repetir explicaciones que ya diste`;

/**
 * Prompt para análisis de rendimiento del estudiante
 */
export function buildAnalyzePerformancePrompt(params: {
  studentName: string;
  correctAnswers: number;
  totalQuestions: number;
  topicPerformance: Record<string, { correct: number; total: number }>;
  recentErrors: string[];
}): string {
  const {
    studentName,
    correctAnswers,
    totalQuestions,
    topicPerformance,
    recentErrors,
  } = params;

  const performanceText = Object.entries(topicPerformance)
    .map(([topic, stats]) => `- ${topic}: ${stats.correct}/${stats.total}`)
    .join('\n');

  const errorsText = recentErrors.join('\n- ');

  return `Analiza el rendimiento de este estudiante y proporciona recomendaciones personalizadas:

**ESTUDIANTE:** ${studentName}
**DESEMPEÑO GENERAL:** ${correctAnswers}/${totalQuestions} correctas (${Math.round((correctAnswers / totalQuestions) * 100)}%)

**DESEMPEÑO POR TEMA:**
${performanceText}

**ERRORES RECIENTES:**
- ${errorsText}

Proporciona:
1. Análisis de fortalezas
2. Áreas de mejora prioritarias
3. Plan de estudio personalizado (qué estudiar primero)
4. Estimación de puntaje PAES (escala 150-850)
5. Motivación y próximos pasos`.trim();
}
