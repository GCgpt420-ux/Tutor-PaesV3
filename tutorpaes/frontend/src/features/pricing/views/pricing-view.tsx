import { useState } from 'react';
import { apiFetch } from '@/src/lib/api/client';
import { Check, Loader2, Sparkles } from 'lucide-react';

export function PricingView() {
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);

  async function handleUpgrade(plan: 'monthly' | 'annual') {
    setLoading(plan);
    try {
      const data = await apiFetch<{ url: string }>('/payments/create', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al iniciar el pago. Revisa la consola para más detalles.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface-base py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20 space-y-4 animate-in fade-in slide-in-from-top-10 duration-700">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-12 bg-brand-primary" />
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em]">Inversión Académica</span>
            <span className="h-px w-12 bg-brand-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-text-primary uppercase tracking-tight">
            Evoluciona tu <span className="text-brand-primary">Potencial</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-text-tertiary font-medium">
            Accede a la tecnología de entrenamiento más avanzada para asegurar tu ingreso a la educación superior.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {/* Plan Gratuito */}
          <div className="glass-card p-10 relative bg-surface-raised/10 border-white/5 flex flex-col group hover:border-brand-primary/20 transition-all duration-500">
            <div className="mb-8">
              <h2 className="text-sm font-black text-text-primary uppercase tracking-[0.3em] mb-2">Protocolo Básico</h2>
              <p className="text-text-tertiary text-xs font-medium uppercase tracking-wider">Exploración Inicial</p>
            </div>
            
            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-6xl font-black text-text-primary tracking-tighter">$0</span>
              <span className="text-text-tertiary font-black uppercase tracking-widest text-[10px]">/ clp</span>
            </div>

            <ul className="space-y-6 mb-12 flex-1">
              <li className="flex items-start gap-4 text-text-secondary group-hover:text-text-primary transition-colors">
                <Check className="h-5 w-5 text-brand-primary flex-shrink-0" />
                <span className="text-sm font-medium">Simulacros PAES ilimitados</span>
              </li>
              <li className="flex items-start gap-4 text-text-secondary group-hover:text-text-primary transition-colors">
                <Check className="h-5 w-5 text-brand-primary flex-shrink-0" />
                <span className="text-sm font-medium"><strong>5 explicaciones IA</strong> por ciclo diario</span>
              </li>
              <li className="flex items-start gap-4 text-text-tertiary opacity-40">
                <Check className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium line-through">Análisis táctico detallado</span>
              </li>
            </ul>

            <button className="w-full bg-white/5 border border-white/10 text-white/40 cursor-not-allowed py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]" disabled>
              Asignado Actual
            </button>
          </div>

          {/* Plan Premium */}
          <div className="glass-card p-10 relative bg-brand-primary/5 border-brand-primary/30 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)] flex flex-col animate-in fade-in zoom-in-95 duration-1000">
            <div className="absolute top-0 right-10 transform -translate-y-1/2">
              <span className="bg-brand-primary text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-2">
                <Sparkles className="h-3 w-3 fill-current" /> Recomendado
              </span>
            </div>

            <div className="mb-8">
              <h2 className="text-sm font-black text-text-primary uppercase tracking-[0.3em] mb-2">Protocolo Premium</h2>
              <p className="text-brand-primary text-xs font-black uppercase tracking-wider">Máximo Desempeño</p>
            </div>

            <div className="mb-10 flex items-baseline gap-2">
              <span className="text-6xl font-black text-text-primary tracking-tighter">$7.900</span>
              <span className="text-text-tertiary font-black uppercase tracking-widest text-[10px]">/ mensual</span>
            </div>

            <ul className="space-y-6 mb-12 flex-1">
              <li className="flex items-start gap-4 text-text-secondary">
                <Check className="h-5 w-5 text-brand-primary flex-shrink-0" />
                <span className="text-sm font-medium">Todo el contenido del protocolo básico</span>
              </li>
              <li className="flex items-start gap-4 text-text-primary">
                <Check className="h-5 w-5 text-brand-primary flex-shrink-0" />
                <span className="text-sm font-bold">Explicaciones IA con el Tutor Ilimitadas</span>
              </li>
              <li className="flex items-start gap-4 text-text-primary">
                <Check className="h-5 w-5 text-brand-primary flex-shrink-0" />
                <span className="text-sm font-bold">Feedback instantáneo avanzado</span>
              </li>
            </ul>

            <button
              onClick={() => handleUpgrade('monthly')}
              disabled={loading !== null}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-brand-primary/20 flex items-center justify-center group"
            >
              {loading === 'monthly' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Activar Acceso Total
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
