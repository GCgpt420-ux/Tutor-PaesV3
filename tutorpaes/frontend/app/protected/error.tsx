'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Protected route error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-surface-container bg-surface-default p-8">
        <h2 className="text-2xl font-black text-white mb-2">No pudimos cargar esta sección</h2>
        <p className="text-slate-400 mb-6">
          Puede ser un problema temporal de red o del servidor. Reintenta o vuelve al inicio.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={reset}
            className="px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={() => router.push('/protected')}
            className="px-5 py-3 rounded-xl border border-surface-container bg-surface-raised hover:bg-surface-container text-white font-bold transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
