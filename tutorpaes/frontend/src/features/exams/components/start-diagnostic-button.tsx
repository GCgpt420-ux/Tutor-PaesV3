'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlayCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '@/src/lib/api/client';

interface CatalogExam {
  exam_id: number;
  code: string;
}

interface CatalogSubject {
  subject_id: number;
  subject_code: string;
}

interface CatalogTopic {
  topic_id: number;
  topic_code: string;
}

export function StartDiagnosticButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleStartDiagnostic = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener examen PAES base
      const exams = await apiFetch<CatalogExam[]>('/catalog/exams/');
      const paesExam = exams.find((exam) => exam.code === 'PAES');

      if (!paesExam) {
        throw new Error('No se encontró la configuración del examen PAES.');
      }

      // 2. Obtener materias del examen PAES
      const subjectsData = await apiFetch<CatalogSubject[]>(
        `/catalog/subjects/?exam_id=${paesExam.exam_id}`
      );
      
      if (subjectsData.length === 0) {
        throw new Error('No hay materias configuradas.');
      }
      
      const firstSubject = subjectsData[0];

      // 3. Obtener temas de la materia
      const topicsData = await apiFetch<CatalogTopic[]>(
        `/catalog/topics/?subject_id=${firstSubject.subject_id}`
      );

      if (topicsData.length === 0) {
        throw new Error('No hay temas configurados para esta materia.');
      }

      const firstTopic = topicsData[0];

      // 4. Redirigir al quiz del primer tema disponible
      router.push(`/protected/quiz/${firstSubject.subject_code}/${firstTopic.topic_code}`);

    } catch (err) {
      console.error('Error starting diagnostic:', err);
      const msg = err instanceof Error ? err.message : 'Error al iniciar el diagnóstico. Intenta nuevamente.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleStartDiagnostic}
        disabled={loading}
        className="inline-flex items-center gap-3 bg-brand-primary text-white px-10 py-5 font-black uppercase tracking-[0.2em] text-[11px] transition-all hover:bg-brand-primary/90 hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none group shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
      >
        {loading ? (
          <>
            PREPARANDO ENTORNO...
            <Loader2 className="h-5 w-5 animate-spin" />
          </>
        ) : (
          <>
            COMENZAR DIAGNÓSTICO (5 Preguntas)
            <PlayCircle className="h-5 w-5" />
          </>
        )}
      </button>

      {error && (
        <p className="text-brand-danger text-xs font-mono font-bold uppercase tracking-widest animate-pulse">
          {error}
        </p>
      )}
    </div>
  );
}
