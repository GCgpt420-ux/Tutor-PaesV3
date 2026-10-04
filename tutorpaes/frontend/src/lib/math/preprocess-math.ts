/**
 * Preprocesa el contenido de texto para normalizar delimitadores matemáticos
 * antes de pasarlo a remark-math / rehype-katex:
 * 1. Convierte bloques LaTeX clásicos \[ ... \] a $$ ... $$
 * 2. Convierte fórmulas en línea clásicas \( ... \) a $ ... $
 * 3. Corrige paréntesis que envuelven comandos LaTeX explícitos como (\frac{...}{...}) a $\frac{...}{...}$
 */
export function preprocessMath(content: string): string {
  if (!content) return '';

  let text = content;

  // 1. Bloques LaTeX clásicos: \[ math \] -> $$ math $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n\n$$\n${math.trim()}\n$$\n\n`);

  // 2. Fórmulas en línea LaTeX clásicas: \( math \) -> $ math $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 3. Paréntesis que envuelven comandos explícitos de LaTeX: (\frac{...}{...}) -> $\frac{...}{...}$
  text = text.replace(
    /\(\s*(\\?[a-zA-Z0-9_\s+\-*\/^]*?\\(?:frac|sqrt|pm|cdot|times|alpha|beta|pi|Delta|theta|int|sum|approx|neq|leq|geq)[a-zA-Z0-9_\s+\-*\/^\\{}]*?)\s*\)/g,
    (_, math) => `$${math.trim()}$`
  );

  return text;
}
