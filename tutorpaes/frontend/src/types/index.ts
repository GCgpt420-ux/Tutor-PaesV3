/**
 * Type Definitions
 * 
 * Tipos compartidos en toda la aplicación.
 */

// Re-export API types
export type { SignUpData, SignInData } from '@/src/features/auth/api/auth';
export type { Exam, ExamAttempt, Question } from '@/src/features/exams/api/exams';
export type { Subject, Topic } from '@/src/features/courses/api/courses';

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at?: string;
}

// Common UI types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Billing & Payments types
export interface Invoice {
  id: number;
  invoice_number: string;
  status: 'issued' | 'paid' | 'cancelled';
  issue_date: string;
  due_date: string;
  total_amount: number;
  pdf_url?: string;
}

export interface BillingItem {
  payment_id: number;
  buy_order: string;
  amount: number;
  plan: 'monthly' | 'annual';
  status: 'pending' | 'authorized' | 'failed';
  created_at?: string;
  authorized_at?: string;
  invoice?: Invoice;
}

export interface BillingHistory {
  payments: BillingItem[];
  total_spent: number;
  count: number;
}
