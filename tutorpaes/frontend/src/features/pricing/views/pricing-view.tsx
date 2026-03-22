import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Elige el plan perfecto para ti
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Asegura tu puntaje en la PAES con nuestra IA personalizada.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan Gratuito */}
          <Card className="p-8 relative bg-white border-gray-200 shadow-sm flex flex-col">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Básico</h2>
            <p className="text-gray-500 mb-6">Perfecto para conocer la plataforma</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-gray-900">$0</span>
              <span className="text-gray-500 font-medium">/mes</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-gray-700">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Ensayos PAES ilimitados</span>
              </li>
              <li className="flex items-start gap-3 text-gray-700">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span><strong>5 explicaciones IA</strong> al día</span>
              </li>
            </ul>
            <Button className="w-full bg-gray-100 text-gray-900 hover:bg-gray-200" disabled>
              Plan Actual
            </Button>
          </Card>
          {/* Plan Premium */}
          <Card className="p-8 relative bg-white border-purple-500 shadow-xl ring-2 ring-purple-500 flex flex-col">
            <div className="absolute top-0 right-6 transform -translate-y-1/2">
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm flex items-center gap-1">
                <Sparkles className="h-4 w-4" /> Recomendado
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium</h2>
            <p className="text-gray-500 mb-6">Máximo rendimiento y explicaciones sin límite</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-gray-900">$7.900</span>
              <span className="text-gray-500 font-medium">/mes</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-gray-700">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Todo lo del plan básico</span>
              </li>
              <li className="flex items-start gap-3 text-gray-900 font-semibold">
                <Check className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <span>Explicaciones IA Ilimitadas </span>
              </li>
            </ul>
            <div className="space-y-3 mt-auto">
              <Button
                onClick={() => handleUpgrade('monthly')}
                disabled={loading !== null}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
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
