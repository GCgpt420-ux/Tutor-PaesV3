/**
 * Exams Feature - API Exports
 * 
 * Centraliza todos los exports de la feature Exams
 */

export { getActiveExams, getExamById, getExamQuestions, createExamAttempt, saveUserAnswer, submitExamAttempt, getUserExamAttempts, getAttemptResults } from './exams';
export type { Exam, ExamAttempt, Question, AttemptResult, AttemptFeedbackDetail } from './exams';
