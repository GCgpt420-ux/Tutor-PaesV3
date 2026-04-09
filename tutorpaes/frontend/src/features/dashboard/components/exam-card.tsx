import { Clock, BookOpen, ChevronRight, Hash, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import {
  MATERIA_THEME_CLASSES,
  MateriaId,
  resolveMateriaId,
} from '@/src/lib/theme/materia-colors';

interface ExamCardProps {
  id: string;
  title: string;
  type: 'oficial' | 'personalizado';
  scheduledAt: string | null;
  durationMinutes: number;
  createdAt: string;
  lastScore?: number | null; // Optional prop to show previous scores
}

export function ExamCard({
  id,
  title,
  type,
  durationMinutes,
  lastScore,
}: ExamCardProps) {
  const isOfficial = type === 'oficial';
  
  // Theme logic based on title keywords
  const materiaId = resolveMateriaId(title);
  const theme = MATERIA_THEME_CLASSES[materiaId] || MATERIA_THEME_CLASSES.matematica;
  
  // Map icons by materia
  const iconMap: Record<MateriaId, React.ReactNode> = {
    matematica: <Hash className={`h-4 w-4 ${theme.textAccent}`} />,
    lenguaje: <BookOpen className={`h-4 w-4 ${theme.textAccent}`} />,
    ciencias: <ShieldAlert className={`h-4 w-4 ${theme.textAccent}`} />,
    historia: <Clock className={`h-4 w-4 ${theme.textAccent}`} />,
  };
  
  const themeObj = {
    bg: theme.bgDark20,
    border: theme.borderPrimary30,
    text: theme.textAccent,
    icon: iconMap[materiaId],
    glow: theme.glow,
    lineBg: theme.lineBg,
  };

  return (
    <Link href={`/protected/ensayos/${id}`} className="block h-full cursor-pointer">
      <div className={`group relative h-full bg-black/60 backdrop-blur-md border border-white/5 hover:${themeObj.border} rounded-none p-6 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-2xl ${themeObj.glow}`}>
        
        {/* Glow Top Line Asimétrico */}
        <div className={`absolute top-0 left-0 w-24 h-[2px] ${themeObj.lineBg} opacity-80 group-hover:w-full transition-all duration-700`} />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:12px_12px] opacity-10 pointer-events-none mix-blend-overlay" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className={`p-2 bg-black border border-white/10 shadow-inner group-hover:scale-110 transition-transform`}>
              {themeObj.icon}
            </div>
            
            <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase tracking-[0.2em] bg-black border ${isOfficial ? `${themeObj.border} ${themeObj.text}` : 'border-white/10 text-zinc-500'} shadow-inner`}>
              {isOfficial ? 'Sim. Oficial' : 'Sim. Custom'}
            </span>
          </div>
          
          <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-3 group-hover:text-white transition-colors line-clamp-2">
            {title}
          </h3>
          
          <div className="flex items-center gap-2 mb-8">
            <Clock className="w-3 h-3 text-zinc-500" />
            <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
              DURACIÓN: <span className="text-white">{durationMinutes}m</span>
            </p>
          </div>
        </div>

        {/* Footer info: Last Score with Brutalist Data-Block */}
        <div className="relative z-10 flex flex-col pt-4 border-t border-white/5 mt-auto">
          <span className="text-[9px] font-mono text-zinc-600 uppercase font-black tracking-[0.2em] mb-1">Registro Anterior</span>
          <div className="flex items-end justify-between">
            <span className={`text-3xl font-black leading-none ${lastScore ? 'text-white' : 'text-zinc-700'} tracking-tighter`}>
              {lastScore ? lastScore : '000'}
              <span className={`text-[10px] font-mono tracking-widest ml-1 ${themeObj.text} align-top uppercase`}>pts</span>
            </span>
            
            <div className={`w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors`}>
              <ChevronRight className={`h-4 w-4 ${themeObj.text}`} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
