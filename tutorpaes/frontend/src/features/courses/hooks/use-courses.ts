import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/src/lib/api/client';

export interface Topic {
  topic_id: number;
  topic_code: string;
  name: string;
}

export interface Subject {
  subject_id: number;
  subject_code: string;
  name: string;
  topics: Topic[];
}

export const coursesKeys = {
  all: ['subjects'] as const,
  list: () => [...coursesKeys.all, 'list'] as const,
  detail: (id: string) => [...coursesKeys.all, 'detail', id] as const,
};

// Hook: Obtener todas las materias (asignaturas) para el examen PAES
export function useSubjects() {
  return useQuery({
    queryKey: coursesKeys.list(),
    queryFn: async () => {
      // Primero obtener el ID del examen PAES
      const exams = await apiFetch<Array<{ exam_id: number; code: string; name: string }>>('/catalog/exams/');
      const paesExam = exams.find((e) => e.code === 'PAES');

      if (!paesExam) {
        throw new Error('No se encontró el examen PAES');
      }

      // Obtener las materias del examen PAES
      return apiFetch<Subject[]>(`/catalog/subjects/?exam_id=${paesExam.exam_id}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache (es catálogo, no cambia seguido)
  });
}

// Hook: Obtener detalles de una materia (con tópicos expandidos si aplica)
export function useSubjectDetails(subjectId: string) {
  return useQuery({
    queryKey: coursesKeys.detail(subjectId),
    queryFn: async () => {
      return apiFetch<Subject>(`/catalog/subjects/${subjectId}`);
    },
    enabled: !!subjectId, // Sólo ejecuta si el ID existe
  });
}
