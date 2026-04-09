'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Sparkles, 
  MessageCircle,
  X
} from 'lucide-react';
import { apiFetch } from '@/src/lib/api/client';
import { AiTutorChat } from '@/src/features/ai/components/AiTutorChat';
import { useAiTutor } from '@/src/features/ai/hooks/use-ai-tutor';
import type {
  NextQuestionResponse,
  BackendQuestionOut,
  BackendAnswerOut,
  QuizState,
} from '@/src/types/quiz';

// --- COMPONENTES REFINADOS (LOCALES) ---

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const percent = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="absolute top-0 left-0 w-full z-30">
      <div className="h-[2px] w-full bg-white/[0.02]">
        <div 
          className="h-full bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary bg-[length:200%_auto] transition-all duration-1000"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const QuestionCard = ({
  number,
  category,
  content,
  readingText,
}: {
  number: number;
  category: string;
  content: string;
  readingText?: string | null;
}) => (
  <div className="w-full max-w-3xl text-left pt-4">
    <div className="flex items-center gap-3 mb-6 group">
      <div className="h-6 w-1 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
      <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
        Materia: <span className="text-zinc-300">{category}</span>
      </span>
    </div>

    {readingText && readingText.trim().length > 0 && (
      <section className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
          Texto base
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {readingText}
        </p>
      </section>
    )}

    <div className="space-y-4">
      <span className="text-sm font-bold text-brand-primary/60 font-mono">Q.0{number}</span>
      <h1 className="text-2xl md:text-3xl font-display font-semibold leading-[1.4] text-zinc-100 tracking-tight">
        {content}
      </h1>
    </div>
  </div>
);

