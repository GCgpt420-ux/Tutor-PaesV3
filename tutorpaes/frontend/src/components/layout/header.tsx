"use client";

import { LogoutButton } from "@/src/features/auth/components/logout-button";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#0F1623]/80 border-b border-white/10">
      <div className="flex h-16 items-center justify-between px-6">
        
        {/* Logo + sección */}
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <span className="text-white font-bold text-xs">TP</span>
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-50">
              Preu PAES
            </p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              Dashboard de estudio
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/5">
            <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-medium text-zinc-300">
              Sesión activa
            </span>
          </div>

          {/* Logout */}
          <div className="hidden sm:block">
            <LogoutButton />
          </div>

          {/* Avatar */}
          <button className="relative h-9 w-9 rounded-full bg-gradient-to-br from-brand-secondary to-brand-primary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:scale-105 transition-transform">
            <span className="text-sm font-bold text-white">U</span>
          </button>
        </div>
      </div>
    </header>
  );
}
