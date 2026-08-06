'use client';

import { useRouter } from 'next/navigation';
import { useTeacherCourses } from '@/src/features/courses/hooks/use-courses';
import { Loader, Users, GraduationCap, Calendar, BarChart2 } from 'lucide-react';

export function TeacherCoursesPageView() {
  const router = useRouter();
  const { data: courses = [], isLoading: loading, isError, error } = useTeacherCourses();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader className="h-10 w-10 text-brand-primary animate-spin mb-4" />
        <p className="text-text-tertiary font-black uppercase tracking-[0.2em] text-xs">Cargando Aulas...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="glass-card p-8 border-brand-danger/30 bg-brand-danger/5 text-center animate-error-shake">
          <p className="text-brand-danger font-black uppercase tracking-widest mb-2">Error al cargar cursos del profesor</p>
          <p className="text-text-secondary text-sm">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      <div className="border-b border-white/10 pb-6 mb-10">
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="h-5 w-5 text-brand-primary animate-pulse" />
          <span className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-brand-primary">
            Portal del Profesor / Mis Cursos
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-text-primary uppercase tracking-tight">
          Aulas y Cursos Asignados
        </h1>
        <p className="text-text-tertiary font-medium mt-1">
          Supervisa el progreso, rendimiento y debilidades de tus grupos de alumnos.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="glass-card p-16 text-center border-dashed border-white/10 bg-surface-raised/10">
          <Users className="mx-auto h-12 w-12 text-text-tertiary opacity-45 mb-4" />
          <p className="text-text-secondary font-bold uppercase tracking-wider">No tienes cursos asignados</p>
          <p className="text-text-tertiary text-sm mt-1">Contacta al administrador para matricular tus cursos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.course_id}
              onClick={() => router.push(`/protected/cursos/${course.course_id}`)}
              className="glass-card p-8 border-white/5 bg-surface-base/80 hover:border-brand-primary/45 hover:scale-[1.02] cursor-pointer transition-all duration-300 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 blur-[40px] rounded-full group-hover:bg-brand-primary/10 transition-colors" />
              
              <div className="flex items-center justify-between mb-8">
                <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-md">
                  Curso Activo
                </span>
                <Users className="h-5 w-5 text-text-tertiary group-hover:text-brand-primary transition-colors" />
              </div>

              <h3 className="text-xl font-black text-text-primary uppercase tracking-tight mb-4 group-hover:text-brand-primary transition-colors">
                {course.name}
              </h3>

              <div className="space-y-3 pt-4 border-t border-white/5 text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Matrícula: <strong className="text-text-primary">{course.student_count} alumnos</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Creado: <strong className="text-text-primary">{new Date(course.created_at).toLocaleDateString('es-CL')}</strong></span>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <span className="inline-flex items-center gap-2 text-[9px] font-mono font-black text-brand-primary uppercase tracking-[0.25em] border border-brand-primary/30 group-hover:bg-brand-primary group-hover:text-white px-4 py-2 transition-all">
                  Ver Métricas <BarChart2 className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
