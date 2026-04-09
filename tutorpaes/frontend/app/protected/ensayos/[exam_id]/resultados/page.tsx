'use client';

import { useSearchParams } from 'next/navigation';

import { ExamResultsView } from '@/src/features/exams/components/exam-results-view';

export default function ResultadosPage() {
  const searchParams = useSearchParams();
  const attempt_id = searchParams.get('attempt_id');

  if (!attempt_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center animate-in fade-in slide-in-from-bottom-4">
        <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-3">No se detectó el ensayo</h2>
        <p className="text-text-tertiary font-medium mb-8">La secuencia de resultados no está disponible para esta sesión.</p>
        <button 
          onClick={() => window.history.back()}
          className="px-8 py-4 bg-surface-raised border border-white/10 rounded-2xl text-text-primary font-black uppercase tracking-widest text-[10px] hover:bg-surface-container transition-all"
        >
          Regresar
        </button>
      </div>
    );
  }

  // Se podría ocupar use(params.exam_id) si necesitamos info del exam, por ahora attemptId rige.
  return (
    <div className="min-h-screen py-10 bg-surface-base">
      <ExamResultsView attemptId={attempt_id} />
    </div>
  );
}