// --- PÁGINA PRINCIPAL ---

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const subject_code = params?.subject_code as string;
  const topic_code = params?.topic_code as string;

  // IA Hook para control proactivo
  const aiTutor = useAiTutor();

  const [totalQuestions, setTotalQuestions] = useState(15);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [quiz, setQuiz] = useState<QuizState>({
    question: null,
    selectedChoice: null,
    submitted: false,
    isCorrect: null,
    feedbackText: null,
    aiPayload: null,
    isFinished: false,
    loading: true,
    error: null,
    attemptId: null,
    questionsAnswered: 0,
    correctAnswers: 0,
  });

  // CARGAR PREGUNTA
  const loadNextQuestion = useCallback(async () => {
    if (!subject_code || !topic_code || subject_code === 'undefined' || topic_code === 'undefined') {
      setQuiz((prev) => ({ ...prev, loading: false, error: 'Parámetros no encontrados' }));
      return;
    }

    try {
      setQuiz((prev) => ({
        ...prev,
        loading: true,
        error: null,
        selectedChoice: null,
        submitted: false,
        isCorrect: null,
        feedbackText: null,
        aiPayload: null,
      }));

      const response = await apiFetch<NextQuestionResponse>(
        `/quiz/next-question?subject_code=${subject_code}&topic_code=${topic_code}`
      );

      if (response.kind === "topic_completed") {
        setQuiz((prev) => ({
          ...prev,
          question: null,
          loading: false,
          isFinished: true,
          attemptId: response.attempt_id,
          questionsAnswered: response.total_questions,
          correctAnswers: response.correct_count,
        }));
        setTotalQuestions(response.total_questions);
        return;
      }

      if (response.kind === "question") {
        setQuiz((prev) => ({
          ...prev,
          question: response as BackendQuestionOut,
          loading: false,
        }));
      }
    } catch (err) {
      setQuiz((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error al cargar pregunta',
      }));
    }
  }, [subject_code, topic_code]);

  useEffect(() => {
    if (subject_code && topic_code) loadNextQuestion();
  }, [subject_code, topic_code, loadNextQuestion]);

  // ENVIAR RESPUESTA
  const handleSubmitAnswer = async () => {
    if (quiz.selectedChoice === null || !quiz.question) return;

    try {
      setQuiz((prev) => ({ ...prev, loading: true }));
      aiTutor.setExternalLoading(true); // Mostrar estado "Analizando" en IA

      const response = await apiFetch<BackendAnswerOut>('/quiz/answer', {
        method: 'POST',
        body: JSON.stringify({
          subject_code,
          topic_code,
          question_id: quiz.question.question_id,
          selected_choice_id: quiz.selectedChoice,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const isCorrect = response.is_correct;

      // --- DISPARADOR PROACTIVO DE LA IA ---
      setTimeout(() => {
        aiTutor.setExternalLoading(false);
        if (isCorrect) {
          aiTutor.addAssistantMessage("¡Excelente razonamiento! Has aplicado correctamente la propiedad. Sigamos con la siguiente.");
        } else {
          // Extraer hint del ai_payload si existe, si no usar genérico
          const hint = (response.ai_payload?.hint as string) || 
                       "No te preocupes, este es un error común. Fíjate en cómo se relacionan los términos de la pregunta. ¿Qué pasaría si intentas otra estrategia?";
          aiTutor.addAssistantMessage(hint);
        }
      }, 800);

      setQuiz((prev) => ({
        ...prev,
        submitted: true,
        isCorrect: isCorrect,
        feedbackText: response.feedback_text,
        aiPayload: response.ai_payload ?? null,
        loading: false,
        questionsAnswered: prev.questionsAnswered + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        isFinished: response.is_attempt_finished,
        attemptId: response.attempt_id,
      }));
    } catch {
      setQuiz((prev) => ({ ...prev, loading: false, error: 'Error al enviar respuesta' }));
      aiTutor.setExternalLoading(false);
    }
  };

  // PANTALLAS DE ESTADO
  if (quiz.loading && !quiz.question && quiz.questionsAnswered === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface">
        <Loader className="h-8 w-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!quiz.question && (quiz.questionsAnswered > 0 || quiz.isFinished)) {
      const percentage = Math.round((quiz.correctAnswers / Math.max(1, quiz.questionsAnswered)) * 100);
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-surface p-6 text-center">
            <div className={`mb-8 p-6 rounded-full ${percentage >= 60 ? 'bg-green-500/10' : 'bg-brand-danger/10'}`}>
                {percentage >= 60 ? <CheckCircle className="h-16 w-16 text-green-500" /> : <XCircle className="h-16 w-16 text-brand-danger" />}
            </div>
            <h1 className="text-4xl font-black text-zinc-100 mb-2">{percentage}% CORRECTO</h1>
            <p className="text-zinc-400 mb-8">Has completado el entrenamiento de {topic_code}.</p>
            <button
              onClick={() => {
                if (quiz.attemptId) {
                  router.push(`/protected/resultados?attempt_id=${quiz.attemptId}`);
                  return;
                }
                router.back();
              }}
              className="px-8 py-4 bg-white text-black font-bold rounded-xl uppercase tracking-widest text-sm hover:scale-105 transition-all"
            >
                Finalizar Misión
            </button>
        </div>
      );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] min-h-[600px] w-full bg-surface text-zinc-300 font-sans relative rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
      <ProgressBar current={quiz.questionsAnswered} total={totalQuestions} />

      {/* MOBILE TOP BAR */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-surface-raised/40 backdrop-blur-md z-20">
        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-xl border border-white/10 text-zinc-400">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-primary" />
          <span className="text-xs font-bold text-zinc-300 tracking-widest uppercase">Misión {subject_code}</span>
        </div>
        <button onClick={() => setShowMobileChat(true)} className="p-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-brand-primary relative">
          <MessageCircle className="h-5 w-5" />
          <span className="absolute top-1 right-1 flex h-2 w-2">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
          </span>
        </button>
      </div>

      {/* 2. CENTRO: PREGUNTA (Flex-1 Wrapper) */}
      <div className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
        
        {/* Scrollable Content Area */}
        <main className="flex-1 w-full flex flex-col items-center p-4 md:p-8 lg:px-20 overflow-y-auto scrollbar-hide pb-32">
          <div className="w-full max-w-3xl space-y-8 md:space-y-12 animate-fade-in-up mt-4 md:mt-12">
            
            <QuestionCard 
              number={quiz.questionsAnswered + 1} 
              category={topic_code} 
              readingText={quiz.question?.reading_text}
              content={quiz.question?.prompt || ''} 
            />

            <div className="grid grid-cols-1 gap-3 w-full pb-4 md:pb-8">
              {quiz.question?.choices.map((choice) => {
                const isSelected = quiz.selectedChoice === choice.id;
                const isCorrect = quiz.submitted && choice.id === quiz.question?.correct_choice_id;
                const isWrong = quiz.submitted && isSelected && !quiz.isCorrect;

                return (
                  <button
                    key={choice.id}
                    onClick={() => !quiz.submitted && setQuiz(p => ({ ...p, selectedChoice: choice.id }))}
                    disabled={quiz.submitted}
                    className={`
                      group relative flex items-center p-4 md:p-5 rounded-2xl border transition-all duration-200 text-left outline-none
                      ${!quiz.submitted ? 'hover:bg-white/[0.03] active:scale-[0.99]' : 'cursor-default'}
                      ${isSelected && !quiz.submitted ? 'bg-white/5 border-white/20' : 'bg-surface-raised/20 border-white/5'}
                      ${isCorrect ? 'bg-green-500/10 border-green-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : ''}
                      ${isWrong ? 'bg-brand-danger/10 border-brand-danger/40' : ''}
                    `}
                  >
                    <div className={`
                      flex items-center justify-center w-7 h-7 flex-shrink-0 rounded-md border text-xs font-black transition-all
                      ${isSelected ? 'bg-zinc-100 border-transparent text-zinc-950' : 'border-white/10 text-zinc-500'}
                      ${isCorrect ? '!bg-green-500 !text-white border-none' : ''}
                      ${isWrong ? '!bg-brand-danger !text-white border-none' : ''}
                    `}>
                      {choice.label}
                    </div>
                    <span className={`ml-4 text-sm md:text-base ${isSelected ? 'text-zinc-50' : 'text-zinc-300'}`}>
                      {choice.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* Action Bar Floating (Absoluto respecto al contenedor central) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-full md:max-w-xl z-30 pointer-events-none">
            <div className="pointer-events-auto shadow-[0_-30px_50px_rgba(4,9,20,0.8)] backdrop-blur-md rounded-2xl p-2 bg-[#0B1220]/50">
              {!quiz.submitted ? (
                  <button 
                    onClick={handleSubmitAnswer}
                    disabled={quiz.selectedChoice === null || quiz.loading}
                    className="w-full py-4 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_5px_15px_rgba(59,130,246,0.3)] transition-all"
                  >
                      {quiz.loading ? 'Sincronizando...' : 'Fijar Respuesta'}
                  </button>
              ) : (
                  <button 
                    onClick={() => {
                      if (quiz.isFinished && quiz.attemptId) {
                        router.push(`/protected/resultados?attempt_id=${quiz.attemptId}`);
                        return;
                      }
                      loadNextQuestion();
                    }}
                    className="w-full py-4 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl font-black uppercase tracking-widest text-xs shadow-[0_5px_15px_rgba(255,255,255,0.2)] transition-all"
                  >
                      {quiz.isFinished ? 'Ver Resultados Finales' : 'Siguiente Desafío'}
                  </button>
              )}
            </div>
        </div>
      </div>

      {/* 3. DERECHA: TUTOR IA PROACTIVO (Desktop Panel / Mobile Drawer) */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] lg:w-[400px] 2xl:w-[460px] h-full flex-shrink-0 
        border-l border-white/5 bg-surface-raised/95 backdrop-blur-2xl lg:shadow-[-10px_0_40px_rgba(0,0,0,0.5)]
        transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:bg-surface-raised/60 lg:backdrop-blur-xl
        ${showMobileChat ? 'translate-x-0 shadow-[-20px_0_50px_rgba(0,0,0,0.8)]' : 'translate-x-full'}
        flex flex-col p-4 md:p-6
      `}>
        <header className="flex items-center justify-between mb-6 lg:mb-8 pt-4 lg:pt-0">
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-primary" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Tutor PAES</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full hidden md:block">
                  <span className="text-[10px] font-bold text-brand-primary uppercase">Socrático</span>
              </div>
              <button onClick={() => setShowMobileChat(false)} className="p-2 lg:hidden bg-white/5 rounded-full text-zinc-400">
                <X className="h-5 w-5" />
              </button>
            </div>
        </header>

        <div className="flex-1 overflow-hidden h-full rounded-2xl">
            <AiTutorChat 
                messages={aiTutor.messages} 
                loading={aiTutor.loading} 
                error={aiTutor.error} 
          sendMessage={(text) => aiTutor.sendMessage(text, quiz.attemptId ? String(quiz.attemptId) : undefined)} 
            />
        </div>
      </aside>
    </div>
  );
}
