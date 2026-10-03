import { render, screen, fireEvent } from '@testing-library/react';
import { TopicStudyModal } from './topic-study-modal';

jest.mock('@/src/components/ui/markdown-math-renderer', () => ({
  MarkdownMathRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));

describe('TopicStudyModal', () => {
  it('no renderiza nada cuando open es false', () => {
    render(
      <TopicStudyModal
        open={false}
        onClose={jest.fn()}
        subjectCode="M1"
        topicCode="ALG"
        topicName="Álgebra"
        onPractice={jest.fn()}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra el nombre del tema y arranca en la pestaña de Conceptos Clave', () => {
    render(
      <TopicStudyModal
        open
        onClose={jest.fn()}
        subjectCode="M1"
        topicCode="ALG"
        topicName="Álgebra"
        onPractice={jest.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Álgebra')).toBeInTheDocument();
    expect(screen.getByText(/Función afín y lineal/i)).toBeInTheDocument();
  });

  it('cambia de pestaña a Trampas DEMRE y muestra las trampas del tema', () => {
    render(
      <TopicStudyModal
        open
        onClose={jest.fn()}
        subjectCode="M1"
        topicCode="ALG"
        topicName="Álgebra"
        onPractice={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Trampas DEMRE/i }));
    expect(screen.getByText('Confundir pendiente con intercepto')).toBeInTheDocument();
  });

  it('usa la ficha genérica cuando no hay datos curados para el tema', () => {
    render(
      <TopicStudyModal
        open
        onClose={jest.fn()}
        subjectCode="CIEN"
        topicCode="BIO"
        topicName="Biología"
        onPractice={jest.fn()}
      />,
    );

    expect(screen.getByText(/Aún no tenemos una ficha de conceptos específica/i)).toBeInTheDocument();
  });

  it('la pestaña Practicar llama a onPractice al hacer clic', () => {
    const onPractice = jest.fn();
    render(
      <TopicStudyModal
        open
        onClose={jest.fn()}
        subjectCode="M1"
        topicCode="ALG"
        topicName="Álgebra"
        onPractice={onPractice}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Practicar$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Comenzar a practicar/i }));
    expect(onPractice).toHaveBeenCalledTimes(1);
  });

  it('cierra al hacer clic en el botón de cerrar', () => {
    const onClose = jest.fn();
    render(
      <TopicStudyModal
        open
        onClose={onClose}
        subjectCode="M1"
        topicCode="ALG"
        topicName="Álgebra"
        onPractice={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Cerrar ficha de estudio/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
