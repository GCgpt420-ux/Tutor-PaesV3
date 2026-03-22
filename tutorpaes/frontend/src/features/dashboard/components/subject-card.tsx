import { Bot, Sparkles, Hexagon, BrainCircuit, Orbit, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { getMateriaColor, MateriaId } from '@/lib/theme/materia-colors';

interface SubjectCardProps {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  onClick: () => void;
}

/**
 * Map materia names to MateriaId for color resolution
 */
function resolveMateriaId(name: string): MateriaId {
  const lower = name.toLowerCase();
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

export function SubjectCard({
  name,
  description,
  icon_url,
  onClick,
}: SubjectCardProps) {

  // Asignar un avatar IA basado en la materia - USANDO CONFIG CENTRALIZADO
  const lowerName = name.toLowerCase();
  const materiaId = resolveMateriaId(name);
  const materiaColor = getMateriaColor(materiaId);
  
  let ThemeIcon = Bot;
  if (lowerName.includes('matemática') || lowerName.includes('m1') || lowerName.includes('m2')) {
    ThemeIcon = Hexagon;
  } else if (lowerName.includes('lectora') || lowerName.includes('lenguaje')) {
    ThemeIcon = Sparkles;
  } else if (lowerName.includes('ciencia')) {
    ThemeIcon = Orbit;
  } else if (lowerName.includes('historia')) {
    ThemeIcon = BrainCircuit;
  }

  const themeColor = `text-${materiaColor.accent}`;
  const themeBg = `bg-${materiaColor.primary}/10 border-${materiaColor.primary}/20 hover:border-${materiaColor.primary}`;

  return (
    <button
      onClick={onClick}
      className={`group h-full bg-surface-raised/80 backdrop-blur-md border-2 border-zinc-800 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-left flex flex-col justify-between ${themeColor.replace('text-', 'hover:border-')} border-opacity-50 hover:border-opacity-100`}
    >
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className={`p-4 rounded-2xl border ${themeBg} transition-colors`}>
            {icon_url ? (
              <div className="relative h-7 w-7">
                <Image
                  src={icon_url}
                  alt={name}
                  className="object-contain"
                  fill
                  sizes="28px"
                />
              </div>
            ) : (
              <ThemeIcon className={`h-7 w-7 ${themeColor}`} />
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-800 bg-zinc-950 ${themeColor}`}>
            IA Coach
          </div>
        </div>

        <h3 className="text-xl font-black text-zinc-50 uppercase tracking-wide leading-tight group-hover:text-white transition-colors">
          Tutor {name}
        </h3>

        <p className="text-sm text-zinc-400 mt-3 font-medium line-clamp-2">
          {description || 'Entrena tus habilidades con asistencia inteligente.'}
        </p>
      </div>

      <div className={`mt-8 flex items-center gap-2 font-bold uppercase tracking-widest text-sm opacity-0 group-hover:opacity-100 transition-opacity ${themeColor}`}>
        <span>Entrenar con el Tutor</span>
        <ChevronRight className="h-5 w-5" />
      </div>
    </button>
  );
}
