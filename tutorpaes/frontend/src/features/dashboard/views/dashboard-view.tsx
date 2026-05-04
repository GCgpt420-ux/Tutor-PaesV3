import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  Award,
  Zap,
  ArrowRight,
  Target,
  BarChart3,
  Flame,
  Server,
  TerminalSquare
} from 'lucide-react';
import { ProgressChart } from '@/src/features/dashboard/components/progress-chart';
import { AttemptHistory } from '@/src/features/dashboard/components/attempt-history';
import { TopicStats } from '@/src/features/dashboard/components/topic-stats';
import { QuickAccess } from '@/src/features/dashboard/components/quick-access';
import { apiFetch } from '@/src/lib/api/client';
import { getCurrentUser } from '@/src/lib/auth/current-user';
import { AiTutorChat } from '@/src/features/ai/components/AiTutorChat';

// ─── Gamification ─────────────────────────────────────────────────────────────
const XP_PER_LEVEL = 500;
function calcXP(totalCorrect: number, totalAttempts: number) {
  return totalCorrect * 15 + totalAttempts * 25;
}
function calcLevel(xp: number) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

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
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const user = await getCurrentUser();
        if (!user?.user_id) {
          setError('Conexión rehusada.');
          return;
        }
        setUserName((user as unknown as { name?: string })?.name?.split(' ')[0] || '');

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
        setError('No pudimos cargar los datos del panel.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center animate-pulse" aria-busy="true">
        <div className="flex flex-col items-center gap-4 text-brand-primary">
          <TerminalSquare className="h-10 w-10 opacity-50" />
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em]">Cargando panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

      {/* ─── HERO BOLD ──────────────────────────────────────────────── */}
      {(() => {
        const totalXP = stats ? calcXP(stats.totalCorrect, stats.totalAttempts) : 0;
        const level = calcLevel(totalXP);
        const xpInCurrentLevel = totalXP % XP_PER_LEVEL;
        const xpPercent = Math.round((xpInCurrentLevel / XP_PER_LEVEL) * 100);
        const streakDays = stats?.streakDays ?? 0;
        const heroMsg = stats && stats.totalAttempts > 0
          ? stats.averageScore >= 600 ? 'Buen progreso. Sigue avanzando.' : 'Puedes mejorar. Haz un nuevo ensayo.'
          : 'Aún no hay datos. Comienza con tu primer ensayo.';
        return (
          <section className="relative overflow-hidden border border-white/10 bg-black/50 p-8 md:p-10 shadow-2xl backdrop-blur-md">
            {/* GRID OVERLAY */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:12px_12px] opacity-20 pointer-events-none mix-blend-overlay" />
            
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-primary/10 blur-[100px]" />
            </div>

            <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-400">
                    <Server className="h-3 w-3 text-green-500" />
                    SESIÓN ACTIVA {userName ? `• ${userName.toUpperCase()}` : ''}
                  </div>
                  <span className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-mono font-black text-brand-primary uppercase tracking-[0.2em]">
                    NIVEL_{level}
                  </span>
                </div>

                <h2 className="mb-6 text-3xl font-black uppercase tracking-tighter leading-none text-white md:text-5xl">
                  {heroMsg}
                </h2>

                <div className="max-w-md">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-white/50">
                      PROGRESO DE NIVEL [{level} → {level + 1}]
                    </span>
                    <span className="text-[9px] font-mono font-bold text-brand-primary">
                      {xpInCurrentLevel} / {XP_PER_LEVEL} XP
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden border border-white/10 bg-black">
                    <div
                      className="h-full bg-brand-primary shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-stretch gap-4">
                <div className="flex flex-col items-center justify-center border border-white/10 bg-black/80 w-24 p-4 shadow-inner">
                  <Flame className={`mb-1 h-6 w-6 ${streakDays > 0 ? 'text-orange-500 fill-orange-500/20 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'text-zinc-700'}`} />
                  <span className="text-2xl font-black tracking-tighter text-white">{streakDays}</span>
                  <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-500 mt-1">DÍAS</span>
                </div>
                
                <Link
                  href="/protected/ensayos"
                  className="flex items-center justify-center gap-2 bg-white px-8 text-black font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:bg-zinc-200 hover:scale-[1.02]"
                >
                  INICIAR ENSAYO
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ─── ACCESO RÁPIDO ────────────────────────────────────────────────── */}
      <QuickAccess 
        streakDays={stats?.streakDays || 0} 
        chartData={attempts.length > 0 ? attempts.slice(0, 7).map(a => a.accuracy).reverse() : undefined} 
      />

      {/* ─── RENDIMIENTO POR MATERIA ──────────────────────────────────────── */}
      {(() => {
        const groups = topicStats.reduce<Record<string, number[]>>((acc, t) => {
          if (!acc[t.subjectName]) acc[t.subjectName] = [];
          acc[t.subjectName].push(t.accuracy);
          return acc;
        }, {});
        const COLORS: Record<string, string> = {
          Matemática: '#6366f1', Lenguaje: '#ec4899', Ciencias: '#10b981', Historia: '#f59e0b',
        };
        const cards = Object.entries(groups).map(([name, accs]) => {
          const avg = Math.round(accs.reduce((s, a) => s + a, 0) / accs.length);
          const ck = Object.keys(COLORS).find((k) => name.toLowerCase().includes(k.toLowerCase()));
          return { name, avg, color: ck ? COLORS[ck] : '#6366f1' };
        });
        if (cards.length === 0) return null;
        return (
          <section>
            <h2 className="mb-4 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">
              Eficacia por Vector
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {cards.map(({ name, avg, color }) => (
                <Link
                  key={name}
                  href="/protected/cursos"
                  className="group relative flex flex-col justify-between overflow-hidden border border-white/5 bg-black/40 p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/5"
                >
                  <div className="absolute left-0 top-0 h-full w-1" style={{ background: color, opacity: 0.8 }} />
                  <div className="absolute right-0 top-0 p-2 opacity-10">
                    <Target style={{ color }} className="h-10 w-10" />
                  </div>
                  
                  <div className="mt-1 relative z-10">
                    <p className="mb-2 text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-400">{name}</p>
                    <p className="text-4xl font-black tracking-tighter text-white">{avg}<span className="text-lg text-zinc-600">%</span></p>
                  </div>
                  
                  <div className="mt-8 relative z-10 w-full flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-500">ACERTIVIDAD</span>
                    <ArrowRight className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* ─── ERROR ────────────────────────────────────────────────────────── */}
      {error && (
        <div role="alert" className="border-l-4 border-brand-danger bg-brand-danger/10 p-4 animate-error-shake">
          <p className="font-mono text-xs font-black uppercase tracking-widest text-brand-danger">ALERTA DEL SISTEMA</p>
          <p className="mt-1 text-sm text-zinc-400">{error}</p>
        </div>
      )}

      {/* ─── KPI + CHARTS ─────────────────────────────────────────────────── */}
      {stats && stats.totalAttempts > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* KPI 1 */}
            <div className="group relative overflow-hidden bg-black/60 border border-white/5 p-6 hover:border-brand-primary/50 transition-colors">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <p className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-400">Pts Reales</p>
                <Award className="h-4 w-4 text-brand-primary" />
              </div>
              <p className="text-5xl font-black tracking-tighter text-white">{stats.averageScore}</p>
            </div>
            {/* KPI 2 */}
            <div className="group relative overflow-hidden bg-black/60 border border-white/5 p-6 hover:border-brand-accent/50 transition-colors">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <p className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-400">Previsión</p>
                <Target className="h-4 w-4 text-brand-accent" />
              </div>
              <p className="text-5xl font-black tracking-tighter text-white">{stats.accuracyPercentage}<span className="text-2xl text-zinc-600">%</span></p>
            </div>
            {/* KPI 3 */}
            <div className="group relative overflow-hidden bg-black/60 border border-white/5 p-6 hover:border-brand-secondary/50 transition-colors">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <p className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-400">Operaciones</p>
                <BarChart3 className="h-4 w-4 text-brand-secondary" />
              </div>
              <p className="text-5xl font-black tracking-tighter text-white">{stats.totalAttempts}</p>
            </div>
            {/* KPI 4 */}
            <div className="group relative overflow-hidden bg-black/60 border border-white/5 p-6 hover:border-orange-500/50 transition-colors">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <p className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-400">Cadena</p>
                <Zap className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-5xl font-black tracking-tighter text-white">{stats.streakDays}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ProgressChart attempts={attempts} />
            </div>
            <div className="space-y-4">
              <div className="bg-black/60 border border-white/5 p-6 h-full">
                <h3 className="mb-6 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500 border-b border-white/10 pb-3">Registro de Ensayos</h3>
                <div className="space-y-4">
                  {attempts.slice(0, 4).map((attempt) => (
                    <div key={attempt.id} className="flex items-start justify-between border-b border-dashed border-white/10 pb-4 last:border-0 last:pb-0">
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="truncate text-sm font-bold text-white uppercase tracking-tight">{attempt.exam_title}</p>
                        <p className="text-[9px] font-mono text-zinc-600 mt-1">{new Date(attempt.finished_at).toLocaleDateString('es-CL')}</p>
                      </div>
                      <div className="flex-shrink-0 text-right bg-white/5 px-2 py-1 border border-white/10">
                        <p className="text-xs font-black font-mono text-brand-primary">{attempt.score_total}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {topicStats.length > 0 && <TopicStats topics={topicStats} />}
          <AttemptHistory attempts={attempts} />
        </>
      ) : (
        <div className="border border-dashed border-white/20 bg-black/30 p-16 text-center">
          <TerminalSquare className="mx-auto mb-6 h-12 w-12 text-zinc-700" />
          <p className="mb-2 text-xl font-black uppercase tracking-tighter text-white">REPOSOTORIO VACÍO</p>
          <p className="mb-8 text-sm text-zinc-500 font-mono">Ejecute su primer simulador para poblar la base de datos.</p>
          <Link
            href="/protected/ensayos"
            className="inline-flex items-center gap-2 bg-white px-8 py-3 text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-200 transition-colors"
          >
            MÓDULO SIMULACIONES <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* ─── ASISTENTE IA ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-[10px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">
          Terminal IA
        </h2>
        <div className="h-[420px] rounded-sm border border-white/10 overflow-hidden bg-black/60 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary/50" />
          <AiTutorChat />
        </div>
      </section>

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
