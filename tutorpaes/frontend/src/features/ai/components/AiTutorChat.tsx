'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { MarkdownMathRenderer } from '@/src/components/ui/markdown-math-renderer';
import { Send, Loader2, Sparkles, MessageCircle } from 'lucide-react';
import { useAiTutor } from '../hooks/use-ai-tutor';

interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiTutorChatProps {
  messages?: TutorMessage[];
  loading?: boolean;
  error?: string | null;
  sendMessage?: (text: string) => Promise<void>;
}

export function AiTutorChat(props: AiTutorChatProps) {
  const internalTutor = useAiTutor();
  
  const messages = props.messages ?? internalTutor.messages;
  const loading = props.loading ?? internalTutor.loading;
  const error = props.error ?? internalTutor.error;
  const sendMessage = props.sendMessage ?? internalTutor.sendMessage;

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/5 backdrop-blur-sm">
        <div className="h-8 w-8 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
          <Sparkles className="h-4 w-4 text-brand-primary animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-zinc-100 text-sm">Tutor IA PAES</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">En línea</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-6">
            <div className="p-4 rounded-full bg-brand-primary/10 border border-brand-primary/20">
              <MessageCircle className="h-8 w-8 text-brand-primary" />
            </div>
            <p className="text-sm text-zinc-400">
              ¡Hola! Soy tu <strong>Profesor IA</strong>. <br /><br />
              Estoy aquí para ayudarte a dominar los contenidos y estrategias para la prueba. ¿Qué quieres estudiar hoy?
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-brand-primary text-white ml-4 rounded-tr-sm shadow-[0_4px_15px_rgba(59,130,246,0.3)]'
                  : 'bg-zinc-800/80 text-zinc-200 mr-4 rounded-tl-sm border border-white/10 backdrop-blur-md'
              }`}
            >
              <MarkdownMathRenderer content={m.content} />
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-zinc-800/80 p-4 rounded-2xl rounded-tl-sm border border-white/10 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
              <span className="text-xs text-zinc-400 font-medium">Analizando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta algo sobre matemáticas..."
            className="w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all font-medium"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
            className="absolute right-2 bg-brand-primary h-9 w-9 rounded-lg shadow-lg hover:bg-brand-primary/90 hover:scale-105 transition-all text-white disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-[10px] text-red-400 mt-2 ml-1 font-medium">{error}</p>}
      </div>
    </div>
  );
}
