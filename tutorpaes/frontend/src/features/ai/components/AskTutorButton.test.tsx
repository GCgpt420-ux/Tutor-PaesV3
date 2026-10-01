import { render, screen, fireEvent } from '@testing-library/react';
import { AskTutorButton } from './AskTutorButton';
import { useAiTutor } from '../hooks/use-ai-tutor';

jest.mock('../hooks/use-ai-tutor');

jest.mock('./AiTutorChat', () => ({
  AiTutorChat: () => <div data-testid="ai-tutor-chat" />,
}));

const mockedUseAiTutor = jest.mocked(useAiTutor);

describe('AskTutorButton', () => {
  const sendMessage = jest.fn();

  beforeEach(() => {
    sendMessage.mockClear();
    mockedUseAiTutor.mockReturnValue({
      messages: [],
      loading: false,
      error: null,
      sendMessage,
      cancelMessage: jest.fn(),
      addAssistantMessage: jest.fn(),
      setExternalLoading: jest.fn(),
      resetChat: jest.fn(),
    });
  });

  it('muestra solo el botón de disparo mientras no se abre', () => {
    render(<AskTutorButton contextMessage="contexto oculto" />);

    expect(screen.getByRole('button', { name: /preguntar a la tuto/i })).toBeInTheDocument();
    expect(screen.queryByTestId('ai-tutor-chat')).not.toBeInTheDocument();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('al hacer clic abre el chat y envía el contexto oculto una sola vez', () => {
    render(
      <AskTutorButton
        contextMessage="El alumno respondió B, la correcta es A."
        attemptId="42"
        questionContext={{ question_id: 7 }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /preguntar a la tuto/i }));

    expect(screen.getByTestId('ai-tutor-chat')).toBeInTheDocument();
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      'El alumno respondió B, la correcta es A.',
      '42',
      { question_id: 7 },
      { hidden: true },
    );
  });
});
