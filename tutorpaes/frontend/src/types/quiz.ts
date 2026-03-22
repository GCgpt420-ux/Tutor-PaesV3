/**
 * Quiz Types - Aligned with Backend Pydantic Schemas
 * 
 * These types MUST match exactly with:
 * - backend/app/schemas/quiz.py
 */

// ============================================================================
// BACKEND RESPONSE TYPES (from backend/app/schemas/quiz.py)
// ============================================================================

export interface BackendQuestionChoice {
  id: number;        // Backend uses "id", NOT "choice_id"
  label: string;     // "A", "B", "C", "D"
  text: string;
}

export interface BackendQuestionOut {
  kind: "question";
  question_id: number;
  prompt: string;    // Backend uses "prompt", NOT "text"
  topic: string;     // Topic code (e.g., "ALG", "GEO")
  reading_text?: string | null;
  choices: BackendQuestionChoice[];
  correct_choice_id: number; // ADDED: For correct proactive logic
}

export interface BackendTopicCompletedOut {
  kind: "topic_completed";
  message: string;
  attempt_id: number;
  status: string;
  total_questions: number;
  correct_count: number;
  score_percentage: number;
  score_paes: number;
  score: number;
}

export type NextQuestionResponse = BackendQuestionOut | BackendTopicCompletedOut;

// ============================================================================
// ANSWER SUBMISSION
// ============================================================================

export interface BackendAnswerIn {
  subject_code: string;     // REQUIRED
  topic_code: string;       // REQUIRED
  question_id: number;
  selected_choice_id: number;
  user_id?: number;         // Optional (derived from JWT)
}

export interface BackendAnswerOut {
  attempt_id: number;
  feedback_id: number;
  is_correct: boolean;
  feedback_text: string;    // NOT "explanation"
  is_attempt_finished: boolean;
  ai_payload: Record<string, unknown>;
}

// ============================================================================
// FRONTEND STATE TYPES (Internal use only)
// ============================================================================

export interface QuizState {
  question: BackendQuestionOut | null;
  selectedChoice: number | null;
  submitted: boolean;
  isCorrect: boolean | null;
  feedbackText: string | null;
  aiPayload: Record<string, unknown> | null;
  isFinished: boolean;
  loading: boolean;
  error: string | null;
  attemptId: number | null;
  questionsAnswered: number;
  correctAnswers: number;
}
