'use client';

import { useEffect, useRef, useState } from 'react';
import { X, BookOpen, AlertTriangle, Zap, Sparkles } from 'lucide-react';
import { MarkdownMathRenderer } from '@/src/components/ui/markdown-math-renderer';
import { getTopicStudyData } from '../data/topic-study-data';

type StudyTab = 'concepts' | 'traps' | 'practice';

const TABS: Array<{ id: StudyTab; label: string; icon: typeof BookOpen }> = [
  { id: 'concepts', label: 'Conceptos Clave', icon: BookOpen },
  { id: 'traps', label: 'Trampas DEMRE', icon: AlertTriangle },
  { id: 'practice', label: 'Practicar', icon: Zap },
];

interface TopicStudyModalProps {
  open: boolean;
  onClose: () => void;
  subjectCode: string;
  topicCode: string;
  topicName: string;
  onPractice: () => void;
}

export function TopicStudyModal({
  open,
  onClose,
  subjectCode,
  topicCode,
  topicName,
  onPractice,
}: TopicStudyModalProps) {
  const [tab, setTab] = useState<StudyTab>('concepts');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setTab('concepts');
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const { keyConcepts, demreTraps } = getTopicStudyData(subjectCode, topicCode);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-study-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-surface-raised border border-white/10 rounded-[2rem] shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-white/5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary mb-1">Ficha de Estudio</p>
            <h2 id="topic-study-modal-title" className="font-display text-2xl font-black uppercase tracking-tight text-white">
              {topicName}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha de estudio"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-text-tertiary hover:text-white transition-colors flex-shrink-0 interactive-focus"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-white/5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors ${
                tab === id
                  ? 'text-brand-primary border-brand-primary'
                  : 'text-text-tertiary border-transparent hover:text-text-secondary'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {tab === 'concepts' && (
            <MarkdownMathRenderer
              content={keyConcepts}
              className="text-text-secondary text-sm leading-relaxed [&_h3]:text-white [&_h3]:font-display [&_h3]:font-black [&_h3]:uppercase [&_h3]:tracking-tight [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:first:mt-0"
            />
          )}

          {tab === 'traps' && (
            <div className="space-y-4">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Tuto te advierte
              </p>
              {demreTraps.map((trap) => (
                <div
                  key={trap.title}
                  className="rounded-2xl border border-brand-danger/20 bg-brand-danger/5 p-5 flex gap-4"
                >
                  <AlertTriangle className="h-5 w-5 text-brand-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-text-primary mb-1">{trap.title}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{trap.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'practice' && (
            <div className="flex flex-col items-center text-center gap-5 py-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-brand-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-bold text-white mb-2">¿Listo para entrenar {topicName}?</p>
                <p className="text-sm text-text-secondary max-w-sm">
                  Ya repasaste los conceptos clave y las trampas más comunes del DEMRE. Ahora pon a prueba lo que sabes.
                </p>
              </div>
              <button
                type="button"
                onClick={onPractice}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8 py-3.5 rounded-full font-black uppercase tracking-[0.2em] text-[11px] transition-transform hover:scale-105 active:scale-95"
              >
                Comenzar a practicar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
