'use client';

import { useEffect, useState } from 'react';
import { Loader, Plus, Calendar, FileText } from 'lucide-react';
import { ExamCard } from '@/src/features/dashboard/components/exam-card';
import { CreateExamModal } from '@/src/features/exams/components/create-exam-modal';
import { apiFetch } from '@/src/lib/api/client';

interface Exam {
  exam_id: number;
  code: string;
  name: string;
  is_custom?: boolean;
  subjects: Array<{
    subject_id: number;
    subject_code: string;
    name: string;
  }>;
}

interface ExamCardData {
  id: string;
  title: string;
  type: 'oficial' | 'personalizado';
  scheduled_at: string | null;
  duration_minutes: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

type TabType = 'oficial' | 'personalizado';

export default function EnsayosPage() {
  const [activeTab, setActiveTab] = useState<TabType>('oficial');
  const [officialExams, setOfficialExams] = useState<ExamCardData[]>([]);
  const [customExams, setCustomExams] = useState<ExamCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadExams = async () => {
    const exams = await apiFetch<Exam[]>('/catalog/exams/');

    const officialExamsData: ExamCardData[] = exams
      .filter((exam) => !exam.is_custom)
      .map((exam) => ({
        id: exam.exam_id.toString(),
        title: exam.name,
        type: 'oficial' as const,
        scheduled_at: null,
        duration_minutes: 180,
        is_active: true,
        created_by: null,
        created_at: new Date().toISOString(),
      }));

    const customExamsData: ExamCardData[] = exams
      .filter((exam) => exam.is_custom)
      .map((exam) => ({
        id: exam.exam_id.toString(),
        title: exam.name,
        type: 'personalizado' as const,
        scheduled_at: null,
        duration_minutes: 150,
        is_active: true,
        created_by: null,
        created_at: new Date().toISOString(),
      }));

    setOfficialExams(officialExamsData);
    setCustomExams(customExamsData);
  };

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await loadExams();
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar ensayos');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const handleExamCreated = () => {
    setShowCreateModal(false);
    void loadExams();
    setActiveTab('personalizado');
  };

  const exams = activeTab === 'oficial' ? officialExams : customExams;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-10 w-10 text-brand-primary animate-spin" />
          <p className="text-zinc-400 font-medium uppercase tracking-widest text-sm">Cargando misiones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-50 uppercase tracking-tight">Mis Ensayos</h1>
          <p className="text-zinc-400 mt-2 font-medium">
            Entrena con simulaciones oficiales o crea tus propios desafíos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl shadow-lg hover:shadow-brand-primary/20 transition-all uppercase text-sm tracking-wide"
        >
          <Plus className="h-5 w-5" />
          Nuevo Ensayo
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 border-b-2 border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('oficial')}
          className={`px-6 py-3 font-black text-sm uppercase tracking-wide transition-all rounded-t-xl ${
            activeTab === 'oficial'
              ? 'text-brand-primary bg-brand-primary/10 border-b-2 border-brand-primary -mb-[10px]'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Oficiales ({officialExams.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab('personalizado')}
          className={`px-6 py-3 font-black text-sm uppercase tracking-wide transition-all rounded-t-xl ${
            activeTab === 'personalizado'
              ? 'text-brand-primary bg-brand-primary/10 border-b-2 border-brand-primary -mb-[10px]'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Custom ({customExams.length})
          </div>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-900/20 border-2 border-red-900/50 rounded-xl p-4 animate-error-shake">
          <p className="text-red-400 font-bold uppercase tracking-wider text-sm">Error</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Contenido de Tabs */}
      {exams.length === 0 ? (
        <div className="bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-800 rounded-2xl p-12 text-center shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800">
              {activeTab === 'oficial' ? (
                <Calendar className="h-10 w-10 text-brand-primary opacity-50" />
              ) : (
                <FileText className="h-10 w-10 text-brand-primary opacity-50" />
              )}
            </div>
          </div>
          <p className="text-zinc-50 font-black text-xl mb-2 uppercase tracking-wide">
            {activeTab === 'oficial'
              ? 'Sin misiones oficiales'
              : 'Sin misiones personalizadas'}
          </p>
          <p className="text-zinc-400 text-sm font-medium">
            {activeTab === 'oficial'
              ? 'Pronto agregaremos nuevo material oficial'
              : 'Crea tu primera simulación para empezar a entrenar'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <ExamCard
              key={exam.id}
              id={exam.id}
              title={exam.title}
              type={exam.type}
              scheduledAt={exam.scheduled_at}
              durationMinutes={exam.duration_minutes}
              createdAt={exam.created_at}
            />
          ))}
        </div>
      )}

      {/* Modal para crear ensayo */}
      {showCreateModal && (
        <CreateExamModal
          onClose={() => setShowCreateModal(false)}
          onExamCreated={handleExamCreated}
        />
      )}
    </div>
  );
}
