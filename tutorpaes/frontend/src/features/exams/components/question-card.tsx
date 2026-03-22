'use client';

import { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
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
    facil: 'bg-green-100 text-green-800',
    medio: 'bg-yellow-100 text-yellow-800',
    dificil: 'bg-red-100 text-red-800',
  };

  // Construir mensaje para WhatsApp
  const buildWhatsAppMessage = () => {
    const optionsText = optionsWithLetters
      .map((opt) => `${opt.letter}. ${opt.value}`)
      .join('\n');

    const message = `Hola, tengo una duda con esta pregunta:\n\n*Pregunta:*\n${question.prompt}\n\n*Opciones:*\n${optionsText}\n\n*Dificultad:* ${question.difficulty}`;
    return encodeURIComponent(message);
  };

  const whatsappLink = `https://wa.me/56945950373?text=${buildWhatsAppMessage()}`;

  return (
    <div className="bg-surface-default border border-zinc-800 rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-800/50 to-zinc-900 border-b border-zinc-800 p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-50 flex-1">{question.prompt}</h2>
          <div className="flex items-center gap-3 flex-shrink-0 ml-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                difficultyColors[question.difficulty as keyof typeof difficultyColors] ||
                difficultyColors.medio
              }`}
            >
              {question.difficulty}
            </span>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-semibold text-sm"
              title="Consultar en WhatsApp"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004c-1.325 0-2.851.123-4.102.271-.638.077-1.195.202-1.586.355-.529.212-1.035.557-1.29 1.067-.256.512-.257 1.088-.164 1.646.209 1.254 1.75 3.518 4.769 5.679 1.012.662 2.195 1.283 3.408 1.629 1.512.451 2.894.36 3.777-.121 1.289-.695 2.067-2.277 2.067-3.829 0-1.104-.213-2.105-.64-2.962-.426-.856-1.064-1.412-1.9-1.662-.529-.16-1.136-.277-1.77-.277z" />
              </svg>
              Ayuda
            </a>
          </div>
        </div>
        {/* Leyenda extraída del texto previo si hay reading_text */}
        {question.reading_text && (
          <div className="mt-4 rounded-lg overflow-hidden bg-zinc-900/60 border border-zinc-700 relative w-full p-4 italic text-zinc-300 text-sm">
            {question.reading_text}
          </div>
        )}
      </div>

      {/* Opciones */}
      <fieldset className="p-6 space-y-3">
        <legend className="text-sm font-semibold text-zinc-300 mb-4">Elige una respuesta:</legend>

        {optionsWithLetters.map((option) => (
          <label
            key={option.value}
            className={`w-full flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
              selectedAnswer === option.value
                ? 'border-brand-primary bg-zinc-900/80'
                : 'border-zinc-700 bg-zinc-900/40 hover:border-brand-primary hover:bg-zinc-900/60'
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
              {/* Indicador de opción */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold ${
                  selectedAnswer === option.value
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-zinc-600 text-zinc-400'
                }`}
                aria-hidden="true"
              >
                {option.letter}
              </div>

              {/* Texto de opción */}
              <span className="text-zinc-50 font-medium">{option.value}</span>
            </div>
          </label>
        ))}
      </fieldset>

      {/* Explicación (toggle) */}
      <div className="border-t border-zinc-800 p-6 bg-zinc-900/50">
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center gap-2 text-sm font-semibold text-brand-primary hover:text-brand-primary/80"
        >
          <Info className="h-4 w-4" />
          {showExplanation ? 'Ocultar' : 'Ver'} explicación
        </button>

        {showExplanation && (
          <div className="mt-3 space-y-4">
            {/* Explicación Estática */}
            {explanation && (
              <div className="p-4 bg-zinc-900/80 border border-brand-primary/20 rounded-lg text-sm text-zinc-300">
                <p className="font-semibold text-brand-primary mb-2">Explicación:</p>
                <p>{explanation}</p>
              </div>
            )}
            
            {/* Explicación IA (Se muestra solo si hay una respuesta seleccionada y es incorrecta) */}
            {selectedAnswer && selectedAnswer !== correctAnswer && (
              <AiExplanation
                questionId={question.question_id.toString()}
                selectedAnswer={selectedAnswer}
                attemptId={attemptId}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
