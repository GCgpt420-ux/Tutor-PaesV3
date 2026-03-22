/**
 * useAuth Hook
 * 
 * Hook para manejar autenticación de forma centralizada.
 * Ejemplo de uso futuro, no reemplaza el código actual todavía.
 */

'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/src/lib/api/client';

// Define a minimal user shape
interface User {
  user_id: number;
  email: string;
  name: string;
  is_admin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<User>('/auth/me')
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
