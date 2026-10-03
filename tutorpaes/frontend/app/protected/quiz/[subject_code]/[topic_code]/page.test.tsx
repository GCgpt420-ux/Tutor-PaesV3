import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/src/lib/api/client';
import { saveUserAnswer } from '@/src/features/exams/api/exams';
import { useAiTutor } from '@/src/features/ai/hooks/use-ai-tutor';
import QuizPage from './page';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/src/lib/api/client', () => ({
  apiFetch: jest.fn(),
}));

jest.mock('@/src/features/exams/api/exams', () => ({
  saveUserAnswer: jest.fn(),
}));

jest.mock('@/src/features/ai/hooks/use-ai-tutor', () => ({
  useAiTutor: jest.fn(),
}));

jest.mock('@/src/features/ai/components/AiTutorChat', () => ({
  AiTutorChat: () => <div data-testid="ai-tutor-chat" />,
}));

jest.mock('@/src/components/ui/markdown-math-renderer', () => ({
  MarkdownMathRenderer: ({ content }: { content: string }) => <span>{content}</span>,
}));

const mockedUseParams = jest.mocked(useParams);
const mockedUseRouter = jest.mocked(useRouter);
const mockedApiFetch = jest.mocked(apiFetch);
const mockedSaveUserAnswer = jest.mocked(saveUserAnswer);
const mockedUseAiTutor = jest.mocked(useAiTutor);

const question = {
  kind: 'question' as const,
  question_id: 101,
  prompt: '¿Cuál es la función principal de la membrana plasmática?',
  topic: 'BIO',
  reading_text: null,
  image_url: null,
  correct_choice_id: 1,
  choices: [
    { id: 1, label: 'A', text: 'Permeabilidad selectiva' },
    { id: 2, label: 'B', text: 'Síntesis de proteínas' },
  ],
};

const setupQuiz = (isCorrect = true) => {
  mockedUseParams.mockReturnValue({ subject_code: 'CIEN', topic_code: 'BIO' });
  mockedUseRouter.mockReturnValue({
    back: jest.fn(),
    push: jest.fn(),
  } as unknown as ReturnType<typeof useRouter>);
  mockedUseAiTutor.mockReturnValue({
    messages: [],
    loading: false,
    error: null,
    sendMessage: jest.fn(),
    cancelMessage: jest.fn(),
    addAssistantMessage: jest.fn(),
    setExternalLoading: jest.fn(),
    resetChat: jest.fn(),
  });
  mockedApiFetch.mockImplementation(async (endpoint) =>
    endpoint === '/ai/hint' ? { hint: 'Pista inicial.' } : question,
  );
  mockedSaveUserAnswer.mockResolvedValue({
    is_correct: isCorrect,
    feedback_text: isCorrect ? 'Bien hecho.' : 'Inténtalo nuevamente.',
    ai_payload: null,
    is_attempt_finished: false,
    attempt_id: 7,
  });
};

