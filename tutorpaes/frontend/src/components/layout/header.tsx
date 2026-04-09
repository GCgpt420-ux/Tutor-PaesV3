"use client";

import { LogoutButton } from "@/src/features/auth/components/logout-button";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-surface-default/85 border-b border-surface-container">
      <div className="flex h-16 items-center justify-between px-6">
        
        {/* Logo + sección */}
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-brand-primary/20 border border-brand-primary/40 shadow-elevation-sm">
            <span className="text-white font-bold text-xs">TP</span>
          </div>
          <div>
            <p className="text-sm font-display tracking-tight text-text-primary">
              Preu PAES
            </p>
            <p className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">
              Dashboard de estudio
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-raised/70 border border-surface-container">
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-medium text-text-secondary">
              Sesión activa
            </span>
          </div>

          {/* Logout */}
          <div className="hidden sm:block">
            <LogoutButton />
          </div>

          {/* Avatar */}
          <button
            type="button"
            aria-label="Abrir perfil"
            className="interactive-focus relative h-10 w-10 rounded-full border border-brand-primary/40 bg-brand-primary/20 text-white flex items-center justify-center hover:bg-brand-primary/35 transition-colors"
          >
            <span className="text-sm font-bold text-white">U</span>
          </button>
        </div>
      </div>
    </header>
  );
}
