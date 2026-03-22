import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseAiTutorReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (text: string, attemptId?: string) => Promise<void>;
  addAssistantMessage: (text: string) => void;
  setExternalLoading: (loading: boolean) => void;
  resetChat: () => void;
}

export function useAiTutor(): UseAiTutorReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAssistantMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
  }, []);

  const setExternalLoading = useCallback((val: boolean) => {
    setLoading(val);
  }, []);

  const sendMessage = useCallback(async (text: string, attemptId?: string) => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    // Optimísticamente añadir mensaje del usuario
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Aquí deberías añadir el token de Auth si es necesario, 
          // dependiendo de cómo manejes get_current_user
        },
        body: JSON.stringify({
          message: text,
          attempt_id: attemptId ? Number(attemptId) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Hubo un error al conectar con el Tutor IA.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error('No se pudo inicializar el lector de stream.');

      // Añadir mensaje del asistente vacío para ir llenándolo
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      let assistantResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const events = chunk.split('\n\n');

        for (const event of events) {
          if (event.startsWith('data: ')) {
            const dataStr = event.slice(6);
            if (dataStr === '[DONE]') break;
            
            assistantResponse += dataStr;
            
            // Actualizar el último mensaje (el del asistente)
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.role === 'assistant') {
                return [...prev.slice(0, -1), { role: 'assistant', content: assistantResponse }];
              }
              return prev;
            });
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    addAssistantMessage,
    setExternalLoading,
    resetChat,
  };
}
