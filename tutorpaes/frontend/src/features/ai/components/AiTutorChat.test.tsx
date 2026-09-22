import { render, screen } from '@testing-library/react';
import { AiTutorChat } from './AiTutorChat';
import { useVoice } from '@/src/hooks/useVoice';

jest.mock('@/src/hooks/useVoice', () => ({
  useVoice: jest.fn(),
}));

jest.mock('../hooks/use-ai-tutor', () => ({
  useAiTutor: () => ({
    messages: [],
    loading: false,
    error: null,
    sendMessage: jest.fn(),
  }),
}));

jest.mock('@/src/components/ui/markdown-math-renderer', () => ({
  MarkdownMathRenderer: ({ content }: { content: string }) => <span>{content}</span>,
}));

const mockedUseVoice = jest.mocked(useVoice);

describe('AiTutorChat', () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollTo = jest.fn();
    mockedUseVoice.mockReturnValue({
      isRecording: false,
      isProcessing: false,
      isPlaying: false,
      error: null,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      speak: jest.fn(),
      stopSpeaking: jest.fn(),
    });
  });

  it('names the message field and icon controls in the default state', () => {
    render(<AiTutorChat />);

    const input = screen.getByRole('textbox', { name: 'Mensaje para Tuto' });
    const microphone = screen.getByRole('button', { name: 'Iniciar dictado' });
    const send = screen.getByRole('button', { name: 'Enviar mensaje' });

    expect(input).toHaveAttribute('placeholder', 'Pregunta algo sobre este ejercicio…');
    expect(microphone).toHaveAttribute('type', 'button');
    expect(microphone.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(send).toHaveAttribute('type', 'button');
    expect(send.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it.each([
    [true, false, 'Escuchando…', 'Detener dictado'],
    [false, true, 'Procesando voz…', 'Iniciar dictado'],
  ])(
    'preserves the dynamic voice placeholder for recording=%s and processing=%s',
    (isRecording, isProcessing, placeholder, microphoneLabel) => {
      mockedUseVoice.mockReturnValue({
        isRecording,
        isProcessing,
        isPlaying: false,
        error: null,
        startRecording: jest.fn(),
        stopRecording: jest.fn(),
        speak: jest.fn(),
        stopSpeaking: jest.fn(),
      });

      render(<AiTutorChat />);

      expect(screen.getByRole('textbox', { name: 'Mensaje para Tuto' })).toHaveAttribute(
        'placeholder',
        placeholder,
      );
      expect(screen.getByRole('button', { name: microphoneLabel })).toBeInTheDocument();
    },
  );

  it('muestra los errores de micrófono o audio del hook de voz', () => {
    mockedUseVoice.mockReturnValue({
      isRecording: false,
      isProcessing: false,
      isPlaying: false,
      error: 'No se pudo acceder al micrófono.',
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      speak: jest.fn(),
      stopSpeaking: jest.fn(),
    });

    render(<AiTutorChat />);

    expect(screen.getByText('No se pudo acceder al micrófono.')).toBeInTheDocument();
  });
});
