import Link from 'next/link';
import { Bot, FileText, TrendingUp, Flame, ChevronRight } from 'lucide-react';

export function QuickAccess() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
      {/* Acceso a Progreso (Destacado) */}
      <Link href="/protected/progreso" className="md:col-span-2 md:row-span-2 block group">
        <div className="glass-card relative overflow-hidden p-8 hover:border-brand-primary hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all h-full flex flex-col justify-between group-hover:-translate-y-1 duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-brand-primary/20 transition-colors" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-8">
              <div className="p-4 rounded-2xl bg-black/40 group-hover:bg-brand-primary/20 transition-colors border border-white/10 group-hover:border-brand-primary/30">
                <TrendingUp className="h-8 w-8 text-brand-primary" />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-white/5 shadow-inner">
                <Flame className="h-5 w-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" />
                <span className="text-sm font-black text-zinc-200 uppercase tracking-wider">5 Días</span>
              </div>
            </div>
            <h3 className="text-3xl font-black text-zinc-50 uppercase tracking-tight mb-2">Alto Rendimiento</h3>
            <p className="text-zinc-400 font-medium">Historial de precisión y estadísticas de tu entrenamiento.</p>
          </div>
          
          <div className="mt-8 flex items-end gap-3 h-24 opacity-50 group-hover:opacity-100 transition-opacity relative z-10">
            {[40, 60, 45, 80, 65, 90, 75].map((h, i) => (
              <div key={i} className="flex-1 bg-white/5 rounded-t-sm relative overflow-hidden" style={{ height: '100%' }}>
                <div 
                  className="absolute bottom-0 w-full bg-brand-primary/60 group-hover:bg-brand-primary transition-colors" 
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-2 text-brand-primary font-bold uppercase tracking-wide group-hover:translate-x-2 transition-transform relative z-10">
            Entrar al Panel <ChevronRight className="h-5 w-5" />
          </div>
        </div>
      </Link>

      {/* Acceso a Cursos -> Tutores */}
      <Link href="/protected/cursos" className="md:col-span-2 block group">
        <div className="glass-card relative overflow-hidden p-6 hover:border-brand-accent hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all h-full flex flex-col justify-between group-hover:-translate-y-1 duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-accent/20 transition-colors" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-zinc-50 uppercase tracking-wide">Tutores IA Especialistas</h3>
              <div className="p-3 rounded-2xl bg-black/40 group-hover:bg-brand-accent/20 transition-colors border border-white/10 group-hover:border-brand-accent/30">
                <Bot className="h-6 w-6 text-brand-accent" />
              </div>
            </div>
            <p className="text-zinc-400 text-sm mb-6">
              Coach personalizado para M1, M2, Ciencias y Lenguaje.
            </p>
            <div className="flex items-center gap-2 text-brand-accent font-bold uppercase text-sm group-hover:translate-x-2 transition-transform">
              Ver Especialistas <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </Link>

      {/* Acceso a Ensayos -> Misiones */}
      <Link href="/protected/ensayos" className="md:col-span-2 block group">
        <div className="glass-card relative overflow-hidden p-6 hover:border-brand-secondary hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] transition-all h-full flex flex-col justify-between group-hover:-translate-y-1 duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-secondary/20 transition-colors" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-zinc-50 uppercase tracking-wide">Misiones Oficiales</h3>
              <div className="p-3 rounded-2xl bg-black/40 group-hover:bg-brand-secondary/20 transition-colors border border-white/10 group-hover:border-brand-secondary/30">
                <FileText className="h-6 w-6 text-brand-secondary" />
              </div>
            </div>
            <p className="text-zinc-400 text-sm mb-6">
              Ensayos completos y test de diagnóstico cronometrados.
            </p>
            <div className="flex items-center gap-2 text-brand-secondary font-bold uppercase text-sm group-hover:translate-x-2 transition-transform">
              Comenzar Entrenamiento <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
