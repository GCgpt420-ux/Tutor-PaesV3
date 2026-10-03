import { render, screen } from '@testing-library/react';
import { ParabolaWidget } from './ParabolaWidget';

describe('ParabolaWidget', () => {
  it('renderiza el título y el svg con las raíces y el vértice por defecto', () => {
    render(<ParabolaWidget a={1} b={-4} c={3} title="f(x) = x² - 4x + 3" />);

    expect(screen.getByText('f(x) = x² - 4x + 3')).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getAllByTestId('parabola-root')).toHaveLength(2);
    expect(screen.getByTestId('parabola-vertex')).toBeInTheDocument();
  });

  it('oculta las raíces y el vértice cuando se desactivan', () => {
    render(<ParabolaWidget a={1} b={-4} c={3} show_roots={false} show_vertex={false} />);

    expect(screen.queryByTestId('parabola-root')).not.toBeInTheDocument();
    expect(screen.queryByTestId('parabola-vertex')).not.toBeInTheDocument();
  });

  it('no dibuja raíces cuando el discriminante es negativo', () => {
    render(<ParabolaWidget a={1} b={0} c={5} />);

    expect(screen.queryByTestId('parabola-root')).not.toBeInTheDocument();
  });

  it('muestra un mensaje de error cuando a es 0', () => {
    render(<ParabolaWidget a={0} b={2} c={1} />);

    expect(screen.getByText(/distinto de cero/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
