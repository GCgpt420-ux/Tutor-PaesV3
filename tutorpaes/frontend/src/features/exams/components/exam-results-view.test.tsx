import { render, screen, waitFor } from '@testing-library/react';
import { ExamResultsView } from './exam-results-view';
import { getAttemptResults, AttemptResult } from '../api/exams';
import { useProfile } from '@/src/features/profile/hooks/use-profile';

jest.mock('../api/exams');
jest.mock('@/src/features/profile/hooks/use-profile');

jest.mock('@/src/components/ui/markdown-math-renderer', () => ({
  MarkdownMathRenderer: ({ content }: { content: string }) => <span>{content}</span>,
}));

jest.mock('@/src/features/ai/components/AskTutorButton', () => ({
  AskTutorButton: ({ label, contextMessage }: { label?: string; contextMessage: string }) => (
    <button type="button" data-testid="ask-tutor-button" data-context={contextMessage}>
      {label ?? 'Preguntar a la Tuto sobre esto'}
    </button>
  ),
}));

const mockedGetAttemptResults = jest.mocked(getAttemptResults);
const mockedUseProfile = jest.mocked(useProfile);

function buildResults(overrides: Partial<AttemptResult> = {}): AttemptResult {
  return {
    attempt_id: 1,
    exam_id: 1,
    subject_id: 1,
    topic_id: null,
    status: 'completado',
    score: 500,
    total_questions: 10,
    correct_count: 5,
    started_at: '2026-10-01T00:00:00Z',
    completed_at: '2026-10-01T00:10:00Z',
    answers_detail: [
      {
        question_id: 1,
        prompt: '¿Cuánto es 2+2?',
        reading_text: null,
        selected_choice_id: 1,
        selected_choice_text: '5',
        correct_choice_id: 2,
        correct_choice_text: '4',
        is_correct: false,
        ai_explanation: null,
      },
      {
        question_id: 2,
        prompt: '¿Capital de Chile?',
        reading_text: null,
        selected_choice_id: 3,
        selected_choice_text: 'Santiago',
        correct_choice_id: 3,
        correct_choice_text: 'Santiago',
        is_correct: true,
        ai_explanation: null,
      },
    ],
    ...overrides,
  };
}

describe('ExamResultsView', () => {
  beforeEach(() => {
    mockedUseProfile.mockReturnValue({ data: undefined } as ReturnType<typeof useProfile>);
  });

  it('muestra el puntaje PAES clampeado a la escala 100-1000', async () => {
    mockedGetAttemptResults.mockResolvedValue(buildResults({ score: 500 }));

    render(<ExamResultsView attemptId={1} />);

    await waitFor(() => expect(screen.getByText('500')).toBeInTheDocument());
    expect(screen.getByText(/Puntaje PAES estimado/i)).toBeInTheDocument();
  });

  it('nunca muestra un puntaje bajo el mínimo de la escala (100)', async () => {
    mockedGetAttemptResults.mockResolvedValue(buildResults({ score: 0 }));

    render(<ExamResultsView attemptId={1} />);

    await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument());
  });

  it('muestra el botón de la Tuto solo en las preguntas falladas', async () => {
    mockedGetAttemptResults.mockResolvedValue(buildResults());

    render(<ExamResultsView attemptId={1} />);

    await waitFor(() => expect(screen.getAllByTestId('ask-tutor-button').length).toBeGreaterThan(0));

    // 1 botón "Repasar con la Tuto" (hero) + 1 botón por pregunta fallada (hay 1 de 2)
    const buttons = screen.getAllByTestId('ask-tutor-button');
    expect(buttons).toHaveLength(2);
    expect(buttons.some((b) => b.dataset.context?.includes('¿Cuánto es 2+2?'))).toBe(true);
  });

  it('no ofrece repaso con la Tuto si el alumno respondió todo correctamente', async () => {
    mockedGetAttemptResults.mockResolvedValue(
      buildResults({
        correct_count: 1,
        total_questions: 1,
        answers_detail: [
          {
            question_id: 1,
            prompt: 'ok',
            reading_text: null,
            selected_choice_id: 1,
            selected_choice_text: 'A',
            correct_choice_id: 1,
            correct_choice_text: 'A',
            is_correct: true,
            ai_explanation: null,
          },
        ],
      }),
    );

    render(<ExamResultsView attemptId={1} />);

    await waitFor(() => expect(screen.getByText('500')).toBeInTheDocument());
    expect(screen.queryByTestId('ask-tutor-button')).not.toBeInTheDocument();
  });

  it('muestra la meta del alumno en la barra de contexto cuando está disponible', async () => {
    mockedGetAttemptResults.mockResolvedValue(buildResults());
    mockedUseProfile.mockReturnValue({ data: { target_score: 780 } } as ReturnType<typeof useProfile>);

    render(<ExamResultsView attemptId={1} />);

    await waitFor(() => expect(screen.getByText(/780 pts · tu meta/i)).toBeInTheDocument());
  });
});
