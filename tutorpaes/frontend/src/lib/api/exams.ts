export {
  createExamAttempt,
  getActiveExams,
  getAttemptResults,
  getExamById,
  getExamQuestions,
  getUserExamAttempts,
  saveUserAnswer,
  submitExamAttempt,
} from '@/src/features/exams/api/exams';

export type {
  AttemptFeedbackDetail,
  AttemptResult,
  Exam,
  ExamAttempt,
  Question,
} from '@/src/features/exams/api/exams';

