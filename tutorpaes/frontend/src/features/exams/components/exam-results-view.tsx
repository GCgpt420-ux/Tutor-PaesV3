'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { getAttemptResults, AttemptResult, AttemptFeedbackDetail } from '../api/exams';
import { MarkdownMathRenderer } from '@/src/components/ui/markdown-math-renderer';
import { AskTutorButton } from '@/src/features/ai/components/AskTutorButton';
import { useProfile } from '@/src/features/profile/hooks/use-profile';

interface ExamResultsViewProps {
  attemptId: number | string;
}

// Escala oficial PAES: 100-1000 puntos (ver docs/contexto_agentes/05_contexto_academico_y_pruebas.md).
// El backend no implementa aun la curva IRT/DEMRE real, solo una aproximacion
// lineal (correctas/total * 1000). Por eso el score se presenta como estimacion.
const PAES_SCALE_MIN = 100;
const PAES_SCALE_MAX = 1000;
const PAES_SCALE_MIDPOINT = 550;

function clampToPaesScale(rawScore: number | null): number {
  if (rawScore === null || !Number.isFinite(rawScore)) return PAES_SCALE_MIN;
  return Math.min(PAES_SCALE_MAX, Math.max(PAES_SCALE_MIN, Math.round(rawScore)));
}

function buildQuestionReviewContext(detail: AttemptFeedbackDetail) {
  return {
    question_id: detail.question_id,
    question_prompt: detail.prompt,
    selected_choice_text: detail.selected_choice_text,
    correct_choice_text: detail.correct_choice_text,
  };
}

function buildQuestionContextMessage(detail: AttemptFeedbackDetail): string {
  const selected = detail.selected_choice_text ?? 'sin respuesta';
  const correct = detail.correct_choice_text ?? 'no disponible';
  return `El alumno respondió "${selected}" para la pregunta: "${detail.prompt}". La respuesta correcta es "${correct}". Inicia una guía socrática preguntando al alumno qué razonamiento siguió.`;
}

function buildExamReviewContextMessage(results: AttemptResult): string {
  const wrongCount = results.total_questions - results.correct_count;
  return `El alumno terminó un ensayo con ${results.correct_count}/${results.total_questions} respuestas correctas (${wrongCount} erróneas). Ayúdalo a repasar los conceptos donde se equivocó, priorizando un enfoque socrático pregunta por pregunta.`;
}

function PerformanceContextBar({ score, targetScore }: { score: number; targetScore?: number | null }) {
  const percent = ((score - PAES_SCALE_MIN) / (PAES_SCALE_MAX - PAES_SCALE_MIN)) * 100;
  const midpointPercent = ((PAES_SCALE_MIDPOINT - PAES_SCALE_MIN) / (PAES_SCALE_MAX - PAES_SCALE_MIN)) * 100;
  const targetPercent = targetScore
    ? ((clampToPaesScale(targetScore) - PAES_SCALE_MIN) / (PAES_SCALE_MAX - PAES_SCALE_MIN)) * 100
    : null;

  return (
    <div className="mt-8 w-full">
      <div className="relative h-2 rounded-full bg-surface-container/60">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand-primary"
          style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-surface-base bg-text-tertiary"
          style={{ left: `${midpointPercent}%` }}
          title={`Punto medio de la escala: ${PAES_SCALE_MIDPOINT} pts`}
        />
        {targetPercent !== null && (
          <div
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-surface-base bg-brand-accent shadow-[0_0_8px_rgba(0,0,0,0.3)]"
            style={{ left: `${targetPercent}%` }}
            title={`Meta del alumno: ${targetScore} pts`}
          />
        )}
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
        <span>{PAES_SCALE_MIN} pts · mínimo escala</span>
        <span>{PAES_SCALE_MIDPOINT} pts · punto medio</span>
        {targetScore ? <span className="text-brand-accent">{targetScore} pts · tu meta</span> : <span>{PAES_SCALE_MAX} pts · máximo</span>}
      </div>
    </div>
  );
}

