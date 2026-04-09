'use client';

import { useEffect, useState } from 'react';
import { 
  Target, 
  Clock, 
  Zap, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  PlayCircle, 
  BookOpen,
  Medal,
  Star,
  Activity,
  TerminalSquare
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from '@/src/lib/api/client';
import { getCurrentUser } from '@/src/lib/auth/current-user';

interface AttemptData {
  id: string;
  exam_id: string;
  exam_title: string;
  total_questions: number;
  score_total: number;
  correct_count: number;
  incorrect_count: number;
  omitted_count: number;
  started_at: string;
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

interface DashboardStats {
  totalAttempts: number;
  averageScore: number;
  totalCorrect: number;
  totalIncorrect: number;
  accuracyPercentage: number;
  streakDays: number;
  totalTimeMinutes: number;
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

export default function MiProgresoPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [topicStats, setTopicStats] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        if (!user?.user_id) {
          setError('Conexión rehusada: Usuario no encontrado.');
          return;
        }

        const [statsResponse, attemptsResponse] = await Promise.all([
          apiFetch<UserStatsResponse>(`/users/${user.user_id}/stats`),
          apiFetch<ExamAttemptResponse[]>(`/users/${user.user_id}/exam-attempts`),
        ]);

        let totalTimeMinutes = 0;

        const processedAttempts: AttemptData[] = (attemptsResponse || []).map((attempt) => {
          const total = attempt.total_questions || 0;
          const omitted = attempt.omitted_count || 0;
          const inferredIncorrect = Math.max(total - (attempt.correct_count || 0) - omitted, 0);
          const incorrect = Math.max(attempt.incorrect_count || 0, inferredIncorrect);
          const accuracy = total > 0 ? Math.round((attempt.correct_count / total) * 100) : 0;
          
          let attemptMinutes = 0;
          if (attempt.started_at && attempt.completed_at) {
            const start = new Date(attempt.started_at).getTime();
            const end = new Date(attempt.completed_at).getTime();
            attemptMinutes = Math.max(1, Math.round((end - start) / 60000));
            totalTimeMinutes += attemptMinutes;
          } else {
             // asume 1 min si no hay tiempo completado pero hay score
             totalTimeMinutes += 1;
          }

          return {
            id: String(attempt.id),
            exam_id: String(attempt.exam_id),
            exam_title: attempt.exam_title || 'Ensayo',
            total_questions: total,
            score_total: attempt.score ?? 0,
            correct_count: attempt.correct_count ?? 0,
            incorrect_count: incorrect,
            omitted_count: omitted,
            started_at: attempt.started_at,
            finished_at: attempt.completed_at || attempt.started_at,
            accuracy,
          };
        });

        // Ordenamos los intentos desde el más reciente al más antiguo
        processedAttempts.sort((a, b) => new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime());
        setAttempts(processedAttempts);

        if (processedAttempts.length > 0) {
          const totalCorrect = processedAttempts.reduce((sum, a) => sum + a.correct_count, 0);
          const totalIncorrect = processedAttempts.reduce((sum, a) => sum + a.incorrect_count, 0);
          const totalQuestions = processedAttempts.reduce((sum, a) => sum + a.total_questions, 0);
          
          let totalScore = 0;
          let countScored = 0;
          processedAttempts.forEach(a => {
            if (a.score_total > 0) {
              totalScore += a.score_total;
              countScored++;
            }
          });
          const averageScore = countScored > 0 ? Math.round(totalScore / countScored) : 0;
          
          const accuracyPercentage = totalQuestions > 0
            ? Math.round((totalCorrect / totalQuestions) * 100)
            : 0;

          setStats({
            totalAttempts: processedAttempts.length,
            averageScore,
            totalCorrect,
            totalIncorrect,
            accuracyPercentage,
            streakDays: calculateStreak(processedAttempts),
            totalTimeMinutes
          });
        }

        const topicsPayload: TopicData[] = [];
        (statsResponse?.subjects || []).forEach((subject) => {
          (subject.topics || []).forEach((topic) => {
            if (topic.questions > 0) {
              topicsPayload.push({
                topicName: topic.topic_name,
                subjectName: subject.subject_name,
                totalQuestions: topic.questions,
                correctAnswers: topic.correct,
                accuracy: Math.round(topic.accuracy),
              });
            }
          });
        });

        setTopicStats(topicsPayload);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error crítico recuperando telemetría de usuario.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center animate-pulse" aria-busy="true">
        <div className="flex flex-col items-center gap-4 text-brand-primary">
          <TerminalSquare className="h-10 w-10 opacity-50" />
          <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em]">Cargando Sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto border-l-4 border-brand-danger bg-brand-danger/10 p-6">
        <p className="font-mono text-xs font-black uppercase tracking-widest text-brand-danger">ALERTA DEL SISTEMA</p>
        <p className="mt-2 text-sm text-zinc-400">{error}</p>
      </div>
    );
  }

  // Si no hay stats (cero intentos crudos reales mostramos placeholder real)
  if (!stats || attempts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-12 pb-24 text-white">
         <header className="border-b border-white/10 pb-6 mb-10">
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-2">
            Métricas de <br className="md:hidden" /> Operación
          </h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Base de datos sin registros. Requiere inicialización.</p>
        </header>

        <div className="border border-dashed border-white/20 bg-black/30 p-16 text-center">
          <TerminalSquare className="mx-auto mb-6 h-12 w-12 text-zinc-700" />
          <p className="mb-2 text-xl font-black uppercase tracking-tighter text-white">DATOS INSUFICIENTES</p>
          <p className="mb-8 text-sm text-zinc-500 font-mono">Ejecute su primer simulador para poblar la telemetría.</p>
          <Link
            href="/protected/ensayos"
            className="inline-flex items-center gap-2 bg-white px-8 py-3 text-black font-black uppercase tracking-[0.2em] text-[10px] hover:bg-zinc-200 transition-colors"
          >
            IR AL SIMULADOR <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Dividir tópicos fuertes y débiles
  const strongTopics = [...topicStats].filter(t => t.accuracy >= 60).sort((a,b) => b.accuracy - a.accuracy);
  const weakTopics = [...topicStats].filter(t => t.accuracy < 60).sort((a,b) => a.accuracy - b.accuracy);

  // Derivar Recomendación Basada En Débiles 
  const topWeakness = weakTopics.length > 0 ? weakTopics[0] : null;

  const timeHours = Math.floor(stats.totalTimeMinutes / 60);
  const timeMins = stats.totalTimeMinutes % 60;

  // Calculo real progreso para la barra hasta 1000 ("Rango Experto")
  const goalPercentage = Math.min((stats.averageScore / 1000) * 100, 100);

  // Intentos Históricos Reales para Chart (Hasta los ultimos 10, de más viejo a más nuevo para grafica de izq a der)
  const recentAttemptsChart = [...attempts].slice(0, 10).reverse();

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-24 text-white">
      
      {/* HEADER TÁCTICO */}
      <header className="border-b border-white/10 pb-6 mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="h-5 w-5 text-brand-primary animate-pulse" />
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-brand-primary">
            Análisis de Rendimiento Activo
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
          Métricas de <br className="md:hidden" /> Operación
        </h1>
      </header>

      {/* 1. RESUMEN GENERAL */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Tiempo */}
        <div className="bg-black/60 border border-white/5 p-6 relative overflow-hidden group hover:border-brand-primary/50 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/10 blur-[30px] rounded-full group-hover:bg-brand-primary/20 transition-colors" />
          <div className="flex items-center justify-between mb-8">
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">Tiempo de Operación</span>
            <Clock className="h-4 w-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="flex items-baseline">
              <span className="text-4xl lg:text-5xl font-black tracking-tighter">{timeHours}</span>
              <span className="text-xl text-zinc-600 font-mono ml-1 italic uppercase">h</span>
            </div>
            <span className="text-3xl font-black text-zinc-800">:</span>
            <div className="flex items-baseline">
              <span className="text-4xl lg:text-5xl font-black tracking-tighter">{timeMins.toString().padStart(2, '0')}</span>
              <span className="text-xl text-zinc-600 font-mono ml-1 italic uppercase">m</span>
            </div>
          </div>
        </div>

        {/* KPI: Racha */}
        <div className="bg-black/60 border border-white/5 p-6 relative overflow-hidden group hover:border-orange-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 blur-[30px] rounded-full group-hover:bg-orange-500/20 transition-colors" />
          <div className="flex items-center justify-between mb-8">
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">Cadena de Impactos</span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter text-orange-500">{stats.streakDays}</span>
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-orange-500/70">Días Seguidos</span>
          </div>
        </div>

        {/* KPI: Puntaje PROMEDIO REAL */}
        <div className="bg-black/60 border border-white/5 p-6 relative overflow-hidden group hover:border-brand-accent/50 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-accent/10 blur-[30px] rounded-full group-hover:bg-brand-accent/20 transition-colors" />
          <div className="flex items-center justify-between mb-8">
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">Potencia Promedio (Pts)</span>
            <Target className="h-4 w-4 text-brand-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter">{stats.averageScore}</span>
          </div>
        </div>

        {/* KPI: Meta */}
        <div className="bg-black/60 border border-white/5 p-6 relative overflow-hidden flex flex-col justify-between group hover:border-purple-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 blur-[30px] rounded-full group-hover:bg-purple-500/20 transition-colors" />
          <div className="flex items-center justify-between mb-6">
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">Objetivo Superior PAES</span>
            <Medal className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-auto">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-black uppercase tracking-tight text-white">Rango 1000 Pts</span>
              <span className="text-[10px] font-mono text-purple-400 tracking-widest font-bold">{Math.round(goalPercentage)}%</span>
            </div>
            <div className="h-1.5 w-full bg-black border border-white/10 overflow-hidden">
              <div className="h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]" style={{ width: `${goalPercentage}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PLAN DE ACCIÓN (Recomendación Inteligente) */}
      <section className="bg-brand-primary/10 border border-brand-primary/30 p-8 md:p-12 relative overflow-hidden backdrop-blur-sm">
        {/* GRID OVERLAY TÁCTICO */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none mix-blend-overlay" />
        
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-primary/30 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1 space-y-5">
            <div className="flex items-center gap-3 border-b border-brand-primary/30 pb-3 inline-flex">
              <Zap className="h-5 w-5 text-brand-primary fill-brand-primary/50" />
              <h2 className="text-[11px] font-mono font-black text-brand-primary uppercase tracking-[0.3em]">
                Directiva Estratégica Sugerida
              </h2>
            </div>
            {topWeakness ? (
              <p className="text-lg text-white font-medium max-w-2xl leading-relaxed">
                El análisis predictivo detecta un bajo rendimiento en <span className="font-black uppercase tracking-tight text-brand-accent bg-brand-accent/20 px-2 py-0.5 border border-brand-accent/50 mx-1">{topWeakness.topicName}</span> ({topWeakness.accuracy}% asertividad). Ejecutar simulaciones en este sector priorizará ganancias marginales de precisión.
              </p>
            ) : (
               <p className="text-lg text-white font-medium max-w-2xl leading-relaxed">
                Sistema de vectores estabilizado. No se detectan anomalías críticas bajo el 60% de rendimiento. Sigue ejecutando simuladores oficiales para mantenimiento táctico.
              </p>
            )}
            
          </div>
          <div className="w-full md:w-auto">
            <Link href="/protected/ensayos" className="w-full md:w-auto bg-white text-black px-10 py-5 font-black uppercase tracking-[0.2em] text-[11px] transition-all hover:bg-zinc-200 hover:scale-[1.02] flex items-center justify-center gap-3 group shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]">
              Ejecutar Directiva
              <PlayCircle className="h-5 w-5 text-brand-primary group-hover:text-black transition-colors" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. ANÁLISIS DE EFICIENCIA SECTORIAL REAL */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Zonas Seguras */}
        <div className="bg-black/40 border border-white/5 p-8 relative group min-h-[300px]">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent/50" />
          
          <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
            <div className="p-2 bg-brand-accent/10 border border-brand-accent/20">
              <CheckCircle2 className="h-5 w-5 text-brand-accent" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Sectores Asegurados</h2>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Rendimiento {'>='} 60%</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {strongTopics.length > 0 ? strongTopics.map((topic, i) => (
               <div key={`strong-${i}`}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-black uppercase tracking-tight">{topic.topicName}</span>
                  <span className="text-2xl font-black tracking-tighter text-brand-accent">{topic.accuracy}%</span>
                </div>
                <div className="h-2 w-full bg-black border border-white/10 overflow-hidden">
                  <div className="h-full bg-brand-accent shadow-[0_0_15px_rgba(34,197,94,0.6)] object-left transition-all" style={{width: `${topic.accuracy}%`}} />
                </div>
              </div>
            )) : (
              <p className="text-zinc-500 font-mono text-sm uppercase">Sin registros óptimos aún.</p>
            )}
           
          </div>
        </div>

        {/* Zonas de Alta Fragilidad */}
        <div className="bg-black/40 border border-white/5 p-8 relative group min-h-[300px]">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-danger/50 animate-pulse" />
          
          <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
            <div className="p-2 bg-brand-danger/10 border border-brand-danger/20">
              <AlertTriangle className="h-5 w-5 text-brand-danger" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Fracturas Estructurales</h2>
              <p className="text-[9px] font-mono text-brand-danger/70 uppercase tracking-[0.2em]">Atención Crítica ({'<'} 60%)</p>
            </div>
          </div>
          
          <div className="space-y-6">
             {weakTopics.length > 0 ? weakTopics.map((topic, i) => (
                <div key={`weak-${i}`}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-black uppercase tracking-tight">{topic.topicName}</span>
                  <span className="text-2xl font-black tracking-tighter text-brand-danger">{topic.accuracy}%</span>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="h-2 flex-grow bg-black border border-white/10 overflow-hidden">
                    <div className="h-full bg-brand-danger shadow-[0_0_15px_rgba(244,63,94,0.6)] transition-all" style={{width: `${topic.accuracy}%`}} />
                  </div>
                  <Link href={`/protected/ensayos?topic=${encodeURIComponent(topic.topicName)}`} className="shrink-0 inline-flex items-center gap-1 text-[9px] font-mono font-black text-brand-danger uppercase tracking-[0.2em] hover:text-white transition-colors bg-brand-danger/10 border border-brand-danger/30 px-2 py-1">
                    Parche <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
             )) : (
               <p className="text-zinc-500 font-mono text-sm uppercase">No se detectan fracturas.</p>
             )}
          </div>
        </div>
      </section>

      {/* 4. FLUJO HISTÓRICO y CONDECORACIONES REAL */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico de Tendencia Histórica (Datos Crudos Reales) */}
        <div className="bg-black/60 border border-white/5 p-8 lg:col-span-2 flex flex-col min-h-[300px]">
          <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-8">
            <div>
              <h3 className="font-black text-white uppercase tracking-tighter text-2xl mb-1">Volatilidad Histórica</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Últimos 10 Ensayos Reales</p>
            </div>
            <span className="text-[10px] font-mono font-black text-brand-accent bg-brand-accent/10 px-3 py-1 border border-brand-accent/20">
              EN VIVO
            </span>
          </div>
          
          <div className="flex-1 flex items-end justify-start gap-3 h-48 pt-4">
            {recentAttemptsChart.length > 0 ? recentAttemptsChart.map((h, i) => {
              // Altura relativa a 1000 pts (ej. si saca 600, h=60%)
              const heightPerc = Math.max(5, Math.min(100, (h.score_total / 1000) * 100));
              return (
                <div key={i} className="relative w-12 group flex flex-col justify-end items-center h-full shrink-0">
                  {/* TOOLTIP TÁCTICO */}
                  <div className="opacity-0 group-hover:opacity-100 flex flex-col items-center absolute -top-16 bg-white text-black border-none text-[10px] font-mono p-2 font-black uppercase tracking-[0.1em] transition-opacity whitespace-nowrap z-10 pointer-events-none before:content-[''] before:absolute before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:w-2 before:h-2 before:bg-white before:rotate-45">
                    <span>{h.score_total} PTS</span>
                    <span className="text-[8px] text-zinc-500 font-bold truncate max-w-[100px]">{h.exam_title}</span>
                  </div>
                  
                  {/* Barra */}
                  <div 
                    className="w-full bg-brand-primary/10 border border-brand-primary/20 group-hover:bg-brand-primary/30 group-hover:border-brand-primary/50 transition-all relative overflow-hidden" 
                    style={{ height: `${heightPerc}%` }}
                  >
                    {/* Glow top edge */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-brand-primary shadow-[0_0_10px_rgba(99,102,241,1)]" />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 font-black mt-3 uppercase tracking-widest text-center turn-x-90" title={h.exam_title}>
                     E{i+1}
                  </span>
                </div>
              );
            }) : (
               <div className="w-full h-full flex items-center justify-center border border-dashed border-white/5">
                 <span className="text-zinc-600 font-mono text-xs uppercase">Se requieren más ensayos</span>
               </div>
            )}
          </div>
        </div>

        {/* Logros dinámicos basados en la realidad */}
        <div className="bg-black/60 border border-white/5 p-8 flex flex-col">
          <div className="border-b border-white/10 pb-4 mb-6">
            <h3 className="font-black text-white uppercase tracking-tighter text-2xl mb-1">Condecoraciones</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Sala de Trofeos Analítica</p>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            {/* Medalla 1 - Racha (si tiene >= 2 días) */}
            <div className={`border p-4 flex flex-col items-center justify-center gap-3 relative group overflow-hidden ${stats.streakDays >= 2 ? 'bg-white/5 border-white/10' : 'bg-black border-white/5 opacity-40'}`}>
              <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors" />
              <Star className={`h-8 w-8 ${stats.streakDays >= 2 ? 'text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)] fill-yellow-500/20' : 'text-zinc-600'}`} />
              <span className={`text-[9px] font-mono font-black text-center uppercase tracking-widest relative z-10 ${stats.streakDays >= 2 ? 'text-white' : 'text-zinc-500'}`}>
                 Cadena x{stats.streakDays >= 2 ? stats.streakDays : 'N'}
              </span>
            </div>
            
            {/* Medalla 2 - Algún ensayo arriba de 700 pts */}
            {(() => {
               const hasHighscore = attempts.some(a => a.score_total >= 700);
               return (
                <div className={`border p-4 flex flex-col items-center justify-center gap-3 relative group overflow-hidden ${hasHighscore ? 'bg-white/5 border-white/10' : 'bg-black border-white/5 opacity-40'}`}>
                  <div className="absolute inset-0 bg-brand-primary/5 group-hover:bg-brand-primary/10 transition-colors" />
                  <Target className={`h-8 w-8 ${hasHighscore ? 'text-brand-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-zinc-600'}`} />
                  <span className={`text-[9px] font-mono font-black text-center uppercase tracking-widest relative z-10 ${hasHighscore ? 'text-white' : 'text-zinc-500'}`}>
                    Sniper {'>'} 700Pts
                  </span>
                </div>
               );
            })()}

            {/* Medalla 3 - Tópico a más del 80% */}
            {(() => {
               const hasMastery = strongTopics.some(t => t.accuracy >= 80);
               return (
                <div className={`border p-4 flex flex-col items-center justify-center gap-3 relative group overflow-hidden ${hasMastery ? 'bg-white/5 border-white/10' : 'bg-black border-white/5 opacity-40'}`}>
                  <Medal className={`h-8 w-8 ${hasMastery ? 'text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.5)] fill-purple-400/20' : 'text-zinc-600'}`} />
                  <span className={`text-[9px] font-mono font-black text-center uppercase tracking-widest relative z-10 ${hasMastery ? 'text-white' : 'text-zinc-500'}`}>Maestría Tópica</span>
                </div>
               );
            })()}

            {/* Medalla Bloqueada default */}
            <div className="bg-black border border-white/5 p-4 flex flex-col items-center justify-center gap-3 opacity-40">
              <BookOpen className="h-8 w-8 text-zinc-600" />
              <span className="text-[9px] font-mono font-bold text-zinc-500 text-center uppercase tracking-widest">Élite 1000 Pts</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <span className="text-[10px] font-mono font-black text-zinc-600 uppercase tracking-[0.2em]">
              Datos Verificados con API
            </span>
          </div>
        </div>

      </section>
    </div>
  );
}

// Re-utilizamos el mismo calculateStreak que en dashboard
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
