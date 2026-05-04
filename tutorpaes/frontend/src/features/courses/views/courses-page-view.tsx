'use client';

import { useRouter } from 'next/navigation';
import { SubjectCard } from '@/src/features/dashboard/components/subject-card';
import { resolveMateriaId } from '@/src/lib/theme/materia-colors';
import { Loader } from 'lucide-react';
import { useSubjects } from '@/src/features/courses/hooks/use-courses';

export function CoursesPageView() {
  const router = useRouter();
  const { data: subjects = [], isLoading: loading, isError, error: queryError } = useSubjects();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-10 w-10 text-brand-primary animate-spin" />
          <p className="text-text-tertiary font-medium uppercase tracking-widest text-sm">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="glass-card p-8 border-brand-danger/30 bg-brand-danger/5 text-center animate-error-shake">
          <p className="text-brand-danger font-black uppercase tracking-widest mb-2">Error al cargar cursos</p>
          <p className="text-text-secondary text-sm">
            {queryError instanceof Error ? queryError.message : 'Error al cargar cursos'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-10 flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black text-text-primary uppercase tracking-tight">Catálogo de Cursos</h1>
        <p className="text-text-tertiary font-medium">Selecciona una materia base para comenzar tu preparación.</p>
      </div>

      {subjects.length === 0 ? (
        <div className="glass-card p-16 text-center border-dashed border-white/10 bg-surface-raised/10">
          <p className="text-text-secondary font-bold uppercase tracking-wider">No hay cursos disponibles</p>
          <p className="text-text-tertiary text-sm mt-1">Vuelve a intentarlo más tarde o contacta a soporte.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.subject_id}
              id={subject.subject_id.toString()}
              name={subject.name}
              materiaId={resolveMateriaId(subject.name)}
              description={`${subject.subject_code} · ${subject.topics?.length || 0} temas integrados`}
              onClick={() => router.push(`/protected/cursos/${subject.subject_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
