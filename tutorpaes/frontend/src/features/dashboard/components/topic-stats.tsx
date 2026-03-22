import { Brain } from 'lucide-react';

interface TopicData {
  topicName: string;
  subjectName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

interface TopicStatsProps {
  topics: TopicData[];
}

export function TopicStats({ topics }: TopicStatsProps) {
  // Ordenar por accuracy descendente y mostrar todos los temas con práctica
  const sortedTopics = [...topics]
    .sort((a, b) => b.accuracy - a.accuracy);

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <Brain className="h-5 w-5 text-brand-secondary" />
          Desempeño por Tema
        </h3>
        <p className="text-xs text-zinc-400 font-medium">Temas practicados</p>
      </div>

      {/* Lista de temas */}
      <div className="space-y-4">
        {sortedTopics.map((topic, idx) => {
          const isStrong = topic.accuracy >= 80;
          const isGood = topic.accuracy >= 60;

          return (
            <div key={`${topic.topicName}-${idx}`} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              {/* Header del tema */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-bold text-zinc-100">{topic.topicName}</h4>
                  <p className="text-sm text-zinc-400 font-medium">{topic.subjectName}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${
                    isStrong ? 'text-green-400' : isGood ? 'text-brand-primary' : 'text-orange-400'
                  }`}>
                    {topic.accuracy}%
                  </p>
                  <p className="text-xs text-zinc-500 font-medium">
                    {topic.correctAnswers}/{topic.totalQuestions}
                  </p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    isStrong
                      ? 'bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                      : isGood
                      ? 'bg-gradient-to-r from-brand-primary to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'
                  }`}
                  style={{ width: `${topic.accuracy}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-xs text-zinc-400 mb-2 font-bold tracking-wide uppercase">Dominados</p>
            <p className="text-2xl font-black text-green-400">
              {sortedTopics.filter((t) => t.accuracy >= 80).length}
            </p>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-xs text-zinc-400 mb-2 font-bold tracking-wide uppercase">En Progreso</p>
            <p className="text-2xl font-black text-brand-primary">
              {sortedTopics.filter((t) => t.accuracy >= 60 && t.accuracy < 80).length}
            </p>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-xs text-zinc-400 mb-2 font-bold tracking-wide uppercase">A Mejorar</p>
            <p className="text-2xl font-black text-orange-400">
              {sortedTopics.filter((t) => t.accuracy < 60).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
