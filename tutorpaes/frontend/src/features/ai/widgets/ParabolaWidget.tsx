'use client';

interface ParabolaWidgetProps {
  a?: number;
  b?: number;
  c?: number;
  show_vertex?: boolean;
  show_roots?: boolean;
  title?: string;
}

const VIEW_SIZE = 280;
const PADDING = 28;
const SAMPLES = 60;

function formatTerm(coef: number, variable: string): string {
  const sign = coef >= 0 ? '+' : '-';
  return `${sign} ${Math.abs(coef)}${variable}`;
}

export function ParabolaWidget({
  a = 1,
  b = 0,
  c = 0,
  show_vertex = true,
  show_roots = true,
  title,
}: ParabolaWidgetProps) {
  if (!Number.isFinite(a) || a === 0) {
    return (
      <div className="my-2 rounded-xl border border-white/10 bg-surface-container/60 p-4 text-sm text-text-secondary">
        No se puede graficar: el coeficiente <code className="text-text-primary">a</code> debe ser distinto de cero.
      </div>
    );
  }

  const vertexX = -b / (2 * a);
  const vertexY = a * vertexX ** 2 + b * vertexX + c;
  const discriminant = b ** 2 - 4 * a * c;
  const roots =
    discriminant >= 0
      ? [(-b + Math.sqrt(discriminant)) / (2 * a), (-b - Math.sqrt(discriminant)) / (2 * a)]
      : [];

  const spread = Math.max(
    Math.abs(vertexX) * 1.6,
    ...roots.map((r) => Math.abs(r - vertexX) * 1.8),
    4,
  );
  const xMin = vertexX - spread;
  const xMax = vertexX + spread;
  const xRange = xMax - xMin || 1;

  const points: Array<[number, number]> = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const x = xMin + (xRange * i) / SAMPLES;
    return [x, a * x ** 2 + b * x + c];
  });

  const yValues = points.map(([, y]) => y);
  const yMin = Math.min(...yValues, vertexY, 0);
  const yMax = Math.max(...yValues, vertexY, 0);
  const yRange = yMax - yMin || 1;

  const toScreenX = (x: number) => PADDING + ((x - xMin) / xRange) * (VIEW_SIZE - 2 * PADDING);
  const toScreenY = (y: number) =>
    VIEW_SIZE - PADDING - ((y - yMin) / yRange) * (VIEW_SIZE - 2 * PADDING);

  const pathD = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${toScreenX(x).toFixed(1)} ${toScreenY(y).toFixed(1)}`)
    .join(' ');

  const zeroY = toScreenY(0);
  const zeroX = toScreenX(0);
  const ariaLabel = title ?? `Parábola a=${a}, b=${b}, c=${c}`;

  return (
    <div className="my-2 w-full max-w-xs rounded-xl border border-white/10 bg-surface-container/60 p-4">
      {title && <p className="mb-2 text-xs font-semibold text-text-primary">{title}</p>}
      <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
        <line x1={PADDING} y1={zeroY} x2={VIEW_SIZE - PADDING} y2={zeroY} className="stroke-white/15" strokeWidth={1} />
        <line x1={zeroX} y1={PADDING} x2={zeroX} y2={VIEW_SIZE - PADDING} className="stroke-white/15" strokeWidth={1} />

        <path d={pathD} fill="none" className="stroke-chart-2" strokeWidth={2.5} strokeLinecap="round" />

        {show_roots &&
          roots.map((r, i) => (
            <circle key={i} cx={toScreenX(r)} cy={zeroY} r={4} className="fill-chart-4" data-testid="parabola-root" />
          ))}

        {show_vertex && (
          <>
            <circle
              cx={toScreenX(vertexX)}
              cy={toScreenY(vertexY)}
              r={4.5}
              className="fill-brand-primary"
              data-testid="parabola-vertex"
            />
            <text
              x={toScreenX(vertexX)}
              y={toScreenY(vertexY) - 10}
              textAnchor="middle"
              className="fill-text-secondary text-[9px]"
            >
              V({vertexX.toFixed(1)}, {vertexY.toFixed(1)})
            </text>
          </>
        )}
      </svg>
      <p className="mt-2 text-[11px] text-text-tertiary">
        f(x) = {a}x² {formatTerm(b, 'x')} {formatTerm(c, '')}
      </p>
    </div>
  );
}
