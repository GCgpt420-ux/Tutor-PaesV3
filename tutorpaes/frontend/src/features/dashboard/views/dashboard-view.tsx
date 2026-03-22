import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  Loader,
  Award,
  BookOpen,
  Zap,
  ArrowRight,
  Target,
  BarChart3,
} from 'lucide-react';
import { ProgressChart } from '@/src/features/dashboard/components/progress-chart';
import { AttemptHistory } from '@/src/features/dashboard/components/attempt-history';
import { TopicStats } from '@/src/features/dashboard/components/topic-stats';
import { QuickAccess } from '@/src/features/dashboard/components/quick-access';
import { apiFetch } from '@/src/lib/api/client';
import { getCurrentUser } from '@/src/lib/auth/current-user';
import { AiTutorChat } from '@/src/features/ai/components/AiTutorChat';

interface DashboardStats {
  totalAttempts: number;
  averageScore: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracyPercentage: number;
  lastAttemptDate: string | null;
  streakDays: number;
}

interface AttemptData {
  id: string;
  exam_id: string;
  exam_title: string;
  total_questions: number;
  score_total: number;
  correct_count: number;
  incorrect_count: number;
  omitted_count: number;
  finished_at: string;
  accuracy: number;
}

interface TopicData {
  topicName: string;
  subjectName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

interface UserStatsResponse {
  user_id: number;
  total_subjects: number;
  completed_subjects: number;
  overall_accuracy: number;
  subjects: Array<{
    subject_code: string;
    subject_name: string;
    topics: Array<{
      topic_code: string;
      topic_name: string;
      accuracy: number;
      questions: number;
      correct: number;
      completed_at: string | null;
    }>;
  }>;
}

interface ExamAttemptResponse {
  id: number;
  exam_id: number;
  exam_title: string;
  subject_id: number;
  topic_id: number | null;
  status: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  omitted_count: number;
  score: number | null;
  started_at: string;
  completed_at: string | null;
}

export function ProtectedView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [topicStats, setTopicStats] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const user = await getCurrentUser();
        if (!user?.user_id) {
          setError('No autenticado');
          return;
        }

        const [statsResponse, attemptsResponse] = await Promise.all([
          apiFetch<UserStatsResponse>(`/users/${user.user_id}/stats`),
          apiFetch<ExamAttemptResponse[]>(`/users/${user.user_id}/exam-attempts`),
        ]);

        // Procesar datos de intentos
        const processedAttempts: AttemptData[] = (attemptsResponse || []).map((attempt) => {
          const total = attempt.total_questions || 0;
          const omitted = attempt.omitted_count || 0;
          const inferredIncorrect = Math.max(total - (attempt.correct_count || 0) - omitted, 0);
          const incorrect = Math.max(attempt.incorrect_count || 0, inferredIncorrect);
          const accuracy = total > 0 ? Math.round((attempt.correct_count / total) * 100) : 0;
          return {
            id: String(attempt.id),
            exam_id: String(attempt.exam_id),
            exam_title: attempt.exam_title || 'Ensayo',
            total_questions: total,
            score_total: attempt.score ?? 0,
            correct_count: attempt.correct_count ?? 0,
            incorrect_count: incorrect,
            omitted_count: omitted,
            finished_at: attempt.completed_at || attempt.started_at,
            accuracy,
          };
        });

        setAttempts(processedAttempts);

        // Calcular estadísticas globales
        if (processedAttempts.length > 0) {
          const totalCorrect = processedAttempts.reduce((sum, a) => sum + a.correct_count, 0);
          const totalIncorrect = processedAttempts.reduce((sum, a) => sum + a.incorrect_count, 0);
          const totalQuestions = processedAttempts.reduce((sum, a) => sum + a.total_questions, 0);
          const totalScore = processedAttempts.reduce((sum, a) => sum + a.score_total, 0);
          const averageScore = processedAttempts.length > 0 ? Math.round(totalScore / processedAttempts.length) : 0;
          const accuracyPercentage = totalQuestions > 0
            ? Math.round((totalCorrect / totalQuestions) * 100)
            : 0;

          setStats({
            totalAttempts: processedAttempts.length,
            averageScore,
            totalCorrect,
            totalIncorrect,
            accuracyPercentage,
            lastAttemptDate: processedAttempts[0]?.finished_at || null,
            streakDays: calculateStreak(processedAttempts),
          });
        } else {
          setStats(null);
        }

