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
  });

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
