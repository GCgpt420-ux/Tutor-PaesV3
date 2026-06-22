/**
 * Exams API Module
 * 
 * Centraliza todas las operaciones relacionadas con ensayos.
 */

// Supabase removed; future connection via apiFetch

export interface Exam {
  id: string;
  title: string;
  type: string;
  duration_minutes: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  scheduled_at?: string;
}

export interface ExamAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  status: 'en_progreso' | 'completado' | 'abandonado';
  score: number | null;
  started_at: string;
  submitted_at: string | null;
}

export interface Question {
  question_id: number;
  topic_id: number;
  prompt: string;
  difficulty: string;
  reading_text: string | null;
}

export interface AttemptFeedbackDetail {
  question_id: number;
  prompt: string;
  reading_text: string | null;
  selected_choice_id: number | null;
  selected_choice_text: string | null;
  correct_choice_id: number | null;
  correct_choice_text: string | null;
  is_correct: boolean;
  ai_explanation: string | null;
}

export interface AttemptResult {
  attempt_id: number;
  exam_id: number;
  subject_id: number;
  topic_id: number | null;
  status: string;
  score: number | null;
  total_questions: number;
  correct_count: number;
  started_at: string;
  completed_at: string | null;
  answers_detail: AttemptFeedbackDetail[];
}

import { apiFetch } from '@/src/lib/api/client';

/**
 * Obtener todos los ensayos activos
 */
export async function getActiveExams(): Promise<Exam[]> {
  return apiFetch<Exam[]>('/catalog/exams/');
}

/**
 * Obtener ensayo por ID
 */
export async function getExamById(examId: string | number): Promise<Exam> {
  return apiFetch<Exam>(`/catalog/exams/${examId}`);
}

/**
 * Obtener preguntas de un ensayo
 */
export async function getExamQuestions(examId: string | number): Promise<Question[]> {
  return apiFetch<Question[]>(`/catalog/exams/${examId}/questions`);
}

/**
 * Crear intento de ensayo
 */
export async function createExamAttempt(data: {
  exam_id: number;
  subject_id: number;
  topic_id?: number;
}): Promise<ExamAttempt> {
  return apiFetch<ExamAttempt>('/quiz/exam-attempts', {
    method: 'POST',
    body: data,
  });
}

/**
 * Guardar respuesta de usuario a pregunta unitaria
 */
export async function saveUserAnswer(data: {
  subject_code: string;
  topic_code: string;
  question_id: number;
  selected_choice_id: number;
}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    return await apiFetch('/quiz/answer', {
      method: 'POST',
      body: data,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado en responder. Por favor, intenta nuevamente.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Finalizar intento de ensayo
 */
export async function submitExamAttempt(data: {
  attempt_id: number;
  correct_count: number;
  total_questions: number;
  score?: number;
}) {
  return apiFetch('/quiz/exam-attempts/submit', {
    method: 'POST',
    body: data,
  });
}

/**
 * Obtener historial de intentos del usuario
 */
export async function getUserExamAttempts(userId: string | number) {
  return apiFetch(`/users/${userId}/exam-attempts`);
}


/**
 * Obtener detalle de resultados de un intento (Fase 2)
 */
export async function getAttemptResults(attemptId: number | string): Promise<AttemptResult> {
  const { apiFetch } = await import('@/src/lib/api/client');
  return apiFetch<AttemptResult>(`/quiz/attempts/${attemptId}/results`);
}

