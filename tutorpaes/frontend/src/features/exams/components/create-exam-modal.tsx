'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/src/lib/api/client';

import { X, AlertCircle } from 'lucide-react';

interface CreateExamModalProps {
  onClose: () => void;
  onExamCreated: () => void;
}

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
  subject_id: string;
}

interface CatalogExam {
  exam_id: number;
  code: string;
  name: string;
}

interface CatalogSubject {
  subject_id: number;
  subject_code: string;
  name: string;
}

interface CatalogTopic {
  topic_id: number;
  topic_code: string;
  name: string;
}

export function CreateExamModal({ onClose, onExamCreated }: CreateExamModalProps) {
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(150); // 2h 30m por defecto
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [numQuestions, setNumQuestions] = useState(40);
  const [loading, setLoading] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paesExamId, setPaesExamId] = useState<number | null>(null);

  // Fetch subjects
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoadingCatalog(true);
        setError(null);

        const exams = await apiFetch<CatalogExam[]>('/catalog/exams/');
        const paesExam = exams.find((exam) => exam.code === 'PAES');

        if (!paesExam) {
          setSubjects([]);
          setPaesExamId(null);
          return;
        }

        setPaesExamId(paesExam.exam_id);

        const subjectsData = await apiFetch<CatalogSubject[]>(
          `/catalog/subjects/?exam_id=${paesExam.exam_id}`
        );

        setSubjects(
          subjectsData.map((subject) => ({
            id: String(subject.subject_id),
            name: subject.name,
          }))
        );
      } catch (err) {
        console.error('Error loading subjects for create exam:', err);
        setError('No se pudieron cargar las materias');
        setSubjects([]);
      } finally {
        setLoadingCatalog(false);
      }
    };

    loadSubjects();
  }, []);

  // Fetch topics for selected subjects (or none if no subject selected)
  useEffect(() => {
    const loadTopics = async () => {
      if (selectedSubjects.length === 0) {
        setTopics([]);
        setSelectedTopics([]);
        return;
      }

      try {
        const topicResponses = await Promise.all(
          selectedSubjects.map(async (subjectId) => {
            const data = await apiFetch<CatalogTopic[]>(`/catalog/topics/?subject_id=${subjectId}`);
            return data.map((topic) => ({
              id: String(topic.topic_id),
              name: topic.name,
              subject_id: subjectId,
            }));
          })
        );

        const mergedTopics = topicResponses.flat();
        setTopics(mergedTopics);
        setSelectedTopics((prev) => prev.filter((topicId) => mergedTopics.some((topic) => topic.id === topicId)));
      } catch (err) {
        console.error('Error loading topics for selected subjects:', err);
        setTopics([]);
        setSelectedTopics([]);
      }
    };

    loadTopics();
  }, [selectedSubjects]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación
    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (durationMinutes < 15 || durationMinutes > 300) {
      setError('La duración debe estar entre 15 y 300 minutos');
      return;
    }

    try {
      setLoading(true);

      const hasCatalogData = subjects.length > 0;
      if (!hasCatalogData) {
        setError('No hay materias disponibles para generar un ensayo personalizado');
        setLoading(false);
        return;
      }

      if (selectedSubjects.length > 0 && topics.length === 0) {
        setError('Las materias seleccionadas no tienen temas con preguntas activas');
        setLoading(false);
        return;
      }

      const payload = {
        title: title.trim(),
        duration_minutes: durationMinutes,
        selected_subjects: selectedSubjects.map(Number),
        selected_topics: selectedTopics.map(Number),
        difficulty,
        num_questions: numQuestions,
      };

      await apiFetch('/catalog/exams/custom', {
        method: 'POST',
        body: payload,
      });

      console.log('Exam data:', { title: title.trim(), durationMinutes, selectedSubjects, selectedTopics, difficulty, numQuestions });
      console.log('Catalog exam context:', { paesExamId });

      onExamCreated();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  return (
    <div className="fixed inset-0 bg-surface-base/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-surface-raised/90 backdrop-blur-xl border border-white/10 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div>
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Crear Ensayo</h2>
            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em] mt-1">Simulador Personalizado</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-text-tertiary group-hover:text-text-primary transition-colors" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Error */}
          {error && (
            <div className="bg-brand-danger/10 border border-brand-danger/20 rounded-xl p-4 flex gap-3 animate-error-shake">
              <AlertCircle className="h-5 w-5 text-brand-danger flex-shrink-0 mt-0.5" />
              <p className="text-brand-danger text-xs font-bold uppercase tracking-wide leading-relaxed">{error}</p>
            </div>
          )}

          {/* Título */}
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">
              Denominación del Ensayo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Simulacro Matemática M1"
              className="w-full px-5 py-4 bg-zinc-950/50 border border-white/10 rounded-xl text-text-primary placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all font-medium"
              maxLength={100}
            />
            <div className="flex justify-end">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{title.length}/100</p>
            </div>
          </div>

          {/* Duración */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">
                Ventana de Tiempo
              </label>
              <span className="text-lg font-black text-brand-primary uppercase tracking-tighter">
                {durationMinutes} <span className="text-xs font-medium text-text-tertiary">min</span>
              </span>
            </div>
            <div className="px-1">
              <input
                type="range"
                min="15"
                max="300"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-brand-primary"
              />
            </div>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide">
              Recomendado: 150 min para simulación oficial
            </p>
          </div>

          {/* Dificultad y número de preguntas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Dificultad</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'all' | 'easy' | 'medium' | 'hard')}
                className="w-full px-4 py-3 bg-zinc-950/50 border border-white/10 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50 appearance-none font-medium text-sm"
              >
                <option value="all" className="bg-surface-raised">Cualquiera</option>
                <option value="easy" className="bg-surface-raised">Nivel Base</option>
                <option value="medium" className="bg-surface-raised">Nivel Intermedio</option>
                <option value="hard" className="bg-surface-raised">Nivel Avanzado</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Carga de Preguntas</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={1}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-brand-accent"
                />
                <span className="text-sm font-black text-brand-accent w-10 text-right">{numQuestions}</span>
              </div>
            </div>
          </div>

          {/* Materias */}
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">
              Módulos Evaluados
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {!loadingCatalog && subjects.length === 0 && (
                <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider italic">No hay módulos cargados</p>
              )}
              {subjects.map((subject) => (
                <label
                  key={subject.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer group ${
                    selectedSubjects.includes(subject.id)
                      ? 'border-brand-primary/40 bg-brand-primary/10'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    className="w-4 h-4 rounded border-white/10 bg-zinc-950 text-brand-primary focus:ring-brand-primary focus:ring-offset-0"
                  />
                  <span className={`text-sm font-bold transition-colors ${selectedSubjects.includes(subject.id) ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                    {subject.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-6 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white/5 border border-white/10 text-text-secondary font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-brand-primary/20 transition-all"
            >
              {loading ? 'Generando...' : 'Iniciar ensayo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
