/**
 * Courses API Module
 * 
 * Centraliza todas las operaciones relacionadas con materias y tópicos.
 */

// Supabase removed; will fetch via apiFetch

export interface Subject {
  subject_id: number;
  subject_code: string;
  name: string;
  exam_id?: number;
  topics?: Topic[];
}

export interface Topic {
  topic_id: number;
  topic_code: string;
  name: string;
  subject_id?: number;
}

import { apiFetch } from '@/src/lib/api/client';

/**
 * Obtener todas las materias
 */
export async function getAllSubjects(examId = 1): Promise<Subject[]> {
  return apiFetch<Subject[]>(`/catalog/subjects/?exam_id=${examId}`);
}

/**
 * Obtener materia por ID
 */
export async function getSubjectById(subjectId: string | number): Promise<Subject> {
  return apiFetch<Subject>(`/catalog/subjects/${subjectId}`);
}

/**
 * Obtener tópicos de una materia
 */
export async function getTopicsBySubject(subjectId: string | number): Promise<Topic[]> {
  return apiFetch<Topic[]>(`/catalog/topics/?subject_id=${subjectId}`);
}

/**
 * Obtener tópico por ID
 */
export async function getTopicById(topicId: string | number): Promise<Topic> {
  return apiFetch<Topic>(`/catalog/topics/${topicId}`);
}

/**
 * Obtener todas las materias con sus tópicos
 */
export async function getSubjectsWithTopics(examId = 1) {
  return apiFetch(`/catalog/subjects-with-topics?exam_id=${examId}`);
}
