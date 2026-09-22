'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  AlertCircle,
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Loader, 
  Sparkles, 
  MessageCircle,
  X,
  Database,
} from 'lucide-react';
import { apiFetch } from '@/src/lib/api/client';
import { saveUserAnswer } from '@/src/features/exams/api/exams';
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
  const clampedCurrent = Math.min(Math.max(current, 0), total);
  const percent = total > 0 ? (clampedCurrent / total) * 100 : 0;
  return (
    <div
      role="progressbar"
      aria-label="Progreso del ensayo"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={clampedCurrent}
      className="absolute top-0 left-0 w-full z-30"
    >
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
  imageUrl,
}: {
  number: number;
  category: string;
  content: string;
  readingText?: string | null;
  imageUrl?: string | null;
}) => (
  <div className="w-full max-w-3xl text-left pt-4">
    <div className="flex items-center gap-3 mb-6 group">
      <div className="h-6 w-1 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
      <span className="text-[10px] font-black tracking-[0.2em] text-text-tertiary uppercase">
        Materia: <span className="text-text-secondary">{category}</span>
      </span>
    </div>

    {readingText && readingText.trim().length > 0 && (
      <section className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
          Texto base
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
          {readingText}
        </p>
      </section>
    )}

    <div className="space-y-4">
      <span className="text-sm font-bold text-brand-primary/80 font-mono">Q.0{number}</span>
      <h1 className="text-2xl md:text-3xl font-display font-semibold leading-[1.4] text-text-primary tracking-tight break-words">
        {content}
      </h1>
    </div>

    {imageUrl && (
      <div className="mt-6 overflow-hidden rounded-2xl border border-surface-container bg-surface-raised/40">
        <img 
          src={imageUrl} 
          alt="Gráfico de la pregunta" 
          className="h-auto w-full object-contain max-h-[400px]"
        />
      </div>
    )}
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
  const { addAssistantMessage, cancelMessage, resetChat, setExternalLoading } = aiTutor;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerGenerationRef = useRef(0);
  const questionControllerRef = useRef<AbortController | null>(null);
  const hintControllerRef = useRef<AbortController | null>(null);
  const lastHintQuestionIdRef = useRef<number | null>(null);
  const mobileChatTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileChatCloseRef = useRef<HTMLButtonElement>(null);

  const [totalQuestions, setTotalQuestions] = useState(15);
  const [showMobileChat, setShowMobileChat] = useState(false);
  // Pilar 3: toast de persistencia
  const [showPersistenceToast, setShowPersistenceToast] = useState(false);
  const [lastAttemptId, setLastAttemptId] = useState<number | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const closeMobileChat = useCallback(() => {
    setShowMobileChat(false);
    mobileChatTriggerRef.current?.focus();
  }, []);

  // CARGAR PREGUNTA
  const loadNextQuestion = useCallback(async () => {
    answerGenerationRef.current += 1;
    questionControllerRef.current?.abort();
    questionControllerRef.current = null;

    if (!subject_code || !topic_code || subject_code === 'undefined' || topic_code === 'undefined') {
      setQuiz((prev) => ({ ...prev, loading: false, error: 'Parámetros no encontrados' }));
      return;
    }

    const controller = new AbortController();
    questionControllerRef.current = controller;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    hintControllerRef.current?.abort();
    hintControllerRef.current = null;
    cancelMessage();
    setExternalLoading(false);
    resetChat();
    lastHintQuestionIdRef.current = null;

    try {
      setQuiz((prev) => ({
        ...prev,
        loading: true,
        error: null,
        question: null,
        selectedChoice: null,
        submitted: false,
        isCorrect: null,
        feedbackText: null,
        aiPayload: null,
      }));

      const response = await apiFetch<NextQuestionResponse>(
        `/quiz/next-question?subject_code=${subject_code}&topic_code=${topic_code}`,
        { signal: controller.signal },
      );

      if (questionControllerRef.current !== controller) return;

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
      if (questionControllerRef.current !== controller) return;
      setQuiz((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error al cargar pregunta',
      }));
    } finally {
      if (questionControllerRef.current === controller) {
        questionControllerRef.current = null;
      }
    }
  }, [cancelMessage, resetChat, setExternalLoading, subject_code, topic_code]);

  useEffect(() => {
    if (subject_code && topic_code) loadNextQuestion();
  }, [subject_code, topic_code, loadNextQuestion]);

  useEffect(() => {
    if (!showMobileChat) return;

    mobileChatCloseRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileChat();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeMobileChat, showMobileChat]);

  // Cargar pista inicial de forma proactiva y segura al cambiar de pregunta
  const questionId = quiz.question?.question_id;

  useEffect(() => {
    if (questionId == null || quiz.submitted) return;
    
    const qId = questionId;
    if (lastHintQuestionIdRef.current === qId) return;
    
    lastHintQuestionIdRef.current = qId;
    const controller = new AbortController();
    hintControllerRef.current = controller;
    
    apiFetch<{ hint: string }>('/ai/hint', {
      method: 'POST',
      body: JSON.stringify({ question_id: qId }),
      signal: controller.signal,
    }).then((hintRes) => {
      if (!controller.signal.aborted && hintRes && hintRes.hint) {
        const friendlyHint = `**Pista inicial de Tuto:**\n${hintRes.hint}`;
        addAssistantMessage(friendlyHint);
      }
    }).catch((err) => {
      if (!controller.signal.aborted) {
        console.error('Error fetching proactive hint:', err);
      }
    });

    return () => {
      controller.abort();
      if (hintControllerRef.current === controller) {
        hintControllerRef.current = null;
        if (lastHintQuestionIdRef.current === qId) {
          lastHintQuestionIdRef.current = null;
        }
      }
    };
  }, [questionId, quiz.submitted, addAssistantMessage]);

  useEffect(() => {
    return () => {
      answerGenerationRef.current += 1;
      const questionController = questionControllerRef.current;
      questionControllerRef.current = null;
      questionController?.abort();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const buildQuestionContext = useCallback(() => {
    if (!quiz.question) {
      return {
        subject_code,
        topic_code,
      };
    }

    const selectedChoice = quiz.question.choices.find((choice) => choice.id === quiz.selectedChoice);
    const correctChoice = quiz.question.choices.find((choice) => choice.id === quiz.aiPayload?.correct_choice_id);

    return {
      subject_code,
      topic_code,
      question_id: quiz.question.question_id,
      question_prompt: quiz.question.prompt,
      reading_text: quiz.question.reading_text,
      choices: quiz.question.choices.map((choice) => ({
        label: choice.label,
        text: choice.text,
      })),
      selected_choice_label: selectedChoice?.label,
      selected_choice_text: selectedChoice?.text,
      correct_choice_label: correctChoice?.label,
      correct_choice_text: correctChoice?.text,
      is_correct: quiz.isCorrect,
      feedback_text: quiz.feedbackText,
    };
  }, [quiz.aiPayload, quiz.feedbackText, quiz.isCorrect, quiz.question, quiz.selectedChoice, subject_code, topic_code]);

  // ENVIAR RESPUESTA
  const handleSubmitAnswer = async () => {
    if (quiz.selectedChoice === null || !quiz.question) return;

    const answerGeneration = ++answerGenerationRef.current;

    try {
      setQuiz((prev) => ({ ...prev, loading: true, error: null }));
      aiTutor.setExternalLoading(true); // Mostrar estado "Analizando" en IA

      const response = await saveUserAnswer({
        subject_code,
        topic_code,
        question_id: quiz.question.question_id,
        selected_choice_id: quiz.selectedChoice,
      }) as BackendAnswerOut;

      if (answerGenerationRef.current !== answerGeneration) return;

      const isCorrect = response.is_correct;
      const tutorFeedback = typeof response.feedback_text === 'string' && response.feedback_text.trim().length > 0
        ? response.feedback_text.trim()
        : isCorrect
          ? '¿Qué dato clave del enunciado te confirmó tu respuesta?'
          : 'Interesante elección. ¿Puedes explicarme en una oración cómo llegaste a esa respuesta?';

      // --- DISPARADOR PROACTIVO DE LA IA ---
      timeoutRef.current = setTimeout(() => {
        aiTutor.setExternalLoading(false);
        aiTutor.addAssistantMessage(tutorFeedback);
      }, 800);

      // Pilar 3: mostrar toast de persistencia
      if (response.attempt_id) {
        setLastAttemptId(response.attempt_id);
        setShowPersistenceToast(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setShowPersistenceToast(false), 4000);
      }

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
      if (answerGenerationRef.current !== answerGeneration) return;
      setQuiz((prev) => ({ ...prev, loading: false, error: 'Error al enviar respuesta' }));
      aiTutor.setExternalLoading(false);
    }
  };

  // Pilar 3: Componente Toast inline de persistencia
  const PersistenceToast = () => (
    showPersistenceToast ? (
      <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-zinc-900 border border-green-500/40 rounded-2xl px-4 py-3 shadow-2xl shadow-green-500/10 animate-in slide-in-from-bottom-4 duration-300">
        <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
          <Database className="h-4 w-4 text-green-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-50 flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-green-400" />
            Guardado en PostgreSQL
          </p>
          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
            attempt_id: {lastAttemptId} · user_progress ✓
          </p>
        </div>
      </div>
    ) : null
  );

  // PANTALLAS DE ESTADO
  if (quiz.error && !quiz.loading && !quiz.question) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 bg-surface-base p-6 text-center">
        <div className="p-5 rounded-full bg-red-500/10">
          <AlertCircle className="h-12 w-12 text-red-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-zinc-100">Algo salió mal</h2>
          <p className="text-sm text-zinc-400 max-w-sm">{quiz.error}</p>
        </div>
        <button
          type="button"
          onClick={loadNextQuestion}
          className="px-8 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (quiz.loading && !quiz.question) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-base">
        <Loader className="h-8 w-8 text-brand-primary animate-spin" />
      </div>
    );
  }

  if (!quiz.question && (quiz.questionsAnswered > 0 || quiz.isFinished)) {
      const percentage = Math.round((quiz.correctAnswers / Math.max(1, quiz.questionsAnswered)) * 100);
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-surface-base p-6 text-center">
            <div className={`mb-8 p-6 rounded-full ${percentage >= 60 ? 'bg-green-500/10' : 'bg-brand-danger/10'}`}>
                {percentage >= 60 ? <CheckCircle className="h-16 w-16 text-green-500" /> : <XCircle className="h-16 w-16 text-brand-danger" />}
            </div>
            <h1 className="text-4xl font-black text-zinc-100 mb-2">{percentage}% CORRECTO</h1>
            <p className="text-zinc-400 mb-8">Has completado el entrenamiento de {topic_code}.</p>
            <button
              type="button"
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
    <div className="flex flex-col lg:flex-row h-[calc(100svh-10rem)] min-h-0 lg:h-[calc(100vh-140px)] lg:min-h-[600px] w-full bg-surface-base text-zinc-300 font-sans relative rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
      <ProgressBar current={quiz.questionsAnswered} total={totalQuestions} />

      {/* MOBILE TOP BAR */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-surface-container/60 bg-surface-raised/40 backdrop-blur-md z-20">
        <button 
          type="button"
          onClick={() => router.back()} 
          className="p-2.5 bg-surface-raised/80 rounded-xl border border-surface-container text-text-secondary hover:text-text-primary interactive-focus"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-primary" aria-hidden="true" />
          <span className="text-xs font-bold text-text-primary tracking-widest uppercase font-mono">Misión {subject_code}</span>
        </div>
        <button
          ref={mobileChatTriggerRef}
          type="button"
          onClick={() => setShowMobileChat(true)}
          className="p-2.5 bg-brand-primary/10 border border-brand-primary/30 rounded-xl text-brand-primary hover:bg-brand-primary/20 interactive-focus relative"
          aria-label="Abrir tutor IA"
          aria-controls="quiz-tutor-panel"
          aria-expanded={showMobileChat}
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          <span className="absolute top-1 right-1 flex h-2 w-2" aria-hidden="true">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
          </span>
        </button>
      </div>

      {/* 2. CENTRO: PREGUNTA (Flex-1 Wrapper) */}
      <div className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
        
        {/* Scrollable Content Area */}
        <main className="flex-1 w-full flex flex-col items-center p-4 md:p-8 lg:px-20 overflow-y-auto scrollbar-hide pb-40">
          <div className="w-full max-w-3xl space-y-8 md:space-y-12 animate-fade-in-up mt-4 md:mt-12">
            
            <QuestionCard 
              number={quiz.questionsAnswered + 1} 
              category={topic_code} 
              readingText={quiz.question?.reading_text}
              content={quiz.question?.prompt || ''} 
              imageUrl={quiz.question?.image_url}
            />

            <div className="grid grid-cols-1 gap-3 w-full pb-4 md:pb-8">
              {quiz.question?.choices.map((choice) => {
                const isSelected = quiz.selectedChoice === choice.id;
                const isCorrect = quiz.submitted && choice.id === quiz.question?.correct_choice_id;
                const isWrong = quiz.submitted && isSelected && !quiz.isCorrect;

                return (
                  <button
                    type="button"
                    key={choice.id}
                    onClick={() => !quiz.submitted && setQuiz(p => ({ ...p, selectedChoice: choice.id, error: null }))}
                    disabled={quiz.submitted}
                    aria-pressed={isSelected}
                    className={`
                      group relative flex items-center min-h-[52px] p-4 md:p-5 rounded-2xl border transition-[background-color,border-color,box-shadow,transform] duration-150 text-left
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
                      ${!quiz.submitted ? 'hover:bg-surface-raised/40 hover:border-surface-container active:scale-[0.99]' : 'cursor-default'}
                      ${isSelected && !quiz.submitted ? 'bg-brand-primary/10 border-brand-primary shadow-[inset_4px_0_0_0_rgba(99,102,241,1)]' : 'bg-surface-raised/20 border-surface-container/60'}
                      ${isCorrect ? '!bg-green-500/10 !border-green-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : ''}
                      ${isWrong ? '!bg-brand-danger/10 !border-brand-danger/50' : ''}
                    `}
                  >
                    <div className={`
                      flex items-center justify-center w-7 h-7 flex-shrink-0 rounded-lg border text-xs font-black font-mono transition-[background-color,color,border-color] duration-150
                      ${isSelected ? 'bg-brand-primary border-transparent text-white shadow-sm shadow-brand-primary/30' : 'border-surface-container/80 bg-surface-raised text-text-tertiary'}
                      ${isCorrect ? '!bg-green-500 !text-white !border-transparent' : ''}
                      ${isWrong ? '!bg-brand-danger !text-white !border-transparent' : ''}
                    `}>
                      {choice.label}
                    </div>
                    <span className={`ml-4 text-sm md:text-base leading-relaxed break-words font-medium transition-colors ${isSelected ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                      {choice.text}
                    </span>
                    {isCorrect && <span className="sr-only">, respuesta correcta</span>}
                    {isWrong && <span className="sr-only">, tu respuesta, incorrecta</span>}
                  </button>
                );
              })}
            </div>
            <span role="status" aria-live="polite" className="sr-only">
              {quiz.submitted ? (quiz.isCorrect ? 'Respuesta correcta.' : 'Respuesta incorrecta.') : ''}
            </span>
          </div>
        </main>

        {/* Action Bar Floating (Absoluto respecto al contenedor central) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-full md:max-w-xl z-30 pointer-events-none">
            <div className="pointer-events-auto shadow-[0_-30px_50px_rgba(4,9,20,0.8)] backdrop-blur-md rounded-2xl p-2 bg-surface-default/80 border border-surface-container/60">
              {quiz.error && (
                <div className="mb-2 p-3 bg-brand-danger/10 border border-brand-danger/25 text-brand-danger text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="flex-1">{quiz.error}</span>
                  <button 
                    type="button"
                    onClick={() => setQuiz(p => ({ ...p, error: null }))}
                    className="p-1 hover:bg-white/5 rounded-md interactive-focus"
                    aria-label="Cerrar alerta"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
              {!quiz.submitted ? (
                  <button 
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={quiz.selectedChoice === null || quiz.loading}
                    className="w-full min-h-[48px] py-3.5 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-primary/25 transition-[background-color,transform,box-shadow] duration-150 hover:scale-[1.01] active:scale-[0.99] interactive-focus"
                  >
                      {quiz.loading ? 'Sincronizando...' : 'Fijar Respuesta'}
                  </button>
              ) : (
                  <button 
                    type="button"
                    onClick={() => {
                      if (quiz.isFinished && quiz.attemptId) {
                        router.push(`/protected/resultados?attempt_id=${quiz.attemptId}`);
                        return;
                      }
                      loadNextQuestion();
                    }}
                    className="w-full min-h-[48px] py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-primary/25 transition-[background-color,transform,box-shadow] duration-150 hover:scale-[1.01] active:scale-[0.99] interactive-focus"
                  >
                      {quiz.isFinished ? 'Ver Resultados Finales' : 'Siguiente Desafío'}
                  </button>
              )}
            </div>
        </div>
      </div>

      {/* 3. DERECHA: TUTOR IA PROACTIVO (Desktop Panel / Mobile Drawer) */}
      <aside
        id="quiz-tutor-panel"
        aria-label="Tutor PAES"
        className={`
        fixed inset-y-0 right-0 z-50 w-[min(88vw,400px)] lg:w-[400px] 2xl:w-[460px] h-full flex-shrink-0
        border-l border-white/5 bg-surface-raised/95 backdrop-blur-2xl lg:shadow-[-10px_0_40px_rgba(0,0,0,0.5)]
        transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:visible lg:pointer-events-auto lg:bg-surface-raised/60 lg:backdrop-blur-xl
        ${showMobileChat ? 'translate-x-0 visible pointer-events-auto shadow-[-20px_0_50px_rgba(0,0,0,0.8)]' : 'translate-x-full invisible pointer-events-none'}
        flex flex-col p-4 md:p-6
      `}
      >
        <header className="flex items-center justify-between mb-6 lg:mb-8 pt-4 lg:pt-0">
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-primary" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Tutor PAES</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full hidden md:block">
                  <span className="text-[10px] font-bold text-brand-primary uppercase">Socrático</span>
              </div>
              <button
                ref={mobileChatCloseRef}
                type="button"
                onClick={closeMobileChat}
                className="p-2 lg:hidden bg-white/5 rounded-full text-zinc-400 interactive-focus"
                aria-label="Cerrar tutor IA"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
        </header>

        <div className="flex-1 overflow-hidden h-full rounded-2xl">
            <AiTutorChat 
                messages={aiTutor.messages} 
                loading={aiTutor.loading} 
                error={aiTutor.error} 
          sendMessage={(text) => aiTutor.sendMessage(text, quiz.attemptId ? String(quiz.attemptId) : undefined, buildQuestionContext())} 
            />
        </div>
      </aside>
      <PersistenceToast />
    </div>
  );
}
