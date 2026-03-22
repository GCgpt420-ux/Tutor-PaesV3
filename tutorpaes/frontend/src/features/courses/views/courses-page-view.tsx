'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SubjectCard } from '@/src/features/dashboard/components/subject-card';
import { Loader } from 'lucide-react';
import { apiFetch } from '@/src/lib/api/client';

interface Subject {
  subject_id: number;
  subject_code: string;
  name: string;
  topics: Array<{
    topic_id: number;
    topic_code: string;
    name: string;
  }>;
}

export function CoursesPageView() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // Primero obtener el ID del examen PAES
        const exams = await apiFetch<Array<{ exam_id: number; code: string; name: string }>>('/catalog/exams/');
        const paesExam = exams.find((e) => e.code === 'PAES');

        if (!paesExam) {
          throw new Error('No se encontró el examen PAES');
        }

        // Obtener las materias del examen PAES
        const subjectsData = await apiFetch<Subject[]>(`/catalog/subjects/?exam_id=${paesExam.exam_id}`);
        setSubjects(subjectsData);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar cursos');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-gray-600">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700 font-semibold">Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Catálogo de Cursos</h1>
        <p className="text-gray-600 mt-2">Selecciona una materia para empezar a estudiar</p>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-blue-900">No hay cursos disponibles en este momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.subject_id}
              id={subject.subject_id.toString()}
              name={subject.name}
              description={`Código: ${subject.subject_code} · ${subject.topics.length} temas`}
              onClick={() => router.push(`/protected/cursos/${subject.subject_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
