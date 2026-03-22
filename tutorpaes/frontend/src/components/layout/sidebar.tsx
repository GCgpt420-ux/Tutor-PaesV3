'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, ClipboardList, BookOpen, User, Shield, TrendingUp, Zap } from "lucide-react";
import { getCurrentUser } from '@/src/lib/auth/current-user';

type UserMe = {
  user_id: number;
  email: string;
  name: string;
  is_admin: boolean;
};

const baseItems = [
  { icon: Home, label: "Inicio", href: "/protected" },
  { icon: TrendingUp, label: "Mi Progreso", href: "/protected/progreso" },
  { icon: BookOpen, label: "Cursos", href: "/protected/cursos" },
  { icon: ClipboardList, label: "Ensayos PAES", href: "/protected/ensayos" },
  { icon: User, label: "Mi Perfil", href: "/protected/perfil" },
];

const adminItem = { icon: Shield, label: "Admin", href: "/protected/admin", adminOnly: true };

export function DashboardSidebar() {
  const [user, setUser] = useState<UserMe | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const data = await getCurrentUser();
        if (isMounted) {
          setUser(data);
        }
      } catch {
        // No hacer nada si falla, simplemente no mostramos admin
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const items = user?.is_admin ? [...baseItems, adminItem] : baseItems;

  return (
    <aside className="w-64 h-screen sticky top-0 bg-[#0F1623]/80 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between p-4 z-40">
      <div className="flex flex-col gap-6">

        {/* Header sidebar */}
        <div className="p-4 rounded-2xl glass-card">
          <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
             Espacio de Estudio
          </p>
          <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-bold">
            Organiza tu aprendizaje
          </p>
        </div>

        {/* Navegación */}
        <nav className="flex flex-col gap-2">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-zinc-50 hover:bg-white/5 transition-all"
            >
              <div className="p-2 rounded-lg bg-black/20 group-hover:bg-brand-primary/20 transition-colors border border-transparent group-hover:border-brand-primary/30">
                <item.icon className="h-4 w-4 text-zinc-400 group-hover:text-brand-primary transition-colors" />
              </div>
              <span className="text-sm font-medium">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Footer sidebar */}
      <div className="mt-8 p-4 rounded-xl border border-brand-accent/20 bg-brand-accent/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-brand-accent/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
        <p className="text-xs font-bold text-brand-accent relative z-10 flex items-center gap-2">
          <Zap className="h-3 w-3" /> Tip del día
        </p>
        <p className="text-xs text-zinc-400 mt-2 relative z-10">
          Repasar errores mejora más que repetir ejercicios ciegamente.
        </p>
      </div>
    </aside>
  );
}
