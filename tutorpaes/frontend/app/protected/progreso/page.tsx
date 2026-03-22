'use client';

import { 
  Target, 
  Clock, 
  Zap, 
  Award, 
  Flame, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  PlayCircle, 
  BookOpen,
  Medal,
  Star
} from "lucide-react";
import Link from "next/link";

export default function MiProgresoPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-24 text-text-primary">
      {/* 1. RESUMEN GENERAL (El "Vistazo Rápido") */}
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Mi Progreso</h1>
          <p className="text-text-secondary mt-2 text-sm font-medium">¡Buen trabajo esta semana, mantén el ritmo de estudio!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card bg-surface-raised/40 p-6 flex flex-col gap-4 border-l-4 border-l-brand-primary">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Tiempo Invertido</span>
              <Clock className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-text-primary">12<span className="text-xl text-text-tertiary">h</span> 30<span className="text-xl text-text-tertiary">m</span></span>
            </div>
          </div>

          <div className="glass-card bg-orange-500/10 border-orange-500/20 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400/80 uppercase tracking-widest">Racha Activa</span>
              <Flame className="h-4 w-4 text-orange-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-orange-400">5</span>
              <span className="text-sm font-bold text-orange-400/60 uppercase">Días Seguidos</span>
            </div>
          </div>

          <div className="glass-card bg-surface-raised/40 p-6 flex flex-col gap-4 border-l-4 border-l-brand-accent">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Puntaje Global</span>
              <Target className="h-4 w-4 text-brand-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-text-primary">780</span>
              <span className="text-sm font-bold text-brand-accent uppercase">+15 pts</span>
            </div>
          </div>

          <div className="glass-card bg-surface-raised/40 p-6 flex flex-col justify-between border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Próxima Meta</span>
              <Medal className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-purple-300">Nivel Experto</span>
                <span className="text-text-tertiary">800 pts</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[75%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ANÁLISIS DE RENDIMIENTO */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fortalezas */}
        <div className="glass-card bg-brand-accent/5 border-brand-accent/20 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-accent/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-brand-accent" />
            </div>
            <h2 className="text-lg font-black text-text-primary tracking-tight">Tus Fortalezas</h2>
          </div>
          <p className="text-sm font-medium text-brand-accent/80">¡Dominas estos temas! Mantén el nivel haciendo repasos ocasionales.</p>
          
          <div className="space-y-4">
            {/* Fortaleza Item */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-text-secondary">Álgebra y Funciones</span>
                <span className="text-brand-accent">92%</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-brand-accent w-[92%] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              </div>
            </div>
            {/* Fortaleza Item */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-text-secondary">Comprensión Lectora</span>
                <span className="text-brand-accent">85%</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-brand-accent w-[85%] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Áreas de Oportunidad */}
        <div className="glass-card bg-brand-danger/5 border-brand-danger/20 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-danger/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-brand-danger" />
            </div>
            <h2 className="text-lg font-black text-text-primary tracking-tight">Áreas de Oportunidad</h2>
          </div>
          <p className="text-sm font-medium text-brand-danger/80">Estos temas requieren más práctica para asegurar tu puntaje.</p>
          
          <div className="space-y-4">
            {/* Falencia Item */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-text-secondary">Geometría Analítica</span>
                <span className="text-brand-danger">45%</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-brand-danger w-[45%] shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
              </div>
              <div className="mt-3 text-right">
                <Link href="/protected/quiz/MATE/GEO" className="inline-flex items-center gap-1 text-xs font-bold text-brand-danger hover:underline transition-colors">
                  Repasar este tema <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
            
            {/* Falencia Item */}
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-text-secondary">Probabilidad y Estadística</span>
                <span className="text-orange-400">55%</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 w-[55%] shadow-[0_0_10px_rgba(251,146,60,0.5)]"></div>
              </div>
              <div className="mt-3 text-right">
                <Link href="/protected/quiz/MATE/PROB" className="inline-flex items-center gap-1 text-xs font-bold text-orange-400 hover:underline transition-colors">
                  Hacer un quiz rápido <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PLAN DE ACCIÓN (Recomendación Inteligente) */}
      <section className="glass-card bg-gradient-to-br from-brand-primary/20 to-brand-accent/10 border-brand-primary/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow de fondo decorativo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/30 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex-1 space-y-4 relative z-10">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-primary" />
            <h2 className="text-lg font-black text-text-primary tracking-widest uppercase">Plan de Acción Recomendado</h2>
          </div>
          <p className="text-text-secondary font-medium leading-relaxed">
            Basado en tus últimos resultados y análisis de IA, te sugerimos completar el <strong className="text-text-primary">Módulo de Geometría Analítica Intensa</strong>. Reforzar este contenido podría aumentar tu puntaje simulado en +35 puntos.
          </p>
        </div>
        <div className="relative z-10 w-full md:w-auto">
          <button className="w-full md:w-auto px-8 py-4 bg-text-primary hover:bg-text-secondary text-surface-base rounded-xl font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Iniciar Repaso
          </button>
        </div>
      </section>

      {/* 4. EXTRAS: TENDENCIA y GAMIFICACIÓN */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Tendencia Histórica (CSS Visual Bumper) */}
        <div className="glass-card bg-surface-raised/40 p-6 lg:col-span-2 flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-primary" />
              <h3 className="font-bold text-text-primary uppercase tracking-widest text-sm">Tendencia Histórica</h3>
            </div>
            <span className="text-xs font-bold text-brand-accent bg-brand-accent/10 px-2 py-1 rounded-md">+4% vs mes anterior</span>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 h-40 pt-4">
            {/* Barras de mock usando Tailwind */}
            {[45, 52, 48, 60, 65, 58, 70, 75, 72, 85].map((h, i) => (
              <div key={i} className="relative w-full group flex flex-col justify-end items-center h-full">
                {/* Tooltip Hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-surface-raised text-text-primary text-[10px] py-1 px-2 rounded font-bold transition-opacity whitespace-nowrap z-10">
                  {h * 10} pts
                </div>
                <div 
                  className="w-full bg-brand-primary/20 group-hover:bg-brand-primary/40 rounded-t-sm transition-colors relative overflow-hidden" 
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute bottom-0 w-full h-1 bg-brand-primary"></div>
                </div>
                <span className="text-[10px] text-text-tertiary font-bold mt-2 uppercase">E{i+1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Logros (Gamificación) */}
        <div className="glass-card bg-surface-raised/40 p-6 flex flex-col space-y-6">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-400" />
            <h3 className="font-bold text-text-primary uppercase tracking-widest text-sm">Tus Insignias</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Medalla 1 */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              </div>
              <span className="text-[10px] font-bold text-text-secondary text-center uppercase">Racha 5 Días</span>
            </div>
            {/* Medalla 2 */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-full bg-brand-primary/20 border border-brand-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <BookOpen className="h-6 w-6 text-brand-primary" />
              </div>
              <span className="text-[10px] font-bold text-text-secondary text-center uppercase">Lector Veloz</span>
            </div>
            {/* Medalla 3 (Bloqueada) */}
            <div className="flex flex-col items-center gap-2 opacity-30 grayscale">
              <div className="h-14 w-14 rounded-full bg-surface-container border border-white/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-text-tertiary" />
              </div>
              <span className="text-[10px] font-bold text-text-tertiary text-center uppercase">Francotirador</span>
            </div>
            {/* Medalla 4 (Bloqueada) */}
            <div className="flex flex-col items-center gap-2 opacity-30 grayscale">
              <div className="h-14 w-14 rounded-full bg-surface-container border border-white/10 flex items-center justify-center">
                <Medal className="h-6 w-6 text-text-tertiary" />
              </div>
              <span className="text-[10px] font-bold text-text-tertiary text-center uppercase">Mente Maestra</span>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-white/5 text-center">
            <button className="text-xs font-bold text-brand-primary hover:text-text-primary transition-colors uppercase tracking-widest">
              Ver Sala de Trofeos
            </button>
          </div>
        </div>

      </section>
    </div>
  );
}
