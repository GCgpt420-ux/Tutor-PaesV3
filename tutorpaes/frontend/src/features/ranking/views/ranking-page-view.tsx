"use client";

import { useEffect, useMemo, useState } from "react";
import { Trophy, Medal, Award, Loader2, TrendingUp, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/src/lib/api/client";

type RankingEntry = {
  rank: number;
  user_id: number;
  name: string;
  total_attempts: number;
  average_score: number;
  best_score: number;
  accuracy: number;
};

function rankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-300 drop-shadow-[0_0_10px_rgba(203,213,225,0.5)]" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />;
  return <span className="text-xs font-mono font-bold text-text-tertiary">#{rank}</span>;
}

export function RankingPageView() {
  const [rows, setRows] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<RankingEntry[]>("/users/ranking?limit=50");
        setRows(data || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "No se pudo cargar el ranking";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const podium = useMemo(() => rows.slice(0, 3), [rows]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-4 text-brand-primary">
          <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em]">Tabulando Posiciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 text-white animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-6 mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-5 w-5 text-brand-primary animate-pulse" />
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-brand-primary">
            Líderes de Operación / Competencia Nacional
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-text-primary uppercase tracking-tight">
          Ranking General
        </h1>
        <p className="text-text-tertiary font-medium mt-1">
          Posiciones actualizadas en tiempo real de acuerdo a puntaje promedio, precisión y volumen de ensayos.
        </p>
      </div>

      {error && (
        <div className="glass-card p-6 border-brand-danger/30 bg-brand-danger/5 flex items-start gap-4 animate-error-shake">
          <AlertTriangle className="h-6 w-6 text-brand-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-brand-danger font-black uppercase tracking-widest text-sm">Alerta del Sistema</p>
            <p className="text-text-secondary text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Podium (Top 3) */}
      {podium.length > 0 && (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {podium.map((entry) => {
            const isFirst = entry.rank === 1;
            const borderColors = isFirst 
              ? "border-yellow-500/30 hover:border-yellow-500/50" 
              : entry.rank === 2 
                ? "border-slate-400/30 hover:border-slate-400/50" 
                : "border-amber-600/30 hover:border-amber-600/50";

            return (
              <article 
                key={entry.user_id} 
                className={`glass-card p-6 border ${borderColors} bg-surface-base/80 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-brand-primary/5 blur-[30px] rounded-full" />
                
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {rankIcon(entry.rank)}
                    <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                      Puesto {entry.rank}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-text-tertiary bg-white/5 border border-white/5 px-2 py-0.5">
                    {entry.total_attempts} ensayos
                  </span>
                </div>

                <h2 className="text-xl font-black text-text-primary uppercase tracking-tight truncate group-hover:text-brand-primary transition-colors">
                  {entry.name}
                </h2>

                <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="bg-black/30 border border-white/5 p-3 rounded-xl text-center">
                    <p className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-wider">Promedio</p>
                    <p className="mt-1 text-lg font-black text-brand-primary tracking-tighter">{Math.round(entry.average_score)}</p>
                  </div>
                  <div className="bg-black/30 border border-white/5 p-3 rounded-xl text-center">
                    <p className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-wider">Precisión</p>
                    <p className="mt-1 text-lg font-black text-brand-accent tracking-tighter">{Math.round(entry.accuracy)}%</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Main Ranking Table */}
      <section className="bg-black/20 border border-white/5 p-8 rounded-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-accent" />
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Tabla de Posiciones</h3>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{rows.length} competidores</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-text-tertiary uppercase font-mono tracking-widest text-[9px]">
                <th className="py-3 px-3">Pos</th>
                <th className="py-3 px-3">Estudiante</th>
                <th className="py-3 px-3 text-center">Promedio (Pts)</th>
                <th className="py-3 px-3 text-center">Máximo Histórico</th>
                <th className="py-3 px-3 text-center">Precisión</th>
                <th className="py-3 px-3 text-right">Ensayos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((entry) => (
                <tr key={entry.user_id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-3 font-mono font-bold text-text-tertiary">
                    {rankIcon(entry.rank)}
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-text-primary uppercase tracking-tight">{entry.name}</div>
                  </td>
                  <td className="py-4 px-3 text-center font-mono font-black text-brand-primary">
                    {Math.round(entry.average_score)}
                  </td>
                  <td className="py-4 px-3 text-center font-mono font-bold text-zinc-300">
                    {entry.best_score}
                  </td>
                  <td className="py-4 px-3 text-center font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      entry.accuracy >= 60 
                        ? 'text-green-400 bg-green-500/10 border border-green-500/20' 
                        : 'text-brand-danger bg-brand-danger/10 border border-brand-danger/20'
                    }`}>
                      {Math.round(entry.accuracy)}%
                    </span>
                  </td>
                  <td className="py-4 px-3 text-right font-mono text-text-secondary">
                    {entry.total_attempts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
