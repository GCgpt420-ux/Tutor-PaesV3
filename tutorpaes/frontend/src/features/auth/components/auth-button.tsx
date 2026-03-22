"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { useEffect, useState } from "react";
import { apiFetch } from "@/src/lib/api/client";
import { LogoutButton } from "./logout-button";

// Definimos la interfaz basada en lo que devuelve tu backend en Python
interface UserMe {
  email: string;
  name?: string;
}

export function AuthButton() {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<UserMe>("/auth/me")
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="h-9 w-20 animate-pulse bg-gray-100 rounded-md" />;

  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-blue-900">
        Hola, {user.name || user.email.split('@')[0]}!
      </span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      {/* Botón Iniciar Sesión (Equivalente a variant="outline" y size="sm") */}
      <Button asChild className="h-9 px-3 border border-blue-200 bg-transparent text-blue-700 hover:bg-blue-50 transition-colors">
        <Link href="/auth/login">Iniciar Sesión</Link>
      </Button>
      {/* Botón Registrarse (Equivalente a variant="default" y size="sm") */}
      <Button asChild className="h-9 px-3 bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">
        <Link href="/auth/sign-up">Registrarse</Link>
      </Button>
    </div>
  );
}