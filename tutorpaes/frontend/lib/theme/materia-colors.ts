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
  return `bg-${getMateriaColor(materiaId).primary}`;
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
