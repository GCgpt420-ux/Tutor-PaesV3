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
    <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-sm shadow-2xl overflow-hidden relative">
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none mix-blend-overlay" />

      {/* Header Táctico */}
      <div className="bg-white/5 border-b border-white/10 p-6 relative z-10">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 mb-2">
            <TerminalSquare className="h-4 w-4 text-brand-primary" />
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">
              Misión ID: #{question.question_id}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className={`px-3 py-1 rounded-sm text-[9px] font-mono font-black uppercase tracking-[0.2em] ${
                difficultyColors[difficultyLevel as keyof typeof difficultyColors] ||
                difficultyColors.medio
              }`}
            >
              Nvl: {question.difficulty}
            </span>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tighter mb-4 pr-12">
          {question.prompt}
        </h2>

        {/* Leyenda extraída del texto previo si hay reading_text */}
        {question.reading_text && (
          <div className="mt-6 border-l-2 border-brand-primary/50 bg-brand-primary/5 p-5 italic text-zinc-400 font-mono text-xs leading-relaxed">
            {question.reading_text}
          </div>
        )}
      </div>

      {/* Opciones Tipo Terminal */}
      <fieldset className="p-6 md:p-8 space-y-4 relative z-10">
        <legend className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-brand-primary mb-6 flex items-center gap-2">
          <Crosshair className="h-3 w-3" /> Insertar Coordenada Optima
        </legend>

        {optionsWithLetters.map((option) => (
          <label
            key={option.value}
            className={`w-full flex items-center p-4 border transition-all cursor-pointer group ${
              selectedAnswer === option.value
                ? 'border-brand-primary bg-brand-primary/10 shadow-[inset_4px_0_0_0_rgba(99,102,241,1)]'
                : 'border-white/5 bg-black/40 hover:border-white/20 hover:bg-white/5'
            }`}
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
                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center font-mono font-black text-lg transition-all ${
                  selectedAnswer === option.value
                    ? 'bg-brand-primary text-white scale-110 shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                    : 'bg-white/5 text-zinc-500 border border-white/10 group-hover:bg-white/10 group-hover:text-white'
                }`}
                aria-hidden="true"
              >
                {option.letter}
              </div>

              {/* Texto de opción */}
              <span className={`font-medium transition-colors ${selectedAnswer === option.value ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
                {option.value}
              </span>
            </div>
          </label>
        ))}
      </fieldset>

      {/* Explicación (toggle) Táctico */}
      <div className="border-t border-white/10 bg-black/40 relative z-10">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center justify-center w-full py-4 gap-2 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-brand-primary hover:bg-brand-primary/10 transition-colors border-b border-transparent hover:border-brand-primary/30"
        >
          <Info className="h-4 w-4" />
          {showExplanation ? 'OCULTAR TELEMETRÍA' : 'ACTIVAR TELEMETRÍA DE ASISTENCIA'}
        </button>

        {showExplanation && (
          <div className="p-6 md:p-8 space-y-6">
            {/* Explicación Estática */}
            {explanation && (
              <div className="p-6 bg-zinc-950 border border-white/10 relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-zinc-700" />
                <p className="font-mono font-black text-zinc-500 uppercase tracking-[0.2em] text-[9px] mb-3">Descifrado Base:</p>
                <p className="text-zinc-300 text-sm">{explanation}</p>
              </div>
            )}
            
            {/* Explicación IA */}
            {selectedAnswer && selectedAnswer !== correctAnswer && (
              <div className="border border-brand-accent/20 bg-brand-accent/5 rounded-none p-1">
                <div className="bg-black p-4 flex items-center gap-3 border-b border-brand-accent/10 mb-4">
                  <span className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
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
              <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest">
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