describe('QuizPage accessibility and mobile layout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes progress, selection state, and mobile sizing', async () => {
    setupQuiz();

    render(<QuizPage />);

    const answer = await screen.findByRole('button', { name: /Permeabilidad selectiva/i });
    const progress = screen.getByRole('progressbar', { name: 'Progreso del ensayo' });

    expect(progress).toHaveAttribute('aria-valuemin', '0');
    expect(progress).toHaveAttribute('aria-valuemax', '15');
    expect(progress).toHaveAttribute('aria-valuenow', '0');
    expect(progress.parentElement).toHaveClass(
      'h-[calc(100svh-10rem)]',
      'min-h-0',
      'lg:h-[calc(100vh-140px)]',
      'lg:min-h-[600px]',
      'bg-surface-base',
    );
    expect(progress.parentElement).not.toHaveClass('bg-surface');
    expect(screen.getByRole('main')).toHaveClass('pb-40');

    expect(answer).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(answer);
    expect(answer).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the status region mounted before submission', async () => {
    setupQuiz();

    render(<QuizPage />);

    await screen.findByRole('button', { name: /Permeabilidad selectiva/i });
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();
  });

  it('manages mobile tutor visibility, expanded state, focus, and Escape', async () => {
    setupQuiz();

    render(<QuizPage />);

    await screen.findByRole('button', { name: /Permeabilidad selectiva/i });
    const openTutor = screen.getByRole('button', { name: 'Abrir tutor IA' });
    const tutorPanel = screen.getByRole('complementary', { name: 'Tutor PAES' });
    expect(tutorPanel).toHaveAttribute('id', 'quiz-tutor-panel');
    expect(openTutor).toHaveAttribute('aria-controls', 'quiz-tutor-panel');
    expect(openTutor).toHaveAttribute('aria-expanded', 'false');
    expect(tutorPanel).toHaveClass(
      'invisible',
      'pointer-events-none',
      'lg:visible',
      'lg:pointer-events-auto',
    );
    expect(tutorPanel).not.toHaveAttribute('role');
    expect(tutorPanel).not.toHaveAttribute('aria-modal');

    openTutor.focus();
    fireEvent.click(openTutor);
    const closeTutor = screen.getByRole('button', { name: 'Cerrar tutor IA' });
    await waitFor(() => expect(closeTutor).toHaveFocus());
    expect(openTutor).toHaveAttribute('aria-expanded', 'true');
    expect(tutorPanel).toHaveClass('w-[min(88vw,400px)]', 'lg:w-[400px]');
    expect(tutorPanel).not.toHaveClass('w-full');
    expect(tutorPanel).toHaveClass('visible', 'pointer-events-auto');
    expect(tutorPanel).not.toHaveClass('invisible', 'pointer-events-none');
    expect(screen.getByRole('complementary', { name: 'Tutor PAES' })).toBe(tutorPanel);
    expect(tutorPanel).not.toHaveAttribute('role');
    expect(tutorPanel).not.toHaveAttribute('aria-modal');
    expect(closeTutor).toHaveAttribute('type', 'button');
    expect(closeTutor).toHaveClass('interactive-focus');
    expect(closeTutor.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(closeTutor);
    await waitFor(() => expect(openTutor).toHaveFocus());
    expect(openTutor).toHaveAttribute('aria-expanded', 'false');
    expect(tutorPanel).not.toHaveAttribute('role');

    fireEvent.click(openTutor);
    await waitFor(() => expect(closeTutor).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(openTutor).toHaveFocus());
    expect(openTutor).toHaveAttribute('aria-expanded', 'false');
  });

  it.each([
    [true, 'Respuesta correcta.'],
    [false, 'Respuesta incorrecta.'],
  ])('announces whether a submitted answer is correct when isCorrect is %s', async (isCorrect, message) => {
    setupQuiz(isCorrect);

    render(<QuizPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Permeabilidad selectiva/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Fijar Respuesta' }));

    const status = await screen.findByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveClass('sr-only');
    expect(status).toHaveTextContent(message);
  });

  it('adds correctness context to submitted alternatives without changing visible copy', async () => {
    setupQuiz(false);

    render(<QuizPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Síntesis de proteínas/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Fijar Respuesta' }));

    const correctAnswer = await screen.findByRole('button', {
      name: /Permeabilidad selectiva\s*,\s*respuesta correcta/i,
    });
    const wrongAnswer = screen.getByRole('button', {
      name: /Síntesis de proteínas\s*,\s*tu respuesta, incorrecta/i,
    });
    expect(correctAnswer.querySelector('.sr-only')).toHaveTextContent('respuesta correcta');
    expect(wrongAnswer.querySelector('.sr-only')).toHaveTextContent('tu respuesta, incorrecta');
  });

  it('uses the defined base surface on loading, error, and completion screens', async () => {
    setupQuiz();
    mockedApiFetch.mockImplementation(() => new Promise(() => undefined));

    const { container, rerender } = render(<QuizPage />);
    expect(container.firstChild).toHaveClass('bg-surface-base');

    mockedApiFetch.mockRejectedValueOnce(new Error('No disponible'));
    mockedUseParams.mockReturnValue({ subject_code: 'CIEN', topic_code: 'QUIM' });
    rerender(<QuizPage />);
    const retry = await screen.findByRole('button', { name: 'Reintentar' });
    expect(container.firstChild).toHaveClass('bg-surface-base');
    expect(retry).toHaveAttribute('type', 'button');

    mockedApiFetch.mockResolvedValueOnce({
      kind: 'topic_completed',
      attempt_id: 7,
      total_questions: 2,
      correct_count: 1,
    });
    mockedUseParams.mockReturnValue({ subject_code: 'CIEN', topic_code: 'FIS' });
    rerender(<QuizPage />);
    const finish = await screen.findByRole('button', { name: 'Finalizar Misión' });
    expect(container.firstChild).toHaveClass('bg-surface-base');
    expect(finish).toHaveAttribute('type', 'button');
  });
});

describe('QuizPage tutor hints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('clears the previous tutor context before loading a question', async () => {
    const resetChat = jest.fn();
    const cancelMessage = jest.fn();
    const addAssistantMessage = jest.fn();

    mockedUseParams.mockReturnValue({ subject_code: 'CIEN', topic_code: 'BIO' });
    mockedUseRouter.mockReturnValue({
      back: jest.fn(),
      push: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    mockedUseAiTutor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      cancelMessage,
      addAssistantMessage,
      setExternalLoading: jest.fn(),
      resetChat,
    });
    mockedApiFetch.mockImplementation(async (endpoint) => {
      if (endpoint === '/ai/hint') {
        return { hint: 'Piensa en lo que entra y sale de la célula.' };
      }

      return {
        kind: 'question',
        question_id: 101,
        prompt: '¿Cuál es la función principal de la membrana plasmática?',
        topic: 'BIO',
        reading_text: null,
        image_url: null,
        correct_choice_id: 1,
        choices: [
          { id: 1, label: 'A', text: 'Permeabilidad selectiva' },
          { id: 2, label: 'B', text: 'Síntesis de proteínas' },
        ],
      };
    });

    render(<QuizPage />);

    await waitFor(() => {
      expect(addAssistantMessage).toHaveBeenCalledWith(
        '**Pista inicial de Tuto:**\nPiensa en lo que entra y sale de la célula.',
      );
    });
    expect(resetChat).toHaveBeenCalledTimes(1);
    expect(cancelMessage).toHaveBeenCalledTimes(1);
    expect(resetChat.mock.invocationCallOrder[0]).toBeLessThan(
      mockedApiFetch.mock.invocationCallOrder[0],
    );
  });

  it('cancels a pending hint when its question leaves the screen', async () => {
    const resetChat = jest.fn();
    const addAssistantMessage = jest.fn();
    let resolveHint: ((value: { hint: string }) => void) | undefined;

    mockedUseParams.mockReturnValue({ subject_code: 'CIEN', topic_code: 'BIO' });
    mockedUseRouter.mockReturnValue({
      back: jest.fn(),
      push: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    mockedUseAiTutor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      cancelMessage: jest.fn(),
      addAssistantMessage,
      setExternalLoading: jest.fn(),
      resetChat,
    });
    mockedApiFetch.mockImplementation((endpoint) => {
      if (endpoint === '/ai/hint') {
        return new Promise<{ hint: string }>((resolve) => {
          resolveHint = resolve;
        });
      }

      return Promise.resolve({
        kind: 'question',
        question_id: 101,
        prompt: '¿Cuál es la función principal de la membrana plasmática?',
        topic: 'BIO',
        reading_text: null,
        image_url: null,
        correct_choice_id: 1,
        choices: [{ id: 1, label: 'A', text: 'Permeabilidad selectiva' }],
      });
    });

    const { unmount } = render(<QuizPage />);

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        '/ai/hint',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    const hintCall = mockedApiFetch.mock.calls.find(([endpoint]) => endpoint === '/ai/hint');
    const signal = hintCall?.[1]?.signal;
    unmount();

    expect(signal?.aborted).toBe(true);
    await act(async () => {
      resolveHint?.({ hint: 'Esta pista ya no corresponde.' });
      await Promise.resolve();
    });
    expect(addAssistantMessage).not.toHaveBeenCalled();
  });

  it('ignores an older question response that resolves after the current request', async () => {
    const addAssistantMessage = jest.fn();
    const questionResolvers: Array<(value: object) => void> = [];

    mockedUseParams.mockReturnValue({ subject_code: 'CIEN', topic_code: 'BIO' });
    mockedUseRouter.mockReturnValue({
      back: jest.fn(),
      push: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    mockedUseAiTutor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      cancelMessage: jest.fn(),
      addAssistantMessage,
      setExternalLoading: jest.fn(),
      resetChat: jest.fn(),
    });
    mockedApiFetch.mockImplementation(async (endpoint, options) => {
      if (endpoint === '/ai/hint') {
        const { question_id } = JSON.parse(String(options?.body)) as { question_id: number };
        return { hint: `Pista para ${question_id}.` };
      }

      return new Promise((resolve) => {
        questionResolvers.push(resolve);
      });
    });

    render(
      <StrictMode>
        <QuizPage />
      </StrictMode>,
    );

    await waitFor(() => expect(questionResolvers).toHaveLength(2));
    const questionCalls = mockedApiFetch.mock.calls.filter(([endpoint]) =>
      String(endpoint).startsWith('/quiz/next-question'),
    );

    expect(questionCalls[0][1]?.signal?.aborted).toBe(true);
    expect(questionCalls[1][1]?.signal?.aborted).toBe(false);

    await act(async () => {
      questionResolvers[1]({
        kind: 'question',
        question_id: 202,
        prompt: 'Pregunta vigente',
        topic: 'BIO',
        reading_text: null,
        image_url: null,
        correct_choice_id: 1,
        choices: [{ id: 1, label: 'A', text: 'Respuesta vigente' }],
      });
    });
    await waitFor(() => {
      expect(screen.getByText('Pregunta vigente')).toBeInTheDocument();
      expect(addAssistantMessage).toHaveBeenCalledWith(
        '**Pista inicial de Tuto:**\nPista para 202.',
      );
    });

    await act(async () => {
      questionResolvers[0]({
        kind: 'question',
        question_id: 101,
        prompt: 'Pregunta obsoleta',
        topic: 'BIO',
        reading_text: null,
        image_url: null,
        correct_choice_id: 1,
        choices: [{ id: 1, label: 'A', text: 'Respuesta obsoleta' }],
      });
    });

    expect(screen.queryByText('Pregunta obsoleta')).not.toBeInTheDocument();
    expect(screen.getByText('Pregunta vigente')).toBeInTheDocument();
    expect(mockedApiFetch).not.toHaveBeenCalledWith(
      '/ai/hint',
      expect.objectContaining({ body: JSON.stringify({ question_id: 101 }) }),
    );
  });

  it('aborts a pending question request when the page unmounts', async () => {
    let questionSignal: AbortSignal | null | undefined;

    mockedUseParams.mockReturnValue({ subject_code: 'CIEN', topic_code: 'BIO' });
    mockedUseRouter.mockReturnValue({
      back: jest.fn(),
      push: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    mockedUseAiTutor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      cancelMessage: jest.fn(),
      addAssistantMessage: jest.fn(),
      setExternalLoading: jest.fn(),
      resetChat: jest.fn(),
    });
    mockedApiFetch.mockImplementation((_endpoint, options) => {
      questionSignal = options?.signal;
      return new Promise(() => undefined);
    });

    const { unmount } = render(<QuizPage />);

    await waitFor(() => expect(questionSignal).toBeInstanceOf(AbortSignal));
    unmount();

    expect(questionSignal?.aborted).toBe(true);
  });

  it('ignores an answer response that resolves after loading another question', async () => {
    const addAssistantMessage = jest.fn();
    const setExternalLoading = jest.fn();
    let nextQuestionRequestCount = 0;
    let resolveAnswer: ((value: Awaited<ReturnType<typeof saveUserAnswer>>) => void) | undefined;

    mockedUseParams.mockReturnValue({ subject_code: 'CIEN', topic_code: 'BIO' });
    mockedUseRouter.mockReturnValue({
      back: jest.fn(),
      push: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    mockedUseAiTutor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      cancelMessage: jest.fn(),
      addAssistantMessage,
      setExternalLoading,
      resetChat: jest.fn(),
    });
    mockedSaveUserAnswer.mockImplementation(() => new Promise((resolve) => {
      resolveAnswer = resolve;
    }));
    mockedApiFetch.mockImplementation(async (endpoint) => {
      if (endpoint === '/ai/hint') return { hint: 'Pista vigente.' };

      nextQuestionRequestCount += 1;
      const isFirstQuestion = nextQuestionRequestCount === 1;
      return {
        kind: 'question',
        question_id: isFirstQuestion ? 101 : 202,
        prompt: isFirstQuestion ? 'Pregunta inicial' : 'Pregunta nueva',
        topic: 'BIO',
        reading_text: null,
        image_url: null,
        correct_choice_id: 1,
        choices: [{ id: 1, label: 'A', text: isFirstQuestion ? 'Respuesta inicial' : 'Respuesta nueva' }],
      };
    });

    const { rerender } = render(<QuizPage />);

    await screen.findByText('Pregunta inicial');
    fireEvent.click(screen.getByRole('button', { name: /Respuesta inicial/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Fijar Respuesta' }));
    await waitFor(() => expect(mockedSaveUserAnswer).toHaveBeenCalledTimes(1));

    mockedUseParams.mockReturnValue({ subject_code: 'CIEN', topic_code: 'QUIM' });
    rerender(<QuizPage />);
    await screen.findByText('Pregunta nueva');

    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    await act(async () => {
      resolveAnswer?.({
        is_correct: true,
        feedback_text: 'Respuesta tardía.',
        ai_payload: null,
        is_attempt_finished: false,
        attempt_id: 9,
      });
    });
    const scheduledDelays = setTimeoutSpy.mock.calls.map(([, delay]) => delay);
    setTimeoutSpy.mockRestore();

    expect(screen.getByText('Pregunta nueva')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Siguiente Desafío' })).not.toBeInTheDocument();
    expect(screen.queryByText('Guardado en PostgreSQL')).not.toBeInTheDocument();
    expect(scheduledDelays).not.toContain(800);
    expect(scheduledDelays).not.toContain(4000);
    expect(addAssistantMessage).not.toHaveBeenCalledWith('Respuesta tardía.');
    expect(setExternalLoading).toHaveBeenLastCalledWith(false);
  });

  it('keeps the current hint active when a stale StrictMode request resolves with the same id', async () => {
    const addAssistantMessage = jest.fn();
    const questionResolvers: Array<(value: object) => void> = [];
    let resolveHint: ((value: { hint: string }) => void) | undefined;

    mockedUseParams.mockReturnValue({ subject_code: 'CIEN', topic_code: 'BIO' });
    mockedUseRouter.mockReturnValue({
      back: jest.fn(),
      push: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    mockedUseAiTutor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      cancelMessage: jest.fn(),
      addAssistantMessage,
      setExternalLoading: jest.fn(),
      resetChat: jest.fn(),
    });
    mockedApiFetch.mockImplementation((endpoint) => {
      if (endpoint === '/ai/hint') {
        return new Promise<{ hint: string }>((resolve) => {
          resolveHint = resolve;
        });
      }

      return new Promise((resolve) => {
        questionResolvers.push(resolve);
      });
    });

    render(
      <StrictMode>
        <QuizPage />
      </StrictMode>,
    );

    await waitFor(() => expect(questionResolvers).toHaveLength(2));

    const question = {
      kind: 'question',
      question_id: 101,
      prompt: '¿Cuál es la función principal de la membrana plasmática?',
      topic: 'BIO',
      reading_text: null,
      image_url: null,
      correct_choice_id: 1,
      choices: [{ id: 1, label: 'A', text: 'Permeabilidad selectiva' }],
    };

    await act(async () => {
      questionResolvers[1](question);
    });
    await waitFor(() => {
      expect(mockedApiFetch.mock.calls.filter(([endpoint]) => endpoint === '/ai/hint')).toHaveLength(1);
    });

    const hintCall = mockedApiFetch.mock.calls.find(([endpoint]) => endpoint === '/ai/hint');
    const signal = hintCall?.[1]?.signal;

    await act(async () => {
      questionResolvers[0]({ ...question });
    });

    expect(signal?.aborted).toBe(false);
    await act(async () => {
      resolveHint?.({ hint: 'Pista vigente.' });
    });
    expect(addAssistantMessage).toHaveBeenCalledWith(
      '**Pista inicial de Tuto:**\nPista vigente.',
    );
  });

  it('requests and displays a fresh hint when consecutive loads return the same question id', async () => {
    const resetChat = jest.fn();
    const addAssistantMessage = jest.fn();
    let hintRequestCount = 0;

    mockedUseParams.mockReturnValue({ subject_code: 'CIEN', topic_code: 'BIO' });
    mockedUseRouter.mockReturnValue({
      back: jest.fn(),
      push: jest.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    mockedUseAiTutor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      cancelMessage: jest.fn(),
      addAssistantMessage,
      setExternalLoading: jest.fn(),
      resetChat,
    });
    mockedSaveUserAnswer.mockResolvedValue({
      is_correct: true,
      feedback_text: 'Bien hecho.',
      ai_payload: null,
      is_attempt_finished: false,
      attempt_id: 7,
    });
    mockedApiFetch.mockImplementation(async (endpoint) => {
      if (endpoint === '/ai/hint') {
        hintRequestCount += 1;
        return { hint: hintRequestCount === 1 ? 'Primera pista.' : 'Pista renovada.' };
      }

      return {
        kind: 'question',
        question_id: 101,
        prompt: '¿Cuál es la función principal de la membrana plasmática?',
        topic: 'BIO',
        reading_text: null,
        image_url: null,
        correct_choice_id: 1,
        choices: [{ id: 1, label: 'A', text: 'Permeabilidad selectiva' }],
      };
    });

    render(<QuizPage />);

    await waitFor(() => {
      expect(addAssistantMessage).toHaveBeenCalledWith(
        '**Pista inicial de Tuto:**\nPrimera pista.',
      );
    });

    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    fireEvent.click(screen.getByRole('button', { name: /Permeabilidad selectiva/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Fijar Respuesta' }));
    });
    const feedbackTimerIndex = setTimeoutSpy.mock.calls.findIndex(([, delay]) => delay === 800);
    const feedbackTimer = setTimeoutSpy.mock.results[feedbackTimerIndex]?.value;

    expect(feedbackTimerIndex).toBeGreaterThanOrEqual(0);
    setTimeoutSpy.mockRestore();
    const nextButton = screen.getByRole('button', { name: 'Siguiente Desafío' });
    fireEvent.click(nextButton);
    expect(clearTimeoutSpy).toHaveBeenCalledWith(feedbackTimer);
    clearTimeoutSpy.mockRestore();

    await waitFor(() => {
      expect(resetChat).toHaveBeenCalledTimes(2);
      expect(mockedApiFetch.mock.calls.filter(([endpoint]) => endpoint === '/ai/hint')).toHaveLength(2);
      expect(addAssistantMessage).toHaveBeenCalledWith(
        '**Pista inicial de Tuto:**\nPista renovada.',
      );
    });

    const hintCallOrders = mockedApiFetch.mock.calls.flatMap(([endpoint], index) =>
      endpoint === '/ai/hint' ? [mockedApiFetch.mock.invocationCallOrder[index]] : [],
    );
    const refreshedHintMessageIndex = addAssistantMessage.mock.calls.findIndex(
      ([message]) => message === '**Pista inicial de Tuto:**\nPista renovada.',
    );

    expect(resetChat.mock.invocationCallOrder[1]).toBeLessThan(hintCallOrders[1]);
    expect(hintCallOrders[1]).toBeLessThan(
      addAssistantMessage.mock.invocationCallOrder[refreshedHintMessageIndex],
    );
  });
});
