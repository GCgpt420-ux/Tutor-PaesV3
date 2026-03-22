import { Clock, BookOpen, ChevronRight, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';
import { getMateriaColor, MateriaId } from '@/lib/theme/materia-colors';

interface ExamCardProps {
  id: string;
  title: string;
  type: 'oficial' | 'personalizado';
  scheduledAt: string | null;
  durationMinutes: number;
  createdAt: string;
  lastScore?: number | null; // Optional prop to show previous scores
}

/**
 * Map exam/title names to MateriaId for color resolution
 */
function resolveMateriaIdFromTitle(title: string): MateriaId {
  const lower = title.toLowerCase();
  if (lower.includes('matemática') || lower.includes('m1') || lower.includes('m2')) {
    return 'matematica';
  } else if (lower.includes('lectora') || lower.includes('lenguaje')) {
    return 'lenguaje';
  } else if (lower.includes('ciencia')) {
    return 'ciencias';
  } else if (lower.includes('historia')) {
    return 'historia';
  }
  return 'matematica';
}

export function ExamCard({
  id,
  title,
  type,
  durationMinutes,
  lastScore,
}: ExamCardProps) {
  const isOfficial = type === 'oficial';
  
  // Theme logic based on title keywords - USING CONFIG CENTRALIZADO
  const materiaId = resolveMateriaIdFromTitle(title);
  const materiaColor = getMateriaColor(materiaId);
  
  // Map icons by materia
  const iconMap: Record<MateriaId, React.ReactNode> = {
    matematica: <Clock className={`h-6 w-6 text-${materiaColor.accent}`} />,
    lenguaje: <BookOpen className={`h-6 w-6 text-${materiaColor.accent}`} />,
    ciencias: <Clock className={`h-6 w-6 text-${materiaColor.accent}`} />,
    historia: <Clock className={`h-6 w-6 text-${materiaColor.accent}`} />,
  };
  
  const themeObj = {
    bg: `from-${materiaColor.dark}/40 to-zinc-900`,
    border: `border-${materiaColor.primary}/40 hover:border-${materiaColor.primary}`,
    accentLine: `bg-${materiaColor.primary}`,
    text: `text-${materiaColor.accent}`,
    icon: iconMap[materiaId],
    shadow: `hover:shadow-${materiaColor.primary}/20`,
  };


  return (
    <Link href={`/protected/ensayos/${id}`} className="block h-full cursor-pointer">
      <div className={`group relative h-full bg-gradient-to-b ${themeObj.bg} border-2 ${themeObj.border} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between overflow-hidden ${themeObj.shadow}`}>
        
        {/* Glow Top Line */}
        <div className={`absolute top-0 left-0 w-full h-1 ${themeObj.accentLine} opacity-80`} />

        <div>
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-inner`}>
              {themeObj.icon}
            </div>
            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-zinc-950 border border-zinc-800 ${themeObj.text}`}>
              {isOfficial ? 'Oficial' : 'Custom'}
            </span>
          </div>
          
          <h3 className="text-xl font-black text-zinc-50 uppercase tracking-wide leading-tight mb-2 group-hover:text-white transition-colors">
            {title}
          </h3>
          
          <p className="text-zinc-400 text-sm font-medium mb-6">
            Misión Escalonada • {durationMinutes} min
          </p>
        </div>

        {/* Footer info: Last Score */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60 mt-auto">
          <div className="flex items-center gap-2">
            <Trophy className={`h-4 w-4 ${themeObj.text}`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Último Puntaje</span>
              <span className={`text-sm font-black ${lastScore ? 'text-zinc-50' : 'text-zinc-600'}`}>
                {lastScore ? `${lastScore} pts` : '---'}
              </span>
            </div>
          </div>
          
          <div className={`w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0`}>
            <ChevronRight className={`h-4 w-4 ${themeObj.text}`} />
          </div>
        </div>
      </div>
    </Link>
  );
}
