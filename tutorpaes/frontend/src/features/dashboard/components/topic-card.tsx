import { ChevronRight, Lock } from 'lucide-react';

interface TopicCardProps {
  id: string;
  name: string;
  description: string;
  topicNumber: number;
  progress: number; // 0-100
  onClick?: () => void;
}

export function TopicCard({
  name,
  description,
  topicNumber,
  progress,
  onClick,
}: TopicCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group glass-card bg-surface-raised/40 backdrop-blur-md border-white/[0.06] p-5 hover:border-brand-primary/40 hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-primary/10 transition-colors" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-start gap-4">
          {/* Número del tema */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-sm font-black text-brand-primary">{topicNumber}</span>
          </div>

          {/* Contenido */}
          <div className="flex-1">
            <h3 className="font-bold text-text-primary text-lg group-hover:text-brand-primary transition-colors leading-tight">
              {name}
            </h3>
            <p className="text-xs text-text-tertiary mt-1.5 font-medium uppercase tracking-wider">
              {description || 'Explora este tema'}
            </p>
          </div>
        </div>

        {/* Icon derecha */}
        <ChevronRight className="h-5 w-5 text-text-tertiary group-hover:text-brand-primary group-hover:translate-x-1 transition-all" aria-hidden="true" />
      </div>

      {/* Barra de Progreso */}
      <div className="mt-6 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Progreso</span>
          <span className="text-xs font-black text-brand-primary">{progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={`Progreso del tema ${name}`}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-700 ease-snappy shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Estado */}
      <div className="mt-4 flex items-center gap-2.5 relative z-10">
        {progress === 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
            <Lock className="h-3 w-3" aria-hidden="true" />
            <span>Sin iniciar</span>
          </div>
        ) : progress < 100 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning/10 border border-warning/20 text-[10px] font-bold text-warning uppercase tracking-widest">
            <span className="inline-block w-1.5 h-1.5 bg-warning rounded-full animate-pulse"></span>
            <span>En progreso</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/20 text-[10px] font-bold text-success uppercase tracking-widest">
            <span className="inline-block w-1.5 h-1.5 bg-success rounded-full"></span>
            <span>Completado</span>
          </div>
        )}
      </div>
    </button>
  );
}
