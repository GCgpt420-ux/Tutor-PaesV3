import type { ComponentType } from 'react';
import { ParabolaWidget } from './ParabolaWidget';

// Cada widget declara sus propios props; el registro los invoca dinámicamente por nombre.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WIDGET_REGISTRY: Record<string, ComponentType<any>> = {
  PARABOLA: ParabolaWidget,
};

interface WidgetSkeletonProps {
  name: string;
  unknown?: boolean;
}

export function WidgetSkeleton({ name, unknown }: WidgetSkeletonProps) {
  return (
    <div className="my-2 flex items-center gap-2 rounded-xl border border-white/10 bg-surface-container/40 p-3 text-xs text-text-tertiary">
      <span className="h-2 w-2 animate-pulse rounded-full bg-brand-primary/60" aria-hidden="true" />
      {unknown ? `Widget "${name}" no reconocido` : `Cargando ${name.toLowerCase() || 'widget'}…`}
    </div>
  );
}
