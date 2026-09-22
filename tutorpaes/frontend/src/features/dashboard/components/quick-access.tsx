import Link from 'next/link';
import { Bot, FileText, TrendingUp, Flame, ChevronRight } from 'lucide-react';

export interface QuickAccessProps {
  streakDays?: number;
  chartData?: number[];
}

export function QuickAccess({
  streakDays = 5,
  chartData = [40, 60, 45, 80, 65, 90, 75],
}: QuickAccessProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
      {/* Acceso a Progreso (Destacado) */}
      <Link href="/protected/progreso" aria-label="Ir al panel de progreso" className="interactive-focus md:col-span-2 md:row-span-2 block group rounded-2xl">
        <div className="glass-card relative flex h-full flex-col justify-between overflow-hidden p-8 transition-[transform,border-color,box-shadow] duration-200 group-hover:-translate-y-0.5 hover:border-brand-primary hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-brand-primary/20 transition-colors pointer-events-none" />
          
          <div className="relative z-10 min-w-0">
            <div className="mb-8 flex min-w-0 items-start justify-between">
              <div className="rounded-2xl border border-surface-container bg-surface-raised/70 p-4 transition-colors group-hover:border-brand-primary/30 group-hover:bg-brand-primary/20">
                <TrendingUp className="h-8 w-8 text-brand-primary" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2 rounded-full border border-surface-container bg-surface-default/70 px-4 py-2 shadow-inner">
                <Flame className="h-5 w-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" aria-hidden="true" />
                <span className="text-sm font-black text-text-secondary uppercase tracking-wider tabular-nums">{streakDays} Días</span>
              </div>
            </div>
            <h3 className="mb-2 min-w-0 break-words text-lg font-black text-text-primary uppercase tracking-tight sm:text-3xl">Alto Rendimiento</h3>
            <p className="font-medium text-text-secondary">Historial de precisión y estadísticas de tu preparación.</p>
          </div>
          
          <div className="mt-8 flex items-end gap-3 h-24 opacity-50 group-hover:opacity-100 transition-opacity relative z-10">
            {chartData.map((h, i) => (
              <div key={i} className="relative flex-1 overflow-hidden rounded-t-sm bg-surface-raised/50" style={{ height: '100%' }}>
                <div 
                  className="absolute bottom-0 w-full bg-brand-primary/60 group-hover:bg-brand-primary transition-colors" 
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-2 text-brand-primary font-bold uppercase tracking-wide group-hover:translate-x-1.5 transition-transform duration-200 relative z-10">
            Entrar al Panel <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>
      </Link>

      {/* Acceso a Cursos -> Tutores */}
      <Link href="/protected/cursos" aria-label="Ir a cursos y tutores" className="interactive-focus md:col-span-2 block group rounded-2xl">
        <div className="glass-card relative flex h-full flex-col justify-between overflow-hidden p-6 transition-[transform,border-color,box-shadow] duration-200 group-hover:-translate-y-0.5 hover:border-brand-accent hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-accent/20 transition-colors pointer-events-none" />
          
          <div className="relative z-10 min-w-0">
            <div className="mb-4 flex min-w-0 items-center justify-between">
              <h3 className="min-w-0 break-words text-lg font-black text-text-primary uppercase tracking-wide sm:text-xl">Tutores IA Especialistas</h3>
              <div className="rounded-2xl border border-surface-container bg-surface-raised/70 p-3 transition-colors group-hover:border-brand-accent/30 group-hover:bg-brand-accent/20">
                <Bot className="h-6 w-6 text-brand-accent" aria-hidden="true" />
              </div>
            </div>
            <p className="mb-6 text-sm text-text-secondary">
              Coach personalizado para M1, M2, Ciencias y Lenguaje.
            </p>
            <div className="flex items-center gap-2 text-brand-accent font-bold uppercase text-sm group-hover:translate-x-1.5 transition-transform duration-200">
              Ver Especialistas <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        </div>
      </Link>

      {/* Acceso a Ensayos */}
      <Link href="/protected/ensayos" aria-label="Ir a ensayos y diagnósticos" className="interactive-focus md:col-span-2 block group rounded-2xl">
        <div className="glass-card relative flex h-full flex-col justify-between overflow-hidden p-6 transition-[transform,border-color,box-shadow] duration-200 group-hover:-translate-y-0.5 hover:border-brand-secondary hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-secondary/20 transition-colors pointer-events-none" />

          <div className="relative z-10 min-w-0">
            <div className="mb-4 flex min-w-0 items-center justify-between">
              <h3 className="min-w-0 break-words text-lg font-black text-text-primary uppercase tracking-wide sm:text-xl">Ensayos Oficiales</h3>
              <div className="rounded-2xl border border-surface-container bg-surface-raised/70 p-3 transition-colors group-hover:border-brand-secondary/30 group-hover:bg-brand-secondary/20">
                <FileText className="h-6 w-6 text-brand-secondary" aria-hidden="true" />
              </div>
            </div>
            <p className="mb-6 text-sm text-text-secondary">
              Ensayos completos y test de diagnóstico cronometrados.
            </p>
            <div className="flex items-center gap-2 text-brand-secondary font-bold uppercase text-sm group-hover:translate-x-1.5 transition-transform duration-200">
              Comenzar Ensayo <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
