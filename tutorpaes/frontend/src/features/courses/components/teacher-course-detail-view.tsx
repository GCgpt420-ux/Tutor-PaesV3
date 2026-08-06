'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useTeacherCourseDetails, 
  useTeacherTopicPerformance, 
  TeacherStudent 
} from '@/src/features/courses/hooks/use-courses';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/src/lib/api/client';
import { 
  Loader, ArrowLeft, Users, Target, Activity, 
  AlertTriangle, Sparkles, X
} from 'lucide-react';

export interface UserStatsTopic {
  topic_name: string;
  topic_code: string;
  accuracy: number;
  questions: number;
  correct: number;
  completed_at: string | null;
}

export interface UserStatsSubject {
  subject_code: string;
  subject_name: string;
  topics: UserStatsTopic[];
}

export interface UserStatsResponse {
  user_id: number;
  total_subjects: number;
  completed_subjects: number;
  overall_accuracy: number;
  subjects: UserStatsSubject[];
}

export function TeacherCourseDetailView({ courseId }: { courseId: string }) {
  const router = useRouter();
  const { data: course, isLoading: loadingDetails, isError: isErrorDetails } = useTeacherCourseDetails(courseId);
  const { data: performance = [], isLoading: loadingPerformance } = useTeacherTopicPerformance(courseId);

  const [selectedStudent, setSelectedStudent] = useState<TeacherStudent | null>(null);

  // Fetch individual student stats when one is selected
  const { data: studentStats, isLoading: loadingStudentStats } = useQuery({
    queryKey: ['teacher', 'student', selectedStudent?.student_id, 'stats'],
    queryFn: () => apiFetch<UserStatsResponse>(`/teacher/students/${selectedStudent?.student_id}/stats`),
    enabled: !!selectedStudent,
  });

  if (loadingDetails || loadingPerformance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader className="h-10 w-10 text-brand-primary animate-spin mb-4" />
        <p className="text-text-tertiary font-black uppercase tracking-[0.2em] text-xs">Calculando Analíticas...</p>
      </div>
    );
  }

  if (isErrorDetails || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="glass-card p-10 border-brand-danger/30 bg-brand-danger/5 max-w-md text-center">
          <p className="text-brand-danger font-black uppercase tracking-widest text-sm mb-2">Error de Carga</p>
          <p className="text-text-secondary text-sm mb-6">No se pudieron cargar los datos analíticos del curso.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-danger border border-brand-danger/30 rounded-xl transition-all font-black uppercase tracking-widest text-[10px]"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Calculate overall course averages
  const students = course.students || [];
  const totalStudents = students.length;
  const avgScore = totalStudents > 0
    ? Math.round(students.reduce((acc, s) => acc + s.average_score, 0) / totalStudents)
    : 0;
  const avgAccuracy = totalStudents > 0
    ? Math.round(students.reduce((acc, s) => acc + s.average_accuracy, 0) / totalStudents)
    : 0;

  // Find lowest performing topic in the course
  const topWeakness = performance.length > 0 ? performance[0] : null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10 pb-24 text-white">
      {/* Header */}
      <div className="flex items-start gap-4 mb-10">
        <button
          onClick={() => router.back()}
          className="p-3 bg-surface-raised/50 border border-white/10 hover:bg-surface-container rounded-xl transition-all shadow-lg mt-1 group"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5 text-text-secondary group-hover:text-brand-primary transition-colors" />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-brand-primary animate-pulse" />
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-brand-primary">
              Métricas de Grupo / Profesor
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-text-primary uppercase tracking-tight">
            {course.name}
          </h1>
          <p className="text-text-tertiary font-medium">
            Resumen estadístico y distribución de rendimiento académico.
          </p>
        </div>
      </div>

      {/* KPI Panel */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Alumnos */}
        <div className="bg-black/60 border border-white/5 p-6 relative overflow-hidden group hover:border-brand-primary/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-primary/10 blur-[30px] rounded-full group-hover:bg-brand-primary/20 transition-colors" />
          <div className="flex items-center justify-between mb-8">
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">Matrícula</span>
            <Users className="h-4 w-4 text-brand-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl lg:text-5xl font-black tracking-tighter">{totalStudents}</span>
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">Alumnos Activos</span>
          </div>
        </div>

        {/* KPI: Promedio Score */}
        <div className="bg-black/60 border border-white/5 p-6 relative overflow-hidden group hover:border-brand-accent/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-accent/10 blur-[30px] rounded-full group-hover:bg-brand-accent/20 transition-colors" />
          <div className="flex items-center justify-between mb-8">
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">Puntaje Promedio</span>
            <Target className="h-4 w-4 text-brand-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl lg:text-5xl font-black tracking-tighter text-brand-accent">{avgScore}</span>
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-brand-accent/70">Pts PAES</span>
          </div>
        </div>

        {/* KPI: Promedio Precisión */}
        <div className="bg-black/60 border border-white/5 p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 blur-[30px] rounded-full group-hover:bg-purple-500/20 transition-colors" />
          <div className="flex items-center justify-between mb-8">
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">Precisión del Grupo</span>
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl lg:text-5xl font-black tracking-tighter text-purple-400">{avgAccuracy}%</span>
            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-purple-400/70">Respuestas OK</span>
          </div>
        </div>

        {/* KPI: Fractura del Grupo */}
        <div className="bg-black/60 border border-white/5 p-6 relative overflow-hidden group hover:border-brand-danger/50 transition-all duration-300 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-danger/10 blur-[30px] rounded-full group-hover:bg-brand-danger/20 transition-colors" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-zinc-500">Punto Crítico</span>
            <AlertTriangle className="h-4 w-4 text-brand-danger animate-pulse" />
          </div>
          <div className="mt-auto">
            {topWeakness ? (
              <div>
                <p className="text-[10px] font-mono font-black uppercase tracking-tight text-brand-danger truncate">
                  {topWeakness.topic_name}
                </p>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-2xl font-black tracking-tighter text-white">{topWeakness.average_accuracy}%</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{topWeakness.subject_name}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-zinc-500 uppercase">Sin anomalías registradas</p>
            )}
          </div>
        </div>
      </section>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Student List */}
        <div className="lg:col-span-2 bg-black/40 border border-white/5 p-8 relative group min-h-[400px]">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/50" />
          
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary/10 border border-brand-primary/20">
                <Users className="h-5 w-5 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-white">Nómina del Curso</h2>
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">Desempeño Individual</p>
              </div>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{students.length} registrados</span>
          </div>

          {students.length === 0 ? (
            <p className="text-zinc-500 font-mono text-sm uppercase text-center py-12">No hay estudiantes matriculados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500 uppercase font-mono tracking-widest text-[9px]">
                    <th className="py-3 px-2">Alumno</th>
                    <th className="py-3 px-2 text-center">Simulaciones</th>
                    <th className="py-3 px-2 text-center">Puntaje Promedio</th>
                    <th className="py-3 px-2 text-center">Precisión</th>
                    <th className="py-3 px-2 text-right">Reporte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {students.map((student) => (
                    <tr key={student.student_id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2">
                        <div className="font-bold text-text-primary uppercase tracking-tight">{student.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{student.email}</div>
                      </td>
                      <td className="py-4 px-2 text-center font-mono font-bold text-zinc-300">
                        {student.total_attempts}
                      </td>
                      <td className="py-4 px-2 text-center font-mono font-black text-brand-accent">
                        {student.average_score > 0 ? `${Math.round(student.average_score)}` : '--'}
                      </td>
                      <td className="py-4 px-2 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          student.average_accuracy >= 60 
                            ? 'text-green-400 bg-green-500/10 border border-green-500/20' 
                            : 'text-brand-danger bg-brand-danger/10 border border-brand-danger/20'
                        }`}>
                          {student.average_accuracy > 0 ? `${Math.round(student.average_accuracy)}%` : '--'}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary font-mono font-black text-[9px] uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all"
                        >
                          Analizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Topic Performance Breakdown (Dificultades del grupo) */}
        <div className="bg-black/40 border border-white/5 p-8 relative group min-h-[400px] flex flex-col">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-danger/50" />
          
          <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
            <div className="p-2 bg-brand-danger/10 border border-brand-danger/20">
              <AlertTriangle className="h-5 w-5 text-brand-danger animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Fragilidades de Grupo</h2>
              <p className="text-[9px] font-mono text-brand-danger/70 uppercase tracking-[0.2em]">Prioridades de Nivelación</p>
            </div>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto max-h-[450px] pr-2">
            {performance.length === 0 ? (
              <p className="text-zinc-500 font-mono text-sm uppercase">Sin interacciones de grupo registradas</p>
            ) : (
              performance.map((p) => {
                const isCritical = p.average_accuracy < 50;
                return (
                  <div key={p.topic_id} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-xs font-black uppercase tracking-tight text-white block">
                          {p.topic_name}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                          {p.subject_name} · {p.students_attempted} alumnos
                        </span>
                      </div>
                      <span className={`text-xl font-black tracking-tighter ${isCritical ? 'text-brand-danger' : 'text-zinc-400'}`}>
                        {Math.round(p.average_accuracy)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-black border border-white/10 overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          isCritical 
                            ? 'bg-brand-danger shadow-[0_0_15px_rgba(244,63,94,0.6)]' 
                            : 'bg-zinc-500 shadow-[0_0_10px_rgba(161,161,170,0.5)]'
                        }`} 
                        style={{ width: `${p.average_accuracy}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Student Details Overlay (Slide Over / Modal) */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-surface-base border border-white/10 w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8 relative flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-6 right-6 p-2 bg-surface-raised border border-white/10 hover:bg-surface-container rounded-lg text-text-secondary hover:text-white transition-all"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-brand-primary animate-pulse" />
                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-brand-primary">
                  Ficha de Diagnóstico Individual
                </span>
              </div>
              <h3 className="text-3xl font-black text-text-primary uppercase tracking-tight">
                {selectedStudent.name}
              </h3>
              <p className="text-xs text-text-tertiary font-mono">{selectedStudent.email}</p>
            </div>

            {/* Modal Content */}
            {loadingStudentStats ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader className="h-8 w-8 text-brand-primary animate-spin mb-3" />
                <p className="text-[10px] text-text-tertiary font-mono uppercase tracking-[0.2em]">Cargando expediente...</p>
              </div>
            ) : studentStats ? (
              <div className="space-y-8">
                {/* Aggregated Performance KPI */}
                <div className="grid grid-cols-3 gap-4 border-t border-b border-white/10 py-6">
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Precisión Global</div>
                    <div className="text-2xl font-black tracking-tighter text-purple-400">
                      {Math.round(studentStats.overall_accuracy)}%
                    </div>
                  </div>
                  <div className="text-center border-l border-r border-white/10">
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Materias Cursadas</div>
                    <div className="text-2xl font-black tracking-tighter text-white">
                      {studentStats.completed_subjects} / {studentStats.total_subjects}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Simulaciones</div>
                    <div className="text-2xl font-black tracking-tighter text-brand-accent">
                      {selectedStudent.total_attempts}
                    </div>
                  </div>
                </div>

                {/* Subjects & Topics Breakdown */}
                <div className="space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-zinc-400 border-l-2 border-brand-primary pl-2">
                    Rendimiento por Tópico
                  </h4>

                  <div className="space-y-6">
                    {studentStats.subjects.map((sub: UserStatsSubject) => {
                      const activeTopics = sub.topics.filter((t: UserStatsTopic) => t.questions > 0);
                      if (activeTopics.length === 0) return null;

                      return (
                        <div key={sub.subject_code} className="space-y-3 bg-black/25 border border-white/5 p-4 rounded-xl">
                          <h5 className="text-xs font-black uppercase text-brand-primary tracking-tight">
                            {sub.subject_name}
                          </h5>
                          
                          <div className="space-y-3">
                            {activeTopics.map((t: UserStatsTopic) => {
                              const isLow = t.accuracy < 50;
                              return (
                                <div key={t.topic_code} className="text-xs">
                                  <div className="flex justify-between items-baseline mb-1">
                                    <span className="text-zinc-300 font-bold uppercase tracking-tight">
                                      {t.topic_name}
                                    </span>
                                    <span className={`font-mono font-black ${isLow ? 'text-brand-danger' : 'text-green-400'}`}>
                                      {Math.round(t.accuracy)}% ({t.correct}/{t.questions} Qs)
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-black border border-white/10 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all ${
                                        isLow ? 'bg-brand-danger' : 'bg-green-400'
                                      }`}
                                      style={{ width: `${t.accuracy}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-zinc-500 font-mono py-10 uppercase">Error cargando expediente del alumno</p>
            )}

            {/* Modal Footer */}
            <div className="mt-4 pt-6 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-6 py-3 bg-surface-raised border border-white/10 hover:bg-surface-container font-mono font-black text-[9px] uppercase tracking-widest text-text-primary transition-all"
              >
                Cerrar Expediente
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
