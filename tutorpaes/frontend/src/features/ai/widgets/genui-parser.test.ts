import { cleanTextForSpeech, parseGenUISegments, parseWidgetArgs } from './genui-parser';

describe('parseWidgetArgs', () => {
  it('parsea query-params con coerción de tipos', () => {
    expect(parseWidgetArgs('a=1&b=-4&c=3&show_vertex=true')).toEqual({
      a: 1,
      b: -4,
      c: 3,
      show_vertex: true,
    });
  });

  it('soporta separador ; como alternativa a &', () => {
    expect(parseWidgetArgs('a=1;b=2')).toEqual({ a: 1, b: 2 });
  });

  it('parsea JSON cuando el argumento es un objeto', () => {
    expect(parseWidgetArgs('{"a": 1, "show_roots": false}')).toEqual({ a: 1, show_roots: false });
  });

  it('devuelve objeto vacío para argumentos vacíos', () => {
    expect(parseWidgetArgs('')).toEqual({});
    expect(parseWidgetArgs('   ')).toEqual({});
  });

  it('cae a query-params si el JSON es inválido', () => {
    expect(parseWidgetArgs('{a=1}')).toEqual({ '{a': '1}' });
  });
});

describe('parseGenUISegments', () => {
  it('devuelve un único segmento de texto cuando no hay marcadores', () => {
    expect(parseGenUISegments('hola $x^2$')).toEqual([{ type: 'text', content: 'hola $x^2$' }]);
  });

  it('separa texto y un widget completo', () => {
    const content = 'Mira esto:\n\n[WIDGET:PARABOLA|a=1&b=-4&c=3]\n\n¿Qué opinas?';
    const segments = parseGenUISegments(content);

    expect(segments).toEqual([
      { type: 'text', content: 'Mira esto:\n\n' },
      { type: 'widget', name: 'PARABOLA', args: { a: 1, b: -4, c: 3 } },
      { type: 'text', content: '\n\n¿Qué opinas?' },
    ]);
  });

  it('detecta un marcador incompleto al final del stream como widget-streaming', () => {
    const content = 'Observa la curva:\n\n[WIDGET:PAR';
    const segments = parseGenUISegments(content);

    expect(segments).toEqual([
      { type: 'text', content: 'Observa la curva:\n\n' },
      { type: 'widget-streaming', name: 'PAR' },
    ]);
  });

  it('maneja múltiples widgets completos en el mismo mensaje', () => {
    const content = '[WIDGET:PARABOLA|a=1] y luego [WIDGET:FRACTION_BAR|num=1&den=2]';
    const segments = parseGenUISegments(content);

    expect(segments).toEqual([
      { type: 'widget', name: 'PARABOLA', args: { a: 1 } },
      { type: 'text', content: ' y luego ' },
      { type: 'widget', name: 'FRACTION_BAR', args: { num: 1, den: 2 } },
    ]);
  });
});

describe('cleanTextForSpeech', () => {
  it('elimina marcadores completos antes de sintetizar voz', () => {
    expect(cleanTextForSpeech('Mira esto: [WIDGET:PARABOLA|a=1] ¿lo ves?')).toBe(
      'Mira esto:  ¿lo ves?',
    );
  });

  it('elimina un marcador incompleto al final del stream', () => {
    expect(cleanTextForSpeech('Observa la curva: [WIDGET:PAR')).toBe('Observa la curva:');
  });

  it('no modifica texto sin marcadores', () => {
    expect(cleanTextForSpeech('Texto normal sin widgets')).toBe('Texto normal sin widgets');
  });
});
