import { preprocessMath } from './preprocess-math';

describe('preprocessMath', () => {
  it('convierte bloques LaTeX clásicos \\[ ... \\] a $$ ... $$', () => {
    const input = 'Identidad:\n\\[ a^2 - b^2 = (a-b)(a+b) \\]';
    const output = preprocessMath(input);
    expect(output).toContain('$$\na^2 - b^2 = (a-b)(a+b)\n$$');
  });

  it('convierte fórmulas en línea clásicas \\( ... \\) a $ ... $', () => {
    const input = 'Si tenemos \\( x^2 - 9 \\) entonces \\( a = x \\).';
    const output = preprocessMath(input);
    expect(output).toBe('Si tenemos $x^2 - 9$ entonces $a = x$.');
  });

  it('convierte comandos LaTeX explícitos dentro de paréntesis como (\\frac{x}{y}) a $\\frac{x}{y}$', () => {
    const input = 'Simplifica (\\frac{x^2 - 9}{x - 3}) para continuar.';
    const output = preprocessMath(input);
    expect(output).toBe('Simplifica $\\frac{x^2 - 9}{x - 3}$ para continuar.');
  });

  it('mantiene paréntesis normales de texto sin alterar', () => {
    const input = 'Esta es una aclaración (por ejemplo, en este caso) sin fórmulas.';
    const output = preprocessMath(input);
    expect(output).toBe('Esta es una aclaración (por ejemplo, en este caso) sin fórmulas.');
  });

  it('preserva fórmulas que ya tienen delimitadores estándar $ y $$', () => {
    const input = 'La fórmula es $f(x) = mx + n$ y en bloque:\n\n$$x = \\frac{-b}{2a}$$';
    const output = preprocessMath(input);
    expect(output).toBe(input);
  });
});
