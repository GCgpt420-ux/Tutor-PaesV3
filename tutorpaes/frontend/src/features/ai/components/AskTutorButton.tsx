'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { AiTutorChat } from './AiTutorChat';
import { useAiTutor } from '../hooks/use-ai-tutor';

interface AskTutorButtonProps {
  label?: string;
  // Mensaje de contexto enviado automáticamente al backend al abrir el chat,
  // oculto de la transcripción visible (ver useAiTutor -> sendMessage options.hidden).
  contextMessage: string;
  attemptId?: string;
  questionContext?: Record<string, unknown>;
  className?: string;
}

export function AskTutorButton({
  label = 'Preguntar a la Tuto sobre esto',
  contextMessage,
  attemptId,
  questionContext,
  className,
}: AskTutorButtonProps) {
  const tutor = useAiTutor();
  const [open, setOpen] = useState(false);
  const hasSentContextRef = useRef(false);

  useEffect(() => {
    if (!open || hasSentContextRef.current) return;
    hasSentContextRef.current = true;
    void tutor.sendMessage(contextMessage, attemptId, questionContext, { hidden: true });
    // Solo debe disparar una vez, al abrir; tutor.sendMessage es estable entre renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-primary/20 transition-colors interactive-focus ${className ?? ''}`}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {label}
      </button>
    );
  }

  return (
    <div className="mt-4 h-[480px] rounded-2xl border border-white/10 overflow-hidden relative">
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Cerrar chat con la Tuto"
        className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 text-zinc-300 hover:text-white hover:bg-black/60 interactive-focus"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <AiTutorChat
        messages={tutor.messages}
        loading={tutor.loading}
        error={tutor.error}
        sendMessage={(text) => tutor.sendMessage(text, attemptId, questionContext)}
      />
    </div>
  );
}
