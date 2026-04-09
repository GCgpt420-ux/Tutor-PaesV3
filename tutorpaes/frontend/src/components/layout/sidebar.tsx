'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardList, BookOpen, User, Shield, TrendingUp, Sparkles, LogOut, HelpCircle } from "lucide-react";
import { getCurrentUser } from '@/src/lib/auth/current-user';

type UserMe = {
  user_id: number;
  email: string;
  name: string;
  is_admin: boolean;
};

const baseItems = [
  { icon: Home, label: "Dashboard", href: "/protected" },
  { icon: BookOpen, label: "Cursos", href: "/protected/cursos" },
  { icon: ClipboardList, label: "Ensayos", href: "/protected/ensayos" },
  { icon: TrendingUp, label: "Ranking", href: "/protected/ranking" },
  { icon: User, label: "Perfil", href: "/protected/perfil" },
  { icon: Shield, label: "Facturación", href: "/protected/billing" },
];

const adminItem = { icon: Shield, label: "Admin", href: "/protected/admin", adminOnly: true };

export function DashboardSidebar() {
  const [user, setUser] = useState<UserMe | null>(null);
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === '/protected') {
      return pathname === '/protected';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const data = await getCurrentUser();
        if (isMounted) {
          setUser(data);
        }
      } catch {
        // Ignorar
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const items = user?.is_admin ? [...baseItems, adminItem] : baseItems;

  return (
    <aside className="w-80 h-screen sticky top-0 bg-surface-base flex flex-col py-10 px-6 gap-y-1 z-40 border-r border-white/5">
      {/* Header */}
      <div className="px-2 mb-12 flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-primary/10 rotate-3">
          <BookOpen className="text-brand-primary h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-text-primary tracking-tighter uppercase leading-none">Tutor<span className="text-brand-primary">PAES</span></h1>
          <p className="text-[10px] text-brand-primary font-black tracking-[0.3em] uppercase mt-1 opacity-80">v3.0 Kinetic</p>
        </div>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 space-y-1" aria-label="Navegación principal">
        {items.map((item) => {
          const isActive = isItemActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex items-center gap-4 px-4 py-3.5 min-h-12 font-black uppercase tracking-widest text-[10px] transition-all duration-300 rounded-2xl border ${
                isActive
                  ? "bg-surface-raised border-white/10 text-text-primary shadow-xl"
                  : "text-text-tertiary border-transparent hover:text-text-primary hover:bg-surface-raised/50"
              }`}
            >
              <item.icon className={`h-4 w-4 transition-transform duration-500 ${isActive ? 'text-brand-primary scale-110' : 'group-hover:scale-110'}`} />
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
            </Link>
          );
        })}
      </nav>

      {/* Sección Inferior */}
      <div className="mt-auto space-y-6">
        {/* Mentor AI CTA */}
        <button type="button" className="group w-full relative overflow-hidden bg-brand-primary p-[1px] rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
          <div className="bg-brand-primary/90 hover:bg-brand-primary px-4 py-4 rounded-[15px] flex items-center justify-center gap-3 transition-colors">
            <Sparkles className="h-4 w-4 text-white animate-pulse" />
            <span className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Consultar Tutor</span>
          </div>
        </button>

        {/* Perfil Mini (Optional, if we want to show user here) */}
        
        {/* Enlaces secundarios */}
        <div className="pt-6 border-t border-white/5 space-y-1">
          <Link
            href="/protected/perfil"
            className="group text-text-tertiary hover:text-text-primary flex items-center gap-4 px-4 py-2.5 min-h-10 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl hover:bg-surface-raised/30"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Ayuda</span>
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/auth/login';
              } catch (error) {
                console.error('Error during logout:', error);
              }
            }}
            className="group w-full text-text-tertiary hover:text-brand-danger flex items-center gap-4 px-4 py-2.5 min-h-10 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl hover:bg-brand-danger/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Desconectarse</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
