'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Zap, Loader } from 'lucide-react';
import { TopicCard } from '@/src/features/dashboard/components/topic-card';
import { useSubjectDetails } from '@/src/features/courses/hooks/use-courses';

function CursoDetailContent({ subject_id }: { subject_id: string }) {
  const router = useRouter();
  const { data: subject, isLoading: loading, isError, error: queryError } = useSubjectDetails(subject_id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader className="h-10 w-10 text-brand-primary animate-spin mb-4" />
        <p className="text-text-tertiary font-black uppercase tracking-[0.2em] text-xs">Decodificando Materia...</p>
      </div>
    );
  }

  if (isError || !subject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="glass-card p-10 border-brand-danger/30 bg-brand-danger/5 max-w-md animate-error-shake text-center">
          <p className="text-brand-danger font-black uppercase tracking-widest text-sm mb-2">Error Crítico</p>
          <p className="text-text-secondary text-sm mb-6">
            {queryError instanceof Error ? queryError.message : 'Plan de estudio no encontrado'}
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-danger border border-brand-danger/30 rounded-xl transition-all font-black uppercase tracking-widest text-[10px]"
          >
            Abortar y Volver
          </button>
        </div>
      </div>
    );
  }

  const topics = subject.topics || [];

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header con botón atrás */}
      <div className="flex items-start gap-4 mb-10">
        <button
          onClick={() => router.back()}
          className="p-3 bg-surface-raised/50 border border-white/10 hover:bg-surface-container rounded-xl transition-all shadow-lg mt-1 group"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5 text-text-secondary group-hover:text-brand-primary transition-colors" />
        </button>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-text-primary uppercase tracking-tight">{subject.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-primary/10 border border-brand-primary/20 text-[10px] font-black text-brand-primary uppercase tracking-widest">
              {subject.subject_code}
            </span>
            <p className="text-text-tertiary font-medium text-sm">{topics.length} temas disponibles para entrenamiento</p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas con Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-12">
        <div className="glass-card p-6 border-white/[0.06] bg-surface-raised/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <BookOpen className="h-12 w-12 text-brand-primary" />
          </div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-text-tertiary">Total Temas</p>
          </div>
          <p className="text-4xl font-black text-text-primary">{topics.length}</p>
        </div>

        <div className="glass-card p-6 border-white/[0.06] bg-surface-raised/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="h-12 w-12 text-success" />
          </div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-lg bg-success/10 text-success">
              <Zap className="h-5 w-5" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-text-tertiary">Tu Progreso</p>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-black text-text-primary">0</p>
            <p className="text-xl font-bold text-success mb-1">%</p>
          </div>
        </div>
      </div>

      {/* Lista de Temas */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-xl font-black text-text-primary uppercase tracking-wider">Plan de Estudio</h2>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
            Socrático
          </div>
        </div>

        {topics.length === 0 ? (
          <div className="glass-card p-16 text-center border-dashed border-white/10 bg-surface-raised/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-8 w-8 text-text-tertiary" />
            </div>
            <p className="text-lg font-bold text-text-secondary uppercase tracking-wide">Materia en preparación</p>
            <p className="text-sm text-text-tertiary mt-2 max-w-xs mx-auto">Nuestro equipo pedagógico está cargando los temas para {subject.name}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {topics.map((topic, index) => (
              <TopicCard
                key={topic.topic_id}
                id={topic.topic_id.toString()}
                name={topic.name}
                description={`Código: ${topic.topic_code}`}
                topicNumber={index + 1}
                progress={0}
                onClick={() => router.push(`/protected/quiz/${subject.subject_code}/${topic.topic_code}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CursoDetailPage() {
  const params = useParams();
  const subject_id = params.subject_id as string;

  if (!subject_id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-text-tertiary font-black uppercase tracking-[0.2em] text-xs">Cargando identificador...</p>
      </div>
    );
  }

  return <CursoDetailContent subject_id={subject_id} />;
}
