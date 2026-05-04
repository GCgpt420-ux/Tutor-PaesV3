'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { MarkdownMathRenderer } from '@/src/components/ui/markdown-math-renderer';
import { Send, Loader2, Sparkles, Mic, MicOff, Volume2 } from 'lucide-react';
import { useAiTutor } from '../hooks/use-ai-tutor';
import { useVoice } from '@/src/hooks/useVoice';

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
  const lastAutoSpokenMessageRef = useRef('');
  const { isRecording, isProcessing: isVoiceProcessing, startRecording, stopRecording, speak, stopSpeaking, isPlaying } = useVoice();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-play assistant voice once per completed assistant response.
  useEffect(() => {
    if (loading || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;

    const content = typeof lastMessage.content === 'string' ? lastMessage.content.trim() : '';
    if (!content) return;

    if (content === lastAutoSpokenMessageRef.current) return;
    lastAutoSpokenMessageRef.current = content;

    void speak(content);
  }, [messages, loading, speak]);

  const handleSend = async (textToSend?: string) => {
    const text = typeof textToSend === 'string' ? textToSend : input;
    if (!text.trim() || loading) return;
    setInput('');
    await sendMessage(text);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text && text.trim().length > 0) {
        setInput(text);
        // ENVIAR AUTOMÁTICAMENTE para efecto conversacional rápido
        await handleSend(text);
      }
    } else {
      // Iniciar grabación (el usuario interrumpe a la IA)
      if (isPlaying) {
        stopSpeaking();
      }
      await startRecording();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/5 backdrop-blur-sm">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-primary/40 to-brand-accent/30 flex items-center justify-center border border-brand-primary/20 shadow-[0_0_12px_rgba(59,130,246,0.2)] flex-shrink-0">
          <Sparkles className="h-4 w-4 text-brand-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-zinc-100 text-sm">Tuto</h3>
            <span className="text-[9px] text-zinc-500 font-medium">· Profesor IA</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            <p className="text-[10px] text-zinc-500">Disponible</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 px-6 py-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-primary/30 to-brand-accent/20 flex items-center justify-center border border-brand-primary/20 shadow-[0_0_24px_rgba(59,130,246,0.15)]">
              <Sparkles className="h-6 w-6 text-brand-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-zinc-200">Hola, soy Tuto.</p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Estoy aquí para ayudarte a entender, no solo a memorizar.
                Puedes preguntarme sobre la pregunta que acabas de ver, o sobre cualquier concepto que quieras reforzar.
              </p>
            </div>
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
              <div className="flex flex-col gap-2">
                <MarkdownMathRenderer content={m.content} />
                {m.role === 'assistant' && (
                  <button 
                    onClick={() => {
                      if (isPlaying && lastAutoSpokenMessageRef.current === m.content) {
                         stopSpeaking();
                         lastAutoSpokenMessageRef.current = '';
                      } else {
                         lastAutoSpokenMessageRef.current = typeof m.content === 'string' ? m.content : '';
                         speak(m.content);
                      }
                    }}
                    className="self-end p-1 rounded-full hover:bg-white/10 transition-colors text-zinc-500 hover:text-brand-primary"
                    title={isPlaying && lastAutoSpokenMessageRef.current === m.content ? "Detener audio" : "Escuchar respuesta"}
                  >
                    <Volume2 className={`h-3.5 w-3.5 ${isPlaying && lastAutoSpokenMessageRef.current === m.content ? 'text-brand-primary animate-pulse' : ''}`} />
                  </button>
                )}
              </div>
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
            placeholder={isRecording ? "Escuchando..." : "Pregunta algo sobre matemáticas..."}
            className={`w-full bg-zinc-900/50 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-sm text-zinc-50 placeholder:text-zinc-500 focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all font-medium ${isRecording ? 'border-brand-primary ring-1 ring-brand-primary/30' : ''}`}
          />
          <button
            onClick={toggleRecording}
            disabled={loading || isVoiceProcessing}
            className={`absolute left-2 p-2 rounded-lg transition-all ${isRecording ? 'bg-brand-danger text-white animate-pulse' : 'text-zinc-500 hover:bg-white/5 hover:text-brand-primary'}`}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <Button
            onClick={() => handleSend()}
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
