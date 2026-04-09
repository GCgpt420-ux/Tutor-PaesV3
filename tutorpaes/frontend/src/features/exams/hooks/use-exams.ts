import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/src/lib/api/client';

export interface Exam {
  exam_id: number;
  code: string;
  name: string;
  is_custom?: boolean;
  subjects: Array<{
    subject_id: number;
    subject_code: string;
    name: string;
  }>;
}

export interface ExamCardData {
  id: string;
  title: string;
  type: 'oficial' | 'personalizado';
  scheduled_at: string | null;
  duration_minutes: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export const examsKeys = {
  all: ['exams'] as const,
  list: () => [...examsKeys.all, 'list'] as const,
  separatedList: () => [...examsKeys.all, 'separated-list'] as const,
};

// Hook: Obtener todos los exámenes crudos
export function useExams() {
  return useQuery({
    queryKey: examsKeys.list(),
    queryFn: async () => {
      return apiFetch<Exam[]>('/catalog/exams/');
    },
    staleTime: 2 * 60 * 1000, // 2 mins cache
  });
}

// Hook: Obtener exámenes pre-parseados para la UI de las tarjetas
export function useExamsListUI() {
  return useQuery({
    queryKey: examsKeys.separatedList(),
    queryFn: async () => {
      const exams = await apiFetch<Exam[]>('/catalog/exams/');

      const officialExams = exams
        .filter((exam) => !exam.is_custom)
        .map((exam) => ({
          id: exam.exam_id.toString(),
          title: exam.name,
          type: 'oficial' as const,
          scheduled_at: null,
          duration_minutes: 180,
          is_active: true,
          created_by: null,
          created_at: new Date().toISOString(),
        }));

      const customExams = exams
        .filter((exam) => exam.is_custom)
        .map((exam) => ({
          id: exam.exam_id.toString(),
          title: exam.name,
          type: 'personalizado' as const,
          scheduled_at: null,
          duration_minutes: 150,
          is_active: true,
          created_by: null,
          created_at: new Date().toISOString(),
        }));

      return { officialExams, customExams };
    },
    staleTime: 2 * 60 * 1000,
  });
}
