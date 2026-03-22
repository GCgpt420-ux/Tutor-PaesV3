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

  const toggleTopic = (topicId: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Crear Ensayo</h2>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Título del Ensayo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Mi ensayo de Matemática"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Duración (minutos)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="15"
                max="300"
                step="15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-lg font-bold text-blue-600 min-w-fit">
                {durationMinutes}m
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sugerencia: 150 minutos (2h 30m) para un ensayo completo
            </p>
          </div>

            {/* Dificultad y número de preguntas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Dificultad</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'all' | 'easy' | 'medium' | 'hard')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Cualquiera</option>
                  <option value="easy">Fácil</option>
                  <option value="medium">Intermedio</option>
                  <option value="hard">Difícil</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Filtra las preguntas por dificultad</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Número de preguntas</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={1}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-bold text-blue-600 w-14 text-right">{numQuestions}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Máx: 200 preguntas. Se seleccionarán aleatoriamente.</p>
              </div>
            </div>

          {/* Materias */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Materias (Opcional)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {!loadingCatalog && subjects.length === 0 && (
                <p className="text-sm text-gray-500">No hay materias disponibles para crear ensayo aún.</p>
              )}
              {subjects.map((subject) => (
                <label
                  key={subject.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{subject.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selecciona las materias de las que deseas incluir preguntas
            </p>
          </div>

          {/* Temas específicos (si hay materias seleccionadas) */}
          {topics.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Temas específicos (Opcional)</label>

              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setSelectedTopics(topics.map((t) => t.id))}
                  className="min-h-[44px] px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-sm"
                >
                  Seleccionar todos
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTopics([])}
                  className="min-h-[44px] px-3 py-1 bg-gray-50 text-gray-700 rounded-lg border border-gray-100 text-sm"
                >
                  Limpiar
                </button>
                <p className="text-xs text-gray-500 ml-auto">Puedes elegir temas concretos</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {topics.map((topic) => (
                  <label
                    key={topic.id}
                    className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic.id)}
                      onChange={() => toggleTopic(topic.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{topic.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] px-4 py-2 border border-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Creando...' : 'Crear Ensayo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
