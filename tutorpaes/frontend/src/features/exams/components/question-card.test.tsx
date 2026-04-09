import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionCard } from './question-card';

// Mock simple de next/image y AiExplanation para aislar la prueba unitaria
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || "mocked image"} />;
  },
}));

jest.mock('./AiExplanation', () => ({
  AiExplanation: () => <div data-testid="ai-explanation-mock" />,
}));

describe('QuestionCard (Accesibility & Render Test)', () => {
  const mockQuestion = {
    question_id: 101,
    prompt: '¿Cuál es la capital de Chile?',
    reading_text: 'Contexto de prueba',
    difficulty: 'facil',
    topic_id: 1,
  };

  const distractors = ['Buenos Aires', 'Lima', 'Bogotá'];
  const correctAnswer = 'Santiago';

  it('renderiza la pregunta core y sus opciones accesibles', () => {
    const handleAnswerSelected = jest.fn();

    render(
      <QuestionCard
        question={mockQuestion}
        correctAnswer={correctAnswer}
        distractors={distractors}
        selectedAnswer={null}
        onAnswerSelected={handleAnswerSelected}
      />
    );

    // Verifica que el prompt se leyó y el fieldset legend existe
    expect(screen.getByText('¿Cuál es la capital de Chile?')).toBeInTheDocument();
    expect(screen.getByText(/Insertar Coordenada Optima/i)).toBeInTheDocument();

    // Validar que las opciones sean input radios seleccionables (cumpliendo a11y)
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(4); // 3 distractores + 1 correcta

    // Evento click a la primera opción descubierta en el DOM (aleatoria)
    const firstRadio = radios[0];
    fireEvent.click(firstRadio);

    // Aseverar que el callback de respuesta del padre fue notificado
    expect(handleAnswerSelected).toHaveBeenCalledTimes(1);
  });
});
