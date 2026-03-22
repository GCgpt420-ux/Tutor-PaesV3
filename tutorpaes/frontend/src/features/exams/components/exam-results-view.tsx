'use client';

import { useEffect, useState } from 'react';
import { getAttemptResults, AttemptResult } from '../api/exams';
import { MarkdownMathRenderer } from '@/src/components/ui/markdown-math-renderer';

interface ExamResultsViewProps {
  attemptId: number | string;
}

export function ExamResultsView({ attemptId }: ExamResultsViewProps) {
  const [results, setResults] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function fetchResults() {
      try {
        setLoading(true);
        const data = await getAttemptResults(attemptId);
        if (mounted) setResults(data);
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Error al cargar resultados');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchResults();

    return () => {
      mounted = false;
    };
  }, [attemptId]);

  if (loading) {
    return <div className="p-12 text-center animate-pulse text-zinc-400 font-bold uppercase tracking-widest text-sm">Procesando resultados computacionales...</div>;
  }

  if (error || !results) {
    return (
      <div className="p-8 bg-red-900/20 border border-red-900/50 rounded-xl text-red-200 animate-error-shake max-w-2xl mx-auto mt-12 text-center">
        <h3 className="font-bold text-sm uppercase tracking-widest text-red-400 mb-2">Error</h3>
        <p className="text-sm">{error || 'No se pudieron encontrar los resultados para este ensayo.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      <div className="glass-card bg-zinc-900/50 rounded-2xl p-10 border border-white/5 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400 mb-2 uppercase tracking-tight">¡Misión Completada!</h1>
        <div className="text-7xl font-black text-brand-primary my-8 drop-shadow-lg">
          {results.score}<span className="text-2xl text-zinc-500 font-medium ml-2">pts</span>
        </div>
        <p className="text-zinc-400 text-lg font-medium">
          Rendimiento cognitivo: Lograste descifrar <strong className="text-green-400">{results.correct_count}</strong> de {results.total_questions} interrogantes.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-zinc-100 border-b border-white/10 pb-4 uppercase tracking-wide">Desglose Táctico</h2>
        {results.answers_detail.map((detail, idx) => (
          <div key={detail.question_id} className="glass-card bg-zinc-900/40 rounded-2xl border-white/5 p-6 hover:border-white/10 transition-colors">
            <div className="flex items-start gap-5 mb-4">
              <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full font-bold text-white shadow-lg ${detail.is_correct ? 'bg-green-500 shadow-[0_0_15px_rgba(74,222,128,0.3)]' : 'bg-brand-accent shadow-[0_0_15px_rgba(244,63,94,0.3)]'}`}>
                {idx + 1}
              </span>
              <div className="flex-1">
                <p className="text-zinc-100 font-bold mb-4 leading-relaxed">{detail.prompt}</p>
                <div className="space-y-3 text-sm">
                  <div className="p-4 bg-zinc-900/80 rounded-xl border border-white/5 flex gap-3 flex-col sm:flex-row sm:items-center">
                    <span className="font-bold text-zinc-400 uppercase tracking-widest text-xs">Tu respuesta:</span>
                    <span className={detail.is_correct ? 'text-green-400 font-bold' : 'text-brand-accent font-bold'}>
                      {detail.selected_choice_text || 'Omitida en combate'}
                    </span>
                  </div>
                  {!detail.is_correct && detail.correct_choice_text && (
                    <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20 flex gap-3 flex-col sm:flex-row sm:items-center">
                      <span className="font-bold text-green-400 uppercase tracking-widest text-xs">Acierto óptimo:</span>
                      <span className="text-green-300 font-medium">{detail.correct_choice_text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {detail.ai_explanation && (
              <div className="mt-6 p-5 bg-brand-primary/5 rounded-xl border-l-4 border-l-brand-primary">
                <h4 className="font-black text-brand-primary uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                  </span>
                  Análisis del Tutor IA
                </h4>
                <MarkdownMathRenderer
                  content={detail.ai_explanation}
                  className="text-[15px] text-zinc-300 leading-relaxed"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
