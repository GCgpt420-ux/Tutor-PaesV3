'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { MarkdownMathRenderer } from '@/src/components/ui/markdown-math-renderer';
import { useAiExplanation } from '@/src/features/ai/hooks/use-ai-explanation';
import { Sparkles, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';

interface AiExplanationProps {
  questionId: string;
  selectedAnswer: string;
  attemptId: string;
}

export function AiExplanation({
  questionId,
  selectedAnswer,
  attemptId,
}: AiExplanationProps) {
  const { loading, explanation, error, requestExplanation } = useAiExplanation();
  const [tipIndex, setTipIndex] = useState(0);

  const studyTips = [
    'Tip PAES: Revisa el enunciado y subraya palabras clave antes de responder.',
    'Tip PAES: Si dudas entre dos opciones, elimina primero la claramente incorrecta.',
    'Tip PAES: En matematicas, verifica unidades y signos para evitar errores simples.',
    'Tip PAES: Respira 10 segundos entre preguntas dificiles para mantener enfoque.',
  ];

  useEffect(() => {
    if (!loading) {
      setTipIndex(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % studyTips.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [loading, studyTips.length]);

  async function handleGetExplanation() {
    await requestExplanation({ questionId, selectedAnswer, attemptId });
  }

  return (
    <div className="space-y-4 mt-6">
      {!explanation && (
        <Button onClick={handleGetExplanation} disabled={loading} size="lg" className="w-full bg-brand-primary text-white hover:opacity-90 shadow-lg shadow-brand-primary/25 border-none">
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-accent" aria-hidden="true" /> Pensando...</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4 text-brand-accent" aria-hidden="true" /> Consultar al Tutor IA</>
          )}
        </Button>
      )}

      {loading && !explanation && (
        <Card className="p-4 bg-surface-raised border border-brand-accent/50 animate-border-beam shadow-lg shadow-brand-accent/10">
          <p className="text-sm font-medium text-brand-accent flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" /> Analizando tu respuesta...
          </p>
          <p className="text-sm text-zinc-400 mt-2">{studyTips[tipIndex]}</p>
        </Card>
      )}

      {error && (
        <Card className="p-4 border-red-900/50 bg-red-950/20 animate-error-shake">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {explanation && (
        <Card className={`p-6 bg-surface-raised transition-all duration-300 ${loading ? 'border border-brand-accent animate-border-beam shadow-lg shadow-brand-accent/20' : 'border border-zinc-800'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-brand-accent" aria-hidden="true" />
            <h3 className="font-semibold text-lg text-zinc-50">Tutor IA</h3>
          </div>
          <MarkdownMathRenderer
            content={explanation}
            className={`text-sm text-zinc-300 leading-relaxed ${loading ? 'ai-streaming-cursor' : ''}`}
          />
        </Card>
      )}
    </div>
  );
}
