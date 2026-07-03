import { useState, useCallback, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseAiTutorReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (text: string, attemptId?: string, questionContext?: Record<string, unknown>) => Promise<void>;
  cancelMessage: () => void;
  addAssistantMessage: (text: string) => void;
  setExternalLoading: (loading: boolean) => void;
  resetChat: () => void;
}

export function useAiTutor(): UseAiTutorReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Guardar referencia al AbortController activo
  const activeControllerRef = useRef<AbortController | null>(null);

  const addAssistantMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
  }, []);

  const setExternalLoading = useCallback((val: boolean) => {
    setLoading(val);
  }, []);

  // Función para cancelar explícitamente el stream activo
  const cancelMessage = useCallback(() => {
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
      activeControllerRef.current = null;
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (text: string, attemptId?: string, questionContext?: Record<string, unknown>) => {
    if (!text.trim()) return;

    // Abortar cualquier petición en curso antes de enviar una nueva
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }

    setLoading(true);
    setError(null);

    // Optimísticamente añadir mensaje del usuario
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);

    const controller = new AbortController();
    activeControllerRef.current = controller;

    try {
      const response = await fetch('/api/backend/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          attempt_id: attemptId ? Number(attemptId) : null,
          question_context: questionContext ?? null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Hubo un error al conectar con el Tutor IA.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error('No se pudo inicializar el lector de stream.');

      let assistantResponse = '';
      let sseBuffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop() ?? '';

        for (const event of events) {
          if (event.startsWith('data: ')) {
            const dataStr = event.slice(6);
            if (dataStr === '[DONE]') break;
            
            assistantResponse += dataStr;

            setMessages((prev) => {
              if (activeControllerRef.current !== controller) {
                return prev;
              }
              const next = [...prev];
              const last = next[next.length - 1];

              if (!last || last.role !== 'assistant') {
                next.push({ role: 'assistant', content: assistantResponse });
                return next;
              }

              next[next.length - 1] = { role: 'assistant', content: assistantResponse };
              return next;
            });
          }
        }
      }

    } catch (err) {
      const isSuperseded = activeControllerRef.current !== controller && activeControllerRef.current !== null;
      if (!isSuperseded) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Generación cancelada.');
        } else {
          setError(err instanceof Error ? err.message : 'Error desconocido');
        }
      }
    } finally {
      const isSuperseded = activeControllerRef.current !== controller && activeControllerRef.current !== null;
      if (!isSuperseded) {
        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null;
        }
        setLoading(false);
      }
    }
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Cancelar la petición pendiente si el componente del chat se desmonta
  useEffect(() => {
    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    cancelMessage,
    addAssistantMessage,
    setExternalLoading,
    resetChat,
  };
}
