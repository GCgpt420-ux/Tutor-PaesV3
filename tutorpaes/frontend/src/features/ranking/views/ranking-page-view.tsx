"use client";

import { useEffect, useMemo, useState } from "react";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
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
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-slate-300" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-500" />;
  return <span className="text-sm font-bold text-text-tertiary">#{rank}</span>;
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
      <div className="flex min-h-[45vh] items-center justify-center">
        <div className="glass-card flex items-center gap-3 px-5 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
          <span className="text-text-secondary">Cargando ranking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="section-kicker">Competencia Real</p>
        <h1 className="section-title">Ranking PAES</h1>
        <p className="max-w-2xl text-text-secondary">
          Posiciones calculadas con datos reales de la base de datos: promedio de puntaje,
          precision y volumen de ensayos completados.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-text-secondary">
          {error}
        </div>
      )}

      {podium.length > 0 && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {podium.map((entry) => (
            <article key={entry.user_id} className="glass-card-strong p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {rankIcon(entry.rank)}
                  <span className="text-sm uppercase tracking-wider text-text-tertiary">Puesto {entry.rank}</span>
                </div>
                <span className="rounded-full border border-surface-container bg-surface-default px-2 py-1 text-xs text-text-secondary">
                  {entry.total_attempts} ensayos
                </span>
              </div>
              <h2 className="text-xl font-bold text-text-primary">{entry.name}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-surface-container bg-surface-default p-3">
                  <p className="text-xs uppercase tracking-wide text-text-tertiary">Promedio</p>
                  <p className="mt-1 text-lg font-bold text-brand-primary">{entry.average_score}</p>
                </div>
                <div className="rounded-lg border border-surface-container bg-surface-default p-3">
                  <p className="text-xs uppercase tracking-wide text-text-tertiary">Precision</p>
                  <p className="mt-1 text-lg font-bold text-brand-accent">{entry.accuracy}%</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="glass-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">Tabla Completa</h3>
          <span className="text-xs uppercase tracking-wider text-text-tertiary">{rows.length} participantes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-text-tertiary">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Estudiante</th>
                <th className="px-3 py-2">Promedio</th>
                <th className="px-3 py-2">Mejor Puntaje</th>
                <th className="px-3 py-2">Precision</th>
                <th className="px-3 py-2">Ensayos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.user_id} className="rounded-xl border border-surface-container bg-surface-raised/70">
                  <td className="px-3 py-3">{rankIcon(entry.rank)}</td>
                  <td className="px-3 py-3 font-semibold text-text-primary">{entry.name}</td>
                  <td className="px-3 py-3 text-brand-primary font-semibold">{entry.average_score}</td>
                  <td className="px-3 py-3 text-text-secondary">{entry.best_score}</td>
                  <td className="px-3 py-3 text-brand-accent">{entry.accuracy}%</td>
                  <td className="px-3 py-3 text-text-secondary">{entry.total_attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