function AnswerDetailCard({
  detail,
  idx,
  attemptId,
}: {
  detail: AttemptFeedbackDetail;
  idx: number;
  attemptId: number | string;
}) {
  return (
    <div className="glass-card bg-surface-raised/30 rounded-3xl border-white/5 p-8 hover:border-brand-primary/30 transition-all group relative overflow-hidden">
      {/* Correct/Incorrect Glow */}
      <div className={`absolute top-0 left-0 w-1.5 h-full ${detail.is_correct ? 'bg-success' : 'bg-brand-danger'}`} />

      <div className="flex flex-col md:flex-row items-start gap-8">
        {/* ID de Pregunta */}
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl font-black text-lg transition-all ${
          detail.is_correct
            ? 'bg-success/10 text-success border border-success/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
            : 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]'
        }`}>
          {idx + 1}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-text-primary mb-6 leading-relaxed group-hover:text-brand-primary transition-colors">
            {detail.prompt}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-zinc-950/50 rounded-2xl border border-white/5 flex flex-col gap-2">
              <span className="text-[9px] font-black text-text-tertiary uppercase tracking-[0.2em]">Tu respuesta</span>
              <span className={`text-sm font-bold ${detail.is_correct ? 'text-success' : 'text-brand-danger'}`}>
                {detail.selected_choice_text || 'Entrada omitida'}
              </span>
            </div>

            {!detail.is_correct && detail.correct_choice_text && (
              <div className="p-5 bg-success/5 rounded-2xl border border-success/20 flex flex-col gap-2 transition-all hover:bg-success/10">
                <span className="text-[9px] font-black text-success uppercase tracking-[0.2em]">Respuesta Correcta</span>
                <span className="text-sm font-bold text-success">{detail.correct_choice_text}</span>
              </div>
            )}
          </div>

          {detail.ai_explanation && (
            <div className="mt-8 relative pt-6 border-t border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse delay-75"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse delay-150"></span>
                </div>
                <h4 className="font-black text-brand-primary uppercase tracking-[0.2em] text-[10px]">
                  Desglose del Tutor IA
                </h4>
              </div>
              <div className="bg-brand-primary/5 rounded-2xl p-6 border border-brand-primary/20">
                <MarkdownMathRenderer
                  content={detail.ai_explanation}
                  className="text-[15px] text-text-secondary leading-relaxed"
                />
              </div>
            </div>
          )}

          {!detail.is_correct && (
            <div className="mt-6">
              <AskTutorButton
                contextMessage={buildQuestionContextMessage(detail)}
                attemptId={String(attemptId)}
                questionContext={buildQuestionReviewContext(detail)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ExamResultsView({ attemptId }: ExamResultsViewProps) {
  const [results, setResults] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: profile } = useProfile();

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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 border-t-4 border-b-4 border-brand-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-brand-primary/20 rounded-full animate-ping"></div>
            </div>
          </div>
          <p className="text-text-tertiary font-black uppercase tracking-[0.2em] text-xs">Evaluando rendimiento cognitivo...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center animate-error-shake">
        <div className="glass-card p-10 border-brand-danger/30 bg-brand-danger/5">
          <div className="w-16 h-16 bg-brand-danger/10 border border-brand-danger/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-brand-danger" />
          </div>
          <h3 className="font-black text-brand-danger uppercase tracking-widest text-sm mb-3">Error al cargar resultados</h3>
          <p className="text-text-secondary text-sm leading-relaxed">{error || 'No se pudieron encontrar los registros de este ensayo.'}</p>
        </div>
      </div>
    );
  }

  const paesScore = clampToPaesScale(results.score);

  return (
    <div className="max-w-5xl mx-auto space-y-12 p-6 pb-20">
      {/* Hero Score Card */}
      <div className="glass-card bg-surface-raised/40 rounded-3xl p-12 border-white/10 shadow-2xl text-center relative overflow-hidden group">
        {/* Animated Background Orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-brand-primary/20 transition-all duration-1000" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] mb-4">Registro Final de Desempeño</p>
          <h1 className="text-4xl md:text-5xl font-black text-text-primary uppercase tracking-tight mb-8">¡Ensayo Completado!</h1>

          <div className="flex flex-col items-center justify-center gap-2 mb-2">
            <div className="text-8xl md:text-9xl font-black text-text-primary tabular-nums tracking-tighter drop-shadow-2xl">
              {paesScore}<span className="text-2xl md:text-3xl text-text-tertiary font-bold ml-3 uppercase">pts</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-text-tertiary">
              Puntaje PAES estimado · escala 100-1000
            </p>
          </div>

          <PerformanceContextBar score={paesScore} targetScore={profile?.target_score} />

          <div className="inline-flex items-center gap-3 px-6 py-3 mt-8 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-sm font-medium text-text-secondary">Respuestas correctas:</span>
            <span className="px-2.5 py-1 rounded-lg bg-success/10 border border-success/20 text-success font-black text-sm">
              {results.correct_count} / {results.total_questions}
            </span>
            <span className="text-sm font-medium text-text-secondary">del total.</span>
          </div>

          {results.correct_count < results.total_questions && (
            <div className="mt-6">
              <AskTutorButton
                label="Repasar con la Tuto"
                contextMessage={buildExamReviewContextMessage(results)}
                attemptId={String(attemptId)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Desglose de Preguntas */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Análisis Detallado de Respuestas</h2>
          <div className="hidden sm:flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-success"></div>
              <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Acierto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-danger"></div>
              <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Error</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {results.answers_detail.map((detail, idx) => (
            <AnswerDetailCard key={detail.question_id} detail={detail} idx={idx} attemptId={attemptId} />
          ))}
        </div>
      </div>
    </div>
  );
}
