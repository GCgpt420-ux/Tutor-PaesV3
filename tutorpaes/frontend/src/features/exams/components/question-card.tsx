'use client';

import { useState, useMemo } from 'react';
import { Info, Crosshair, TerminalSquare, AlertTriangle } from 'lucide-react';
import { AiExplanation } from './AiExplanation';

interface QuestionCardProps {
  question: {
    question_id: number;
    prompt: string;
    reading_text: string | null;
    difficulty: string;
    topic_id: number;
  };
  selectedAnswer: string | null;
  onAnswerSelected: (answer: string) => void;
  attemptId?: string;
  // Options y explanation se pasarán a través de un backend adaptado futuramente,
  // por ahora lo emularemos o lo quitaremos transitoriamente 
  correctAnswer?: string;
  distractors?: string[];
  explanation?: string;
}

export function QuestionCard({
  question,
  selectedAnswer,
  onAnswerSelected,
  attemptId = 'test-attempt-id',
  correctAnswer,
  distractors,
  explanation
}: QuestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  // Combinar respuesta correcta con distractores y shufflear
  const options = useMemo(() => {
    if (!correctAnswer || !distractors) return [];
    return [correctAnswer, ...distractors]
      .sort(() => Math.random() - 0.5);
  }, [correctAnswer, distractors]);

  const optionsWithLetters = options.map((opt, idx) => ({
    letter: String.fromCharCode(65 + idx), // A, B, C, D...
    value: opt,
    isCorrect: opt === correctAnswer,
  }));

  const difficultyColors = {
    facil: 'bg-green-500/10 text-green-500 border border-green-500/30',
    medio: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30',
    dificil: 'bg-red-500/10 text-red-500 border border-red-500/30',
  };

  const difficultyLevel = question.difficulty.toLowerCase();

  return (
    <div className="rounded-2xl border border-surface-container/70 bg-surface-default/90 backdrop-blur-md shadow-2xl overflow-hidden relative">
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none mix-blend-overlay" />

      {/* Header */}
      <div className="bg-surface-raised/40 border-b border-surface-container/60 p-6 md:p-8 relative z-10">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 mb-2">
            <TerminalSquare className="h-4 w-4 text-brand-primary" aria-hidden="true" />
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-text-tertiary">
              Pregunta ID: #{question.question_id}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className={`px-3 py-1 rounded-lg text-[9px] font-mono font-black uppercase tracking-[0.2em] ${
                difficultyColors[difficultyLevel as keyof typeof difficultyColors] ||
                difficultyColors.medio
              }`}
            >
              Nivel: {question.difficulty}
            </span>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-text-primary leading-tight tracking-tighter mb-4 pr-12 break-words">
          {question.prompt}
        </h2>

        {/* Leyenda extraída del texto previo si hay reading_text */}
        {question.reading_text && (
          <div className="mt-6 rounded-xl border-l-2 border-brand-primary bg-brand-primary/5 p-5 text-text-secondary font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {question.reading_text}
          </div>
        )}
      </div>

      {/* Opciones Tipo Terminal */}
      <fieldset className="p-6 md:p-8 space-y-3 relative z-10">
        <legend className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-brand-primary mb-4 flex items-center gap-2">
          <Crosshair className="h-3.5 w-3.5" aria-hidden="true" /> Selecciona una alternativa
        </legend>

        {optionsWithLetters.map((option) => (
          <label
            key={option.value}
            className={`w-full min-h-[52px] flex items-center p-4 rounded-xl border transition-[border-color,background-color,box-shadow] duration-150 cursor-pointer group ${
              selectedAnswer === option.value
                ? 'border-brand-primary bg-brand-primary/10 shadow-[inset_4px_0_0_0_rgba(99,102,241,1)]'
                : 'border-surface-container/50 bg-surface-raised/30 hover:border-surface-container hover:bg-surface-raised/60'
            } has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background`}
          >
            <input
              type="radio"
              name={`question-${question.question_id}`}
              value={option.value}
              checked={selectedAnswer === option.value}
              onChange={() => onAnswerSelected(option.value)}
              className="sr-only"
              aria-label={`Opción ${option.letter}: ${option.value}`}
            />
            <div className="flex items-center gap-4 w-full">
              {/* Indicador de opción Vector */}
              <div
                className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-mono font-black text-sm transition-[background-color,color,transform,box-shadow] duration-150 ${
                  selectedAnswer === option.value
                    ? 'bg-brand-primary text-white scale-105 shadow-md shadow-brand-primary/30'
                    : 'border border-surface-container bg-surface-raised text-text-tertiary group-hover:text-text-primary group-hover:border-brand-primary/40'
                }`}
                aria-hidden="true"
              >
                {option.letter}
              </div>

              {/* Texto de opción */}
              <span className={`text-sm md:text-base leading-relaxed break-words font-medium transition-colors duration-150 ${selectedAnswer === option.value ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                {option.value}
              </span>
            </div>
          </label>
        ))}
      </fieldset>

      {/* Explicación (toggle) */}
      <div className="border-t border-surface-container/60 bg-surface-raised/20 relative z-10">
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center justify-center w-full py-4 gap-2 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-brand-primary hover:bg-brand-primary/10 transition-colors border-b border-transparent hover:border-brand-primary/30 interactive-focus"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
          {showExplanation ? 'OCULTAR EXPLICACIÓN' : 'VER EXPLICACIÓN DEL TUTOR'}
        </button>

        {showExplanation && (
          <div className="p-6 md:p-8 space-y-6">
            {/* Explicación Estática */}
            {explanation && (
              <div className="p-6 rounded-xl bg-surface-base border border-surface-container/70 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-primary/60" />
                <p className="font-mono font-black text-text-tertiary uppercase tracking-[0.2em] text-[9px] mb-3">Explicación base:</p>
                <p className="text-text-secondary text-sm leading-relaxed">{explanation}</p>
              </div>
            )}
            
            {/* Explicación IA */}
            {selectedAnswer && selectedAnswer !== correctAnswer && (
              <div className="rounded-xl border border-brand-accent/30 bg-brand-accent/5 p-1 overflow-hidden">
                <div className="bg-surface-base rounded-t-lg p-4 flex items-center gap-3 border-b border-brand-accent/15 mb-4">
                  <span className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" aria-hidden="true" />
                  <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-brand-accent">
                    Intervención IA Generativa
                  </span>
                </div>
                <AiExplanation
                  questionId={question.question_id.toString()}
                  selectedAnswer={selectedAnswer}
                  attemptId={attemptId}
                />
              </div>
            )}

            {!selectedAnswer && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/25">
                <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" aria-hidden="true" />
                <span className="text-[10px] font-mono font-bold text-orange-300 uppercase tracking-widest">
                  Para activar IA debes ingresar un intento erróneo previo.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
