'use client';

import { useSearchParams } from 'next/navigation';

import { ExamResultsView } from '@/src/features/exams/components/exam-results-view';

export default function ResultadosPage() {
  const searchParams = useSearchParams();
  const attempt_id = searchParams.get('attempt_id');

  if (!attempt_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-2">No se especificó un ensayo</h2>
        <p className="text-gray-600 mb-6">Por favor vuelve a tu listado de ensayos.</p>
      </div>
    );
  }

  // Se podría ocupar use(params.exam_id) si necesitamos info del exam, por ahora attemptId rige.
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <ExamResultsView attemptId={attempt_id} />
    </div>
  );
}
