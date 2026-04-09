'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global app error:', error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-surface-base text-white flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-surface-container bg-surface-default p-8 text-center">
          <h2 className="text-2xl font-black mb-3">Ocurrió un error inesperado</h2>
          <p className="text-slate-400 mb-6">
            El sistema encontró un problema al cargar esta vista. Puedes reintentar sin perder tu sesión.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold transition-colors"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
