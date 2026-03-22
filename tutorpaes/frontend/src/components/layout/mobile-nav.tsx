'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, BookOpen, ClipboardList, Shield } from 'lucide-react';
import { getCurrentUser } from '@/src/lib/auth/current-user';

type UserMe = {
  user_id: number;
  email: string;
  name: string;
  is_admin: boolean;
};

const baseNavItems = [
  { icon: Home, label: 'Inicio', href: '/protected' },
  { icon: BookOpen, label: 'Cursos', href: '/protected/cursos' },
  { icon: ClipboardList, label: 'Ensayos', href: '/protected/ensayos' },
];

const adminNavItem = { icon: Shield, label: 'Admin', href: '/protected/admin', adminOnly: true };

export function MobileNav() {
  const pathname = usePathname();
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

  const navItems = user?.is_admin ? [...baseNavItems, adminNavItem] : baseNavItems;

  const isActive = (href: string) => {
    if (href === '/protected') {
      return pathname === '/protected';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg lg:hidden z-40">
      <div className="flex items-center justify-around h-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
