import { render, screen } from '@testing-library/react';
import { GenUIMessageRenderer } from './GenUIMessageRenderer';

jest.mock('@/src/components/ui/markdown-math-renderer', () => ({
  MarkdownMathRenderer: ({ content }: { content: string }) => <span>{content}</span>,
}));

jest.mock('../widgets/ParabolaWidget', () => ({
  ParabolaWidget: (props: Record<string, unknown>) => (
    <div data-testid="parabola-widget">{JSON.stringify(props)}</div>
  ),
}));

describe('GenUIMessageRenderer', () => {
  it('renderiza texto plano sin marcadores a través de MarkdownMathRenderer', () => {
    render(<GenUIMessageRenderer content="hola $x^2$" />);
    expect(screen.getByText('hola $x^2$')).toBeInTheDocument();
  });

  it('monta el widget registrado cuando el marcador está completo', () => {
    render(<GenUIMessageRenderer content={'Mira:\n\n[WIDGET:PARABOLA|a=1&b=-4&c=3]'} />);

    expect(screen.getByTestId('parabola-widget')).toHaveTextContent('"a":1');
    expect(screen.getByTestId('parabola-widget')).toHaveTextContent('"b":-4');
  });

  it('muestra un skeleton mientras el marcador sigue en streaming', () => {
    render(<GenUIMessageRenderer content="Observa esto: [WIDGET:PAR" />);

    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
    expect(screen.queryByTestId('parabola-widget')).not.toBeInTheDocument();
  });

  it('muestra un aviso para widgets no reconocidos en el catálogo', () => {
    render(<GenUIMessageRenderer content="[WIDGET:UNKNOWN_THING|x=1]" />);

    expect(screen.getByText(/no reconocido/i)).toBeInTheDocument();
  });
});
