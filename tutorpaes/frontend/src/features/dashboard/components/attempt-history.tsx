import { CheckCircle2, XCircle, SkipForward, History, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

interface AttemptData {
  id: string;
  exam_id: string;
  exam_title: string;
  score_total: number;
  correct_count: number;
  incorrect_count: number;
  omitted_count: number;
  finished_at: string;
  accuracy: number;
}

interface AttemptHistoryProps {
  attempts: AttemptData[];
}

export function AttemptHistory({ attempts }: AttemptHistoryProps) {
  if (attempts.length === 0) {
    return null;
  }

  // Agrupar por mes
  const groupedByMonth = new Map<string, AttemptData[]>();
  attempts.forEach((attempt) => {
    const date = new Date(attempt.finished_at);
    const monthKey = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
    if (!groupedByMonth.has(monthKey)) {
      groupedByMonth.set(monthKey, []);
    }
    groupedByMonth.get(monthKey)!.push(attempt);
  });

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <History className="h-5 w-5 text-brand-primary" />
          Historial de Intentos
        </h3>
        <p className="text-xs text-zinc-400 font-medium">{attempts.length} ensayos completados</p>
      </div>

      {/* Listado por mes */}
      <div className="space-y-6">
        {Array.from(groupedByMonth.entries()).map(([month, monthAttempts]) => (
          <div key={month}>
            {/* Nombre del mes */}
            <h4 className="text-sm font-bold text-brand-secondary mb-3 pb-2 border-b border-white/10 capitalize tracking-wide">
              {month}
            </h4>

            {/* Intentos del mes */}
            <div className="space-y-3">
              {monthAttempts.map((attempt, idx) => {
                const date = new Date(attempt.finished_at);
                const time = date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                const dateStr = date.toLocaleDateString('es-CL', { day: 'numeric', weekday: 'short' });
                
                // Comparar con intento anterior si existe
                const prevAccuracy = attempts[attempts.indexOf(attempt) - 1]?.accuracy || attempt.accuracy;
                const isImproving = attempt.accuracy > prevAccuracy;

                return (
                  <Link key={attempt.id} href={`/protected/ensayos/${attempt.exam_id}/resultados?attempt_id=${attempt.id}`}>
                    <div className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-brand-primary/30 transition-all cursor-pointer group">
                      {/* Fecha */}
                      <div className="w-16 flex-shrink-0 text-center">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{dateStr.split(' ')[0]}</p>
                        <p className="text-sm font-black text-brand-primary">{date.getDate()}</p>
                        <p className="text-xs text-zinc-500 font-medium">{time}</p>
                      </div>

                      {/* Info del ensayo */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-zinc-100 group-hover:text-brand-primary transition-colors line-clamp-1">
                          {attempt.exam_title}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-xs text-zinc-400 font-medium">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {attempt.correct_count} correctas
                          </div>
                          <div className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-500" />
                            {attempt.incorrect_count} incorrectas
                          </div>
                          <div className="flex items-center gap-1">
                            <SkipForward className="h-3 w-3 text-zinc-500" />
                            {attempt.omitted_count} omitidas
                          </div>
                        </div>
                      </div>

                      {/* Puntuación y tendencia */}
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-xl font-black text-zinc-50">{attempt.score_total}</p>
                            <p className="text-xs text-zinc-400 font-medium">{attempt.accuracy}%</p>
                          </div>
                          {!isImproving && idx > 0 && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20">
                              <ArrowDownRight className="h-4 w-4 text-red-400" />
                            </div>
                          )}
                          {isImproving && idx > 0 && (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20">
                              <ArrowUpRight className="h-4 w-4 text-green-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Icono de acceso */}
                      <div className="text-zinc-600 group-hover:text-brand-primary transition-colors">
                        →
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
