"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  Timer,
  Sparkles,
  ChevronRight,
  DatabaseZap,
  GraduationCap
} from "lucide-react";

// --- Sub-componente: Snippet de IA Asimétrico ---
function AiDialogueSnippet() {
  return (
    <div className="w-full max-w-[420px] p-6 border border-white/[0.08] bg-surface-raised rounded-[2rem] relative md:-rotate-2 hover:rotate-0 hover:-translate-y-2 transition-all duration-700 ease-out group shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
      {/* Contenedor Glow interno (naranja único) */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 via-transparent to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-danger opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-danger"></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Análisis en Tiempo Real</span>
        </div>
        <span className="text-[10px] font-black font-mono text-brand-primary border border-brand-primary/20 bg-brand-primary/10 px-2 py-1 rounded-full uppercase tracking-widest">
          Q-45 · PAES M1
        </span>
      </div>

      <div className="mb-5 space-y-2">
        <div className="flex gap-3 items-start opacity-50">
          <div className="w-6 h-6 rounded-full bg-zinc-800 flex-shrink-0" />
          <p className="text-xs font-mono text-text-tertiary mt-1">&quot;Marcaste la alternativa D.&quot;</p>
        </div>
        <div className="flex gap-3 items-start">
          <div className="w-6 h-6 rounded-full bg-zinc-700 flex-shrink-0 border border-white/10" />
          <p className="text-sm font-medium text-text-secondary leading-snug">
            &quot;Confundiste el intercepto con la pendiente en la función afín f(x) = 3x - 2.&quot;
          </p>
        </div>
      </div>

      <div className="bg-surface-base border border-brand-primary/20 rounded-2xl p-5 relative overflow-hidden group-hover:border-brand-primary/40 transition-colors">
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-brand-primary/10 blur-xl rounded-full pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-primary/20 flex items-center justify-center border border-brand-primary/40">
            <Sparkles className="h-4 w-4 text-brand-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-1">El Tutor Detectó un Patrón</p>
            <p className="text-xs text-text-secondary leading-relaxed font-medium">
              Este es un error recurrente en tus últimos 3 ensayos. Tu debilidad no es álgebra base, es <span className="text-white font-bold bg-white/10 px-1 rounded">lectura de gráficas</span>. Sugiero repasar el Módulo de Geometría Analítica.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeView() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary overflow-x-hidden selection:bg-brand-primary selection:text-white relative">
      <div className="fixed inset-0 grain-overlay pointer-events-none z-50 opacity-20 hover:opacity-10 transition-opacity duration-1000" aria-hidden="true" />

      {/* Luz ambiental única (naranja, sin segunda tonalidad) */}
      <div className="fixed -top-[20%] -right-[10%] h-[800px] w-[800px] rounded-full bg-brand-primary/[0.04] blur-[120px] drift-diagonal pointer-events-none" aria-hidden="true" />
      <div className="fixed -bottom-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-brand-primary/[0.06] blur-[100px] drift-diagonal pointer-events-none" aria-hidden="true" />

      {/* --- NAVEGACIÓN --- */}
      <header className="fixed top-0 w-full z-40 border-b border-white/5 bg-surface-base/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface-base/50">
        <div className="mx-auto max-w-[1400px] px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white inline-flex items-center justify-center">
              <span className="text-black font-black text-xl leading-none -mt-0.5">T</span>
            </div>
            <span className="font-display font-black text-xl tracking-tighter uppercase">TutorPAES</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary border border-brand-primary/30 bg-brand-primary/10 px-2 py-0.5 rounded-full">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary hover:text-white transition-colors px-4 py-2 hidden sm:block">
              Iniciar sesión
            </Link>
            <Link href="/auth/sign-up" className="bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] transition-transform hover:scale-105 active:scale-95">
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-32 pb-24">

        {/* --- HERO SECTION: EL GANCHO ESTRUCTURAL --- */}
        <section className="mx-auto max-w-[1400px] px-6 pt-10 pb-20 lg:pt-20 lg:pb-32">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Texto Hero */}
            <div className="lg:col-span-7 space-y-8 relative z-20">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-text-tertiary font-mono">Motor de IA Operativo</span>
              </div>

              <h1 className="font-display text-5xl sm:text-7xl lg:text-[5.5rem] font-black uppercase tracking-tighter leading-[0.85] text-white animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                Entrena para la PAES
                <br />
                <span className="text-brand-primary">sin adivinar.</span>
              </h1>

              <p className="max-w-xl text-text-secondary text-lg sm:text-xl leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                Diagnóstico adaptativo, simulacros con el formato oficial DEMRE y un
                <span className="text-white font-bold inline-flex bg-white/5 px-1.5 py-0.5 mx-1 rounded">Tutor IA conversacional</span>
                que te explica por qué fallaste, no solo cuál era la alternativa correcta.
              </p>

              <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold text-text-secondary font-mono">
                  <DatabaseZap className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
                  100+ preguntas DEMRE reales
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold text-text-secondary font-mono">
                  <Sparkles className="h-3.5 w-3.5 text-brand-primary" aria-hidden="true" />
                  Tutor IA en tiempo real
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <Link href="/auth/sign-up" className="bg-brand-primary hover:bg-brand-primary-hover text-white px-8 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-[0_0_30px_rgba(255,107,53,0.3)] hover:shadow-[0_0_40px_rgba(255,107,53,0.5)] flex items-center justify-center gap-3 group">
                  Comenzar preparación
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#arquitectura" className="px-8 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[11px] text-text-tertiary font-mono hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all flex items-center justify-center">
                  Cómo funciona
                </Link>
              </div>
            </div>

            {/* Visual Asimétrico / Snippet de IA */}
            <div className="lg:col-span-5 relative w-full flex justify-center lg:justify-end animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none mask-radial-faded" />
              <AiDialogueSnippet />
            </div>

          </div>
        </section>

        {/* --- DIVISOR MATRICIAL --- */}
        <div id="arquitectura" className="w-full border-y border-white/5 bg-surface-base py-4 overflow-hidden flex whitespace-nowrap">
          <div className="animate-marquee inline-flex gap-8 items-center text-[10px] font-black font-mono uppercase tracking-[0.3em] text-zinc-600">
            <span>Diagnóstico Adaptativo</span> <span className="text-brand-primary">•</span>
            <span>Tutor Socrático IA</span> <span className="text-brand-primary">•</span>
            <span>Simulacros DEMRE Oficiales</span> <span className="text-brand-primary">•</span>
            <span>Analítica de Debilidades</span> <span className="text-brand-primary">•</span>
            <span>Dashboard Next.js</span> <span className="text-brand-primary">•</span>
            <span>Diagnóstico Adaptativo</span> <span className="text-brand-primary">•</span>
            <span>Tutor Socrático IA</span> <span className="text-brand-primary">•</span>
            <span>Simulacros DEMRE Oficiales</span>
          </div>
        </div>

        {/* --- 3 CARACTERÍSTICAS (ASIMÉTRICAS) --- */}
        <section className="mx-auto max-w-[1400px] px-6 py-20 lg:py-32">
          <div className="mb-16 md:mb-24">
            <h2 className="text-sm font-black text-brand-primary uppercase tracking-[0.3em] font-mono mb-4">La Infraestructura</h2>
            <p className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter text-white max-w-2xl leading-tight">
              Ingeniería aplicada a tu puntaje nacional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">

            {/* Pilar 1: Socrático IA (Span 7) */}
            <article className="md:col-span-7 bg-surface-raised/60 border border-white/5 p-8 lg:p-12 rounded-[2rem] relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <BrainCircuit className="h-32 w-32 text-brand-primary" />
              </div>
              <div className="w-12 h-12 bg-white flex items-center justify-center rounded-2xl mb-8">
                <BrainCircuit className="h-6 w-6 text-black" />
              </div>
              <h3 className="font-display text-3xl font-black uppercase tracking-tight text-white mb-4">Socrático IA</h3>
              <p className="text-text-secondary text-lg leading-relaxed max-w-md font-medium">
                No eres un número en una sala gigante. Un tutor conversacional disecciona tus errores y te guía con preguntas —no respuestas regaladas— hasta que entiendes el concepto de verdad.
              </p>
            </article>

            {/* Pilar 2: Simulacros DEMRE oficiales (Span 5) */}
            <article className="md:col-span-5 bg-surface-raised/60 border border-white/5 p-8 lg:p-12 rounded-[2rem] relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="w-12 h-12 bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center rounded-2xl mb-8">
                <Timer className="h-6 w-6 text-brand-primary" />
              </div>
              <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white mb-4">Simulacros DEMRE oficiales</h3>
              <p className="text-text-secondary text-base leading-relaxed font-medium">
                Ensayos con el mismo formato y tiempo de la PAES real. Misma presión de reloj, pero con analítica de cada segundo perdido.
              </p>
            </article>

            {/* Pilar 3: Analítica de debilidades (Span 12, apaisado) */}
            <article className="md:col-span-12 bg-surface-raised/60 border border-white/5 p-8 lg:p-12 rounded-[2rem] relative overflow-hidden group hover:border-white/10 transition-colors flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16">
               <div className="absolute bottom-0 right-10 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
                <span className="text-[12rem] font-black leading-none tracking-tighter">%</span>
              </div>

              <div className="flex-1 space-y-4 relative z-10">
                <div className="w-12 h-12 bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center rounded-2xl mb-6">
                  <DatabaseZap className="h-6 w-6 text-brand-primary" />
                </div>
                <h3 className="font-display text-3xl font-black uppercase tracking-tight text-white">Analítica de debilidades</h3>
                <p className="text-text-secondary text-lg leading-relaxed max-w-2xl font-medium">
                  Cada ensayo alimenta un mapa de tus ejes temáticos más débiles por asignatura. Nada de intuición: sabes exactamente qué repasar hoy y por qué.
                </p>
              </div>

              <div className="flex-shrink-0 relative z-10 hidden lg:block">
                <div className="px-6 py-4 bg-black/50 border border-brand-primary/20 rounded-2xl flex flex-col items-center justify-center min-w-[200px]">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/70 mb-1">EJES DÉBILES DETECTADOS</span>
                  <span className="text-5xl font-black text-brand-primary tracking-tighter">3<span className="text-xl text-text-tertiary">/8</span></span>
                </div>
              </div>
            </article>

          </div>
        </section>

        {/* --- CALL TO ACTION (CTA) FINAL --- */}
        <section className="mx-auto max-w-[1000px] px-6 pb-20 lg:pb-32 text-center">
          <div className="bg-surface-raised/60 border border-brand-primary/20 p-12 md:p-20 rounded-[3rem] relative overflow-hidden shadow-[0_0_100px_rgba(255,107,53,0.1)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,53,0.12),transparent_70%)] pointer-events-none" />

            <GraduationCap className="h-16 w-16 text-brand-primary mx-auto mb-8 relative z-10" />
            <h2 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-6 relative z-10">
              Empieza hoy tu preparación.
            </h2>
            <p className="text-text-secondary text-lg md:text-xl font-medium mb-10 max-w-xl mx-auto relative z-10">
              Registra tu perfil y toma el primer cuestionario diagnóstico hoy. La inteligencia artificial mapeará tu ruta.
            </p>

            <Link href="/auth/sign-up" className="inline-flex bg-brand-primary hover:bg-brand-primary-hover text-white px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] text-[12px] transition-transform hover:scale-105 active:scale-95 shadow-2xl relative z-10 items-center justify-center gap-3">
              Activar Acceso Gratuito
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 border-t border-white/5 bg-black">
        <div className="mx-auto max-w-[1400px] px-6 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-[4px] bg-white inline-flex items-center justify-center">
                  <span className="text-black font-black text-xs leading-none">T</span>
                </div>
                <span className="font-display font-black text-sm tracking-tighter uppercase text-white">TutorPAES {year || 2026}</span>
              </div>
              <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-600">SaaS Propulsado por FastAPI & Next.js</p>
          </div>

          <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <Link href="#" className="hover:text-white transition-colors">Términos</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-brand-primary transition-colors">Contacto Técnico</Link>
          </div>
        </div>
      </footer>

      {/* Tailwind extras (para animaciones locales si es que no están en globals.css) */}
      <style dangerouslySetInnerHTML={{__html:`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .mask-radial-faded {
          mask-image: radial-gradient(circle at center, black 30%, transparent 70%);
        }
      `}} />
    </div>
  );
}
