import { useState } from 'react';

interface RequestAiExplanationParams {
  questionId: string;
  selectedAnswer: string;
  attemptId: string;
  timeoutMs?: number;
}

export function useAiExplanation() {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestExplanation({
    questionId,
    selectedAnswer,
    attemptId,
    timeoutMs = 35000,
  }: RequestAiExplanationParams) {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: Number(questionId),
          selectedAnswer,
          attemptId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        setError('Alcanzaste el limite diario de explicaciones. Upgrade a Premium para ilimitadas.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to generate explanation');
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      // Initialize reader for SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      // Ensure explanation starts clean
      setExplanation('');

      let sseBuffer = '';
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          // Acumular el chunk en el buffer antes de dividir por eventos SSE.
          // Evita que un evento partido entre dos chunks de red se pierda.
          sseBuffer += decoder.decode(value, { stream: true });
          const events = sseBuffer.split('\n\n');
          sseBuffer = events.pop() ?? '';
          for (const event of events) {
            if (event.startsWith('data: ')) {
              const dataStr = event.slice(6);
              if (dataStr.trim() === '[DONE]') {
                done = true;
                break;
              }
              // Anexar reactivamente lo que llega de OpenAI
              setExplanation((prev) => (prev ? prev + dataStr : dataStr));
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('El Tutor IA tardo demasiado (35s). Intenta otra vez o continua con la siguiente pregunta.');
      } else {
        setError('Error generando explicacion. Intenta de nuevo.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return {
    loading,
    explanation,
    error,
    requestExplanation,
  };
}