        const topicsPayload: TopicData[] = [];
        statsResponse.subjects.forEach((subject) => {
          subject.topics.forEach((topic) => {
            topicsPayload.push({
              topicName: topic.topic_name,
              subjectName: subject.subject_name,
              totalQuestions: topic.questions,
              correctAnswers: topic.correct,
              accuracy: Math.round(topic.accuracy),
            });
          });
        });

        setTopicStats(topicsPayload);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Error inesperado al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">
          Inicio
        </h1>
        <p className="text-zinc-400 mt-2 font-medium">
          Tu centro de entrenamiento personalizado. ¿Qué quieres lograr hoy?
        </p>
      </div>

      {/* Living AI Hero Section */}
      <div className="w-full mb-8">
        <div className="h-[500px]">
          <AiTutorChat />
        </div>
      </div>

      {/* Acceso Rápido */}
      <QuickAccess />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold">Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Estadísticas Principales - Si hay data */}
      {stats && stats.totalAttempts > 0 ? (
        <>
          {/* Grid de KPIs (Bento Grid Style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Puntaje Promedio */}
            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-primary/20 transition-colors" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Puntaje Pr.</h3>
                <div className="p-2 bg-brand-primary/20 rounded-lg text-brand-primary">
                  <Award className="h-5 w-5" />
                </div>
              </div>
              <p className="text-4xl font-bold text-zinc-50">{stats.averageScore}</p>
              <p className="text-xs text-brand-primary mt-2 font-medium tracking-wide">Escala PAES</p>
            </div>

            {/* Precisión */}
            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-accent/20 transition-colors" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Precisión</h3>
                <div className="p-2 bg-brand-accent/20 rounded-lg text-brand-accent">
                  <Target className="h-5 w-5" />
                </div>
              </div>
              <p className="text-4xl font-bold text-zinc-50">{stats.accuracyPercentage}%</p>
              <p className="text-xs text-brand-accent mt-2 font-medium tracking-wide">
                {stats.totalCorrect} de {stats.totalCorrect + stats.totalIncorrect}
              </p>
            </div>

            {/* Ensayos Completados */}
            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-brand-secondary/20 transition-colors" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Ensayos</h3>
                <div className="p-2 bg-brand-secondary/20 rounded-lg text-brand-secondary">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <p className="text-4xl font-bold text-zinc-50">{stats.totalAttempts}</p>
              <p className="text-xs text-brand-secondary mt-2 font-medium tracking-wide">Completados</p>
            </div>

            {/* Racha */}
            <div className="glass-card p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-orange-500/20 transition-colors" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Racha</h3>
                <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              <p className="text-4xl font-bold text-zinc-50">{stats.streakDays}</p>
              <p className="text-xs text-orange-400 mt-2 font-medium tracking-wide">Días seguidos</p>
            </div>

          </div>

          {/* Gráfico de Progreso y Top Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico Principal */}
            <div className="lg:col-span-2">
              <ProgressChart attempts={attempts} />
            </div>

            {/* Estadísticas Rápidas */}
            <div className="space-y-4">
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-zinc-100 mb-4">Últimos Resultados</h3>
                <div className="space-y-3">
                  {attempts.slice(0, 3).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-zinc-100 line-clamp-1">
                          {attempt.exam_title}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {new Date(attempt.finished_at).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-brand-primary">{attempt.score_total}</p>
                        <p className="text-xs text-zinc-400">{attempt.accuracy}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas por Tema */}
          {topicStats.length > 0 && <TopicStats topics={topicStats} />}

          {/* Historial Completo */}
          <AttemptHistory attempts={attempts} />
        </>
      ) : (
        <div className="glass-card p-12 text-center border-dashed border-white/20">
          <BookOpen className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-300 font-bold text-lg mb-2">Sin ensayos completados aún</p>
          <p className="text-zinc-500 mb-6">
            Completa tu primer ensayo para ver estadísticas y progreso
          </p>
          <Link
            href="/protected/ensayos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:scale-105"
          >
            Ir a Ensayos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function calculateStreak(attempts: AttemptData[]): number {
  if (attempts.length === 0) return 0;

  const sorted = [...attempts].sort(
    (a, b) => new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime()
  );

  let streak = 0;
  let currentDate = new Date(sorted[0].finished_at);
  currentDate.setHours(0, 0, 0, 0);

  for (const attempt of sorted) {
    const attemptDate = new Date(attempt.finished_at);
    attemptDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (currentDate.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === streak) {
      streak++;
      currentDate = new Date(attemptDate);
    } else if (daysDiff > streak) {
      break;
    }
  }

  return streak;
}
