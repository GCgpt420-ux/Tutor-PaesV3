'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader, BookOpen, Clock, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/src/lib/api/client';

interface Topic {
  topic_id: number;
  code: string;
  name: string;
}

interface Subject {
  subject_id: number;
  code: string;
  name: string;
  topics: Topic[];
}

interface ExamDetail {
  exam_id: number;
  code: string;
  name: string;
  subjects: Subject[];
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const exam_id = params.exam_id as string;
  
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExamDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const examData = await apiFetch<ExamDetail>(`/catalog/exams/${exam_id}`);
        setExam(examData);
      } catch (err) {
        console.error('Error fetching exam detail:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar el ensayo');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetail();
  }, [exam_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-10 w-10 text-brand-primary animate-spin" />
          <p className="text-zinc-400 font-medium uppercase tracking-widest text-sm">Cargando ensayo...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-red-900/20 border-2 border-red-900/50 rounded-xl p-6 max-w-md animate-error-shake text-center">
          <p className="text-red-400 font-bold uppercase tracking-wider text-sm">Error</p>
          <p className="text-red-300 text-sm mt-2">{error || 'No se encontró el ensayo'}</p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-900/50 rounded-lg transition-colors font-bold uppercase tracking-wide text-xs"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header con botón atrás */}
      <div className="flex items-start gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2.5 bg-zinc-900/50 border border-white/10 hover:bg-zinc-800 rounded-xl transition-all shadow-lg mt-1"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-300" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-zinc-50 uppercase tracking-tight">{exam.name}</h1>
          <p className="text-zinc-400 mt-2 font-medium">
            Entrenamiento enfocado en {exam.subjects.length} materias disponibles
          </p>
        </div>
      </div>

      {/* Información del Ensayo */}
      <div className="glass-card bg-brand-primary/5 border-brand-primary/20 p-6 mb-8 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-primary/20 rounded-xl text-brand-primary">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-brand-primary/80 uppercase tracking-widest leading-relaxed">Duración simulada</p>
            <p className="text-2xl font-black text-zinc-100">180 <span className="text-sm text-zinc-400 font-medium">minutos</span></p>
          </div>
        </div>
        <div className="h-px md:h-12 w-full md:w-px bg-white/10" />
        <p className="text-zinc-300 text-sm leading-relaxed flex-1">
          Este ensayo incluye los ejes temáticos oficiales de <strong className="text-brand-primary">{exam.code}</strong>. 
          Puedes practicar una materia puntual o completar todo el set.
        </p>
      </div>

      {/* Lista de Materias */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 mb-6 uppercase tracking-wide">Materias Evaluadas</h2>
        
        {exam.subjects.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed border-white/20">
            <BookOpen className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-300 font-bold mb-2 uppercase tracking-wide">Sin módulos</p>
            <p className="text-zinc-500 text-sm">No hay materias configuradas para este ensayo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exam.subjects.map((subject) => (
              <div
                key={subject.subject_id}
                className="glass-card p-6 border-white/10 hover:border-brand-primary hover:bg-white/5 transition-all cursor-pointer group"
                onClick={() => router.push(`/protected/cursos/${subject.subject_id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-800/80 rounded-xl text-zinc-400 group-hover:bg-brand-primary/20 group-hover:text-brand-primary transition-colors">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-zinc-100">{subject.name}</h3>
                      <p className="text-xs text-brand-primary font-bold tracking-widest uppercase mt-0.5">{subject.code}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-accent"></div>
                  <p className="text-sm text-zinc-400 font-medium">
                    {subject.topics.length} temas integrados
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
