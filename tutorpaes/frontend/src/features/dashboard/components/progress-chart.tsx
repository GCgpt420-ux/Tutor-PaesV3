'use client';

import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';

interface AttemptData {
  id: string;
  score_total: number;
  finished_at: string;
}

interface ProgressChartProps {
  attempts: AttemptData[];
}

export function ProgressChart({ attempts }: ProgressChartProps) {
  const chartData = useMemo(() => {
    if (attempts.length === 0) return null;

    // Agrupar por semana
    const weeklyData = new Map<string, number[]>();

    attempts.forEach((attempt) => {
      const date = new Date(attempt.finished_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, []);
      }
      weeklyData.get(weekKey)!.push(attempt.score_total);
    });

    // Calcular promedio por semana
    const weeks = Array.from(weeklyData.entries())
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .slice(-8) // Últimas 8 semanas
      .map(([key, scores]) => {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const date = new Date(key);
        const label = `Sem ${date.getDate()}`;
        return { label, score: avg, date: key };
      });

    // Encontrar máximo y mínimo para escalar
    const scores = weeks.map((w) => w.score);
    const max = Math.max(...scores, 1000);
    const min = 0;

    return { weeks, max, min };
  }, [attempts]);

  if (!chartData || chartData.weeks.length === 0) {
    return (
      <div className="glass-card p-6">
        <p className="text-zinc-500 text-center py-12 font-medium">
          No hay datos suficientes para mostrar el gráfico
        </p>
      </div>
    );
  }

  const { weeks, max } = chartData;
  const range = max - 0;

  return (
    <div className="glass-card p-6 border-brand-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-primary" />
            Progreso por Semana
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-medium tracking-wide">Promedio de puntaje PAES</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Tendencia</p>
          <p className="text-xs text-zinc-500">Últimas 8 semanas</p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="flex items-end justify-between gap-2 h-64 mb-6">
        {weeks.map((week, idx) => {
          const height = ((week.score - 0) / range) * 100;
          const isIncreasing = idx === 0 || week.score >= weeks[idx - 1].score;

          return (
            <div key={week.date} className="flex flex-col items-center flex-1">
              {/* Barra */}
              <div className="w-full flex items-end justify-center mb-2 h-40">
                <div
                  className={`w-full rounded-sm transition-all hover:opacity-100 opacity-70 cursor-pointer group relative ${
                    isIncreasing
                      ? 'bg-gradient-to-t from-green-500/80 to-emerald-400 hover:shadow-[0_0_15px_rgba(52,211,153,0.6)]'
                      : 'bg-gradient-to-t from-brand-primary/80 to-cyan-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                  }`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/90 border border-white/10 text-white px-3 py-1.5 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl backdrop-blur-md">
                    {week.score}
                  </div>
                </div>
              </div>

              {/* Label */}
              <div className="text-center mt-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{week.label}</p>
                <p className="text-xs text-zinc-500 font-medium">{week.score}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-white/10">
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
          <p className="text-xs text-zinc-400 mb-2 font-bold tracking-wide uppercase">Máximo</p>
          <p className="text-2xl font-black text-green-400">{Math.max(...weeks.map((w) => w.score))}</p>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-primary/5" />
          <p className="text-xs text-zinc-400 mb-2 font-bold tracking-wide uppercase relative z-10">Promedio</p>
          <p className="text-2xl font-black text-brand-primary relative z-10">
            {Math.round(weeks.reduce((sum, w) => sum + w.score, 0) / weeks.length)}
          </p>
        </div>
        <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
          <p className="text-xs text-zinc-400 mb-2 font-bold tracking-wide uppercase">Mínimo</p>
          <p className="text-2xl font-black text-orange-400">{Math.min(...weeks.map((w) => w.score))}</p>
        </div>
      </div>
    </div>
  );
}
