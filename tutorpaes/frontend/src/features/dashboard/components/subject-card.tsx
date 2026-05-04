import { Bot, Sparkles, Hexagon, BrainCircuit, Orbit, ChevronRight, LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { MATERIA_THEME_CLASSES, MateriaId } from '@/src/lib/theme/materia-colors';

interface SubjectCardProps {
  id: string;
  name: string;
  description: string;
  materiaId: MateriaId;
  icon_url?: string;
  onClick: () => void;
}

const MATERIA_ICONS: Record<MateriaId, LucideIcon> = {
  matematica: Hexagon,
  lenguaje: Sparkles,
  ciencias: Orbit,
  historia: BrainCircuit,
};

export function SubjectCard({
  name,
  description,
  materiaId,
  icon_url,
  onClick,
}: SubjectCardProps) {
  const theme = MATERIA_THEME_CLASSES[materiaId] || MATERIA_THEME_CLASSES.matematica;
  const ThemeIcon = MATERIA_ICONS[materiaId] || Bot;

  return (
    <button
      onClick={onClick}
      className={`group relative h-full bg-black/40 backdrop-blur-xl border border-white/5 hover:${theme.borderPrimary30} rounded-xl p-6 transition-all duration-500 text-left flex flex-col justify-between overflow-hidden shadow-2xl overflow-hidden ${theme.glow}`}
    >
      {/* Decorative Glow inside */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 ${theme.bgDark20} blur-[50px] transition-all duration-700 group-hover:scale-150 group-hover:opacity-100 opacity-0 pointer-events-none`} />

      {/* Top Section */}
      <div className="relative z-10 w-full">
        <div className="flex items-start justify-between mb-8 w-full border-b border-white/5 pb-4">
          <div className="flex flex-col gap-2">
            <span className={`px-2.5 py-1 uppercase font-mono text-[9px] font-black tracking-[0.25em] bg-black border ${theme.borderPrimary30} ${theme.textAccent} max-w-fit rounded-sm shadow-inner`}>
              CURSO IA
            </span>
          </div>
          <div className={`p-3 border border-white/5 bg-white/5 rounded-lg transition-transform duration-500 group-hover:scale-110 group-hover:bg-white/10`}>
            {icon_url ? (
              <div className="relative h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity">
                <Image
                  src={icon_url}
                  alt={name}
                  className="object-contain"
                  fill
                  sizes="24px"
                />
              </div>
            ) : (
              <ThemeIcon className={`h-6 w-6 opacity-80 group-hover:opacity-100 transition-opacity ${theme.textAccent}`} />
            )}
          </div>
        </div>

        <h3 className="text-2xl font-black uppercase tracking-tighter text-white leading-none mb-3 group-hover:text-white transition-colors duration-300">
          {name}
        </h3>

        <p className="text-xs text-zinc-500 font-mono tracking-wide leading-relaxed line-clamp-2 uppercase group-hover:text-zinc-400 transition-colors">
          {description || 'Práctica guiada con simulaciones y apoyo IA.'}
        </p>
      </div>

      {/* Footer Section */}
      <div className="relative z-10 w-full mt-10">
        <div className={`w-full h-12 bg-white/5 border border-white/5 flex items-center justify-between px-4 rounded-lg group-hover:bg-white/10 transition-colors duration-300`}>
          <span className={`font-black uppercase tracking-[0.2em] text-[10px] ${theme.textAccent}`}>
            VER CURSO
          </span>
          <ChevronRight className={`h-4 w-4 ${theme.textAccent} transition-transform duration-300 group-hover:translate-x-1`} />
        </div>
      </div>
      
      {/* Target Crosshairs decorativos */}
      <div className="absolute top-4 left-4 w-1 h-3 border-l border-t border-white/20" />
      <div className="absolute top-4 right-4 w-1 h-3 border-r border-t border-white/20" />
      <div className="absolute bottom-4 left-4 w-1 h-3 border-l border-b border-white/20" />
      <div className="absolute bottom-4 right-4 w-1 h-3 border-r border-b border-white/20" />
    </button>
  );
}
