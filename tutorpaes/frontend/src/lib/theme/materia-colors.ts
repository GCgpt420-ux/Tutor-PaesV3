/**
 * Configuración centralizada de colores por materia
 * Evita hardcoding en componentes y facilita mantenimiento
 */

export type MateriaId = 'matematica' | 'lenguaje' | 'ciencias' | 'historia';

export interface MateriaColorConfig {
  primary: string;      // Color principal (Tailwind)
  accent: string;       // Highlight/hover
  light: string;        // Fondo suave
  dark: string;         // Variante oscura
  gradient: {
    from: string;       // Inicio gradiente
    to: string;         // Fin gradiente
  };
}

export interface MateriaThemeClasses {
  textAccent: string;
  bgDark20: string;
  borderPrimary30: string;
  lineBg: string;
  glow: string;
}

export const MATERIA_COLORS: Record<MateriaId, MateriaColorConfig> = {
  matematica: {
    primary: 'blue-500',
    accent: 'blue-400',
    light: 'blue-50',
    dark: 'blue-900',
    gradient: {
      from: 'from-blue-500',
      to: 'to-blue-600',
    },
  },
  lenguaje: {
    primary: 'rose-500',
    accent: 'rose-400',
    light: 'rose-50',
    dark: 'rose-900',
    gradient: {
      from: 'from-rose-500',
      to: 'to-rose-600',
    },
  },
  ciencias: {
    primary: 'emerald-500',
    accent: 'emerald-400',
    light: 'emerald-50',
    dark: 'emerald-900',
    gradient: {
      from: 'from-emerald-500',
      to: 'to-emerald-600',
    },
  },
  historia: {
    primary: 'amber-500',
    accent: 'amber-400',
    light: 'amber-50',
    dark: 'amber-900',
    gradient: {
      from: 'from-amber-500',
      to: 'to-amber-600',
    },
  },
};

export const MATERIA_THEME_CLASSES: Record<MateriaId, MateriaThemeClasses> = {
  matematica: {
    textAccent: 'text-blue-400',
    bgDark20: 'bg-blue-900/20',
    borderPrimary30: 'border-blue-500/30',
    lineBg: 'bg-blue-500',
    glow: 'group-hover:shadow-[0_0_30px_rgba(59,130,246,0.40)]',
  },
  lenguaje: {
    textAccent: 'text-rose-400',
    bgDark20: 'bg-rose-900/20',
    borderPrimary30: 'border-rose-500/30',
    lineBg: 'bg-rose-500',
    glow: 'group-hover:shadow-[0_0_30px_rgba(244,63,94,0.40)]',
  },
  ciencias: {
    textAccent: 'text-emerald-400',
    bgDark20: 'bg-emerald-900/20',
    borderPrimary30: 'border-emerald-500/30',
    lineBg: 'bg-emerald-500',
    glow: 'group-hover:shadow-[0_0_30px_rgba(16,185,129,0.40)]',
  },
  historia: {
    textAccent: 'text-amber-400',
    bgDark20: 'bg-amber-900/20',
    borderPrimary30: 'border-amber-500/30',
    lineBg: 'bg-amber-500',
    glow: 'group-hover:shadow-[0_0_30px_rgba(245,158,11,0.40)]',
  },
};

/**
 * Resolver un nombre cualquiera (ej. "Tutor Matemática PAES") a un MateriaId canónico.
 */
export function resolveMateriaId(name: string): MateriaId {
  const lower = name.toLowerCase();
  if (lower.includes('matemática') || lower.includes('matematica') || lower.includes('m1') || lower.includes('m2')) {
    return 'matematica';
  } else if (lower.includes('lectora') || lower.includes('lenguaje')) {
    return 'lenguaje';
  } else if (lower.includes('ciencia')) {
    return 'ciencias';
  } else if (lower.includes('historia')) {
    return 'historia';
  }
  return 'matematica'; // default fallback
}

/**
 * Obtener configuración de color para una materia
 * @param materiaId - ID de la materia
 * @returns Configuración de colores
 */
export function getMateriaColor(materiaId: string): MateriaColorConfig {
  const normalized = materiaId?.toLowerCase() as MateriaId;
  return MATERIA_COLORS[normalized] || MATERIA_COLORS.matematica;
}

/**
 * Obtener color primario de una materia (para clases rápidas)
 * @param materiaId - ID de la materia
 * @returns Clase Tailwind del color primario
 */
export function getMateriaColorClass(materiaId: string): string {
  const normalized = materiaId?.toLowerCase() as MateriaId;
  const map: Record<MateriaId, string> = {
    matematica: 'bg-blue-500',
    lenguaje: 'bg-rose-500',
    ciencias: 'bg-emerald-500',
    historia: 'bg-amber-500',
  };
  return map[normalized] || map.matematica;
}

/**
 * Map legible de materias a labels
 */
export const MATERIA_LABELS: Record<MateriaId, string> = {
  matematica: 'Matemática',
  lenguaje: 'Lenguaje',
  ciencias: 'Ciencias',
  historia: 'Historia',
};
