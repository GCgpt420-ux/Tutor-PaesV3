'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { apiFetch } from '@/src/lib/api/client';
import { Check, Loader2, Sparkles } from 'lucide-react';

export default function PricingPage() {
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
    <div className="min-h-screen bg-surface-default py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-text-primary sm:text-5xl">
            Elige el plan perfecto para ti
          </h1>
          <p className="mt-4 text-xl text-text-secondary">
            Asegura tu puntaje en la PAES con nuestra IA personalizada.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan Gratuito */}
          <Card className="p-8 relative bg-surface-raised border border-white/10 shadow-sm flex flex-col">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Básico</h2>
            <p className="text-text-tertiary mb-6">Perfecto para conocer la plataforma</p>

            <div className="mb-6">
              <span className="text-5xl font-extrabold text-text-primary">$0</span>
              <span className="text-text-tertiary font-medium">/mes</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-text-secondary">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Ensayos PAES ilimitados</span>
              </li>
              <li className="flex items-start gap-3 text-text-secondary">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span><strong>5 explicaciones IA</strong> al día</span>
              </li>
            </ul>

            <Button className="w-full bg-surface-container text-text-secondary" disabled>
              Plan Actual
            </Button>
          </Card>

          {/* Plan Premium */}
          <Card className="p-8 relative bg-surface-raised border border-brand-primary/50 shadow-xl ring-2 ring-brand-primary/50 flex flex-col">
            <div className="absolute top-0 right-6 transform -translate-y-1/2">
              <span className="bg-brand-primary text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm flex items-center gap-1">
                <Sparkles className="h-4 w-4" /> Recomendado
              </span>
            </div>

            <h2 className="text-2xl font-bold text-text-primary mb-2">Premium</h2>
            <p className="text-text-tertiary mb-6">Máximo rendimiento y explicaciones sin límite</p>

            <div className="mb-6">
              <span className="text-5xl font-extrabold text-text-primary">$7.900</span>
              <span className="text-text-tertiary font-medium">/mes</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-text-secondary">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Todo lo del plan básico</span>
              </li>
              <li className="flex items-start gap-3 text-text-primary font-semibold">
                <Check className="h-5 w-5 text-brand-primary flex-shrink-0" />
                <span>Explicaciones IA Ilimitadas </span>
              </li>
            </ul>

            <div className="space-y-3 mt-auto">
              <Button
                onClick={() => handleUpgrade('monthly')}
                disabled={loading !== null}
                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-6 text-lg"
              >
                {loading === 'monthly' ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...</>
                ) : (
                  'Obtener Premium Mensual'
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
