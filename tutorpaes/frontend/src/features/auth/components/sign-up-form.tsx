"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Lock, Mail, User, ShieldAlert } from "lucide-react";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Fallo de integridad: Las contraseñas no coinciden.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, name, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.detail || "Error al solicitar acceso.");
      }

      router.push("/protected");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error de red al crear la cuenta.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[500px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Indicador de Estado Táctico */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
          <ShieldAlert className="h-3 w-3 text-brand-accent" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-mono">
            Protocolo de Nuevo Recluta
          </span>
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse ml-2" />
        </div>
      </div>

      <div className="glass-card bg-surface-raised/20 border-white/10 p-8 sm:p-10 rounded-[2.5rem] relative overflow-hidden backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        {/* Glow Decorativo */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-brand-accent/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="mb-10 text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white mb-2">
            Alta en el Sistema
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Registra tus credenciales. El entrenamiento comienza ahora.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6 relative z-10">
          
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
              Alias / Nombre
            </Label>
            <div className="relative group">
              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-accent transition-colors" />
              <Input
                id="name"
                type="text"
                placeholder="Ej: Recluta 01"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-11 h-14 bg-black/50 border-white/10 text-white placeholder:text-zinc-700 font-mono text-sm focus-visible:ring-1 focus-visible:ring-brand-accent/50 focus-visible:border-brand-accent transition-all rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
              Identificador (Correo)
            </Label>
            <div className="relative group">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-accent transition-colors" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-14 bg-black/50 border-white/10 text-white placeholder:text-zinc-700 font-mono text-sm focus-visible:ring-1 focus-visible:ring-brand-accent/50 focus-visible:border-brand-accent transition-all rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                Clave de Acceso
              </Label>
              <div className="relative group">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-accent transition-colors" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 h-14 bg-black/50 border-white/10 text-white placeholder:text-zinc-700 font-mono text-sm focus-visible:ring-1 focus-visible:ring-brand-accent/50 focus-visible:border-brand-accent transition-all rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repeat-password" className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                Confirmar
              </Label>
              <div className="relative group">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-accent transition-colors" />
                <Input
                  id="repeat-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="pl-11 h-14 bg-black/50 border-white/10 text-white placeholder:text-zinc-700 font-mono text-sm focus-visible:ring-1 focus-visible:ring-brand-accent/50 focus-visible:border-brand-accent transition-all rounded-xl"
                />
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-xl border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger font-medium animate-error-shake">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-danger animate-pulse flex-shrink-0" />
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-14 rounded-xl bg-white hover:bg-zinc-200 text-black font-black uppercase tracking-[0.2em] text-[11px] transition-transform hover:scale-[1.02] active:scale-[0.98] mt-4 flex gap-2" 
            disabled={isLoading}
          >
            {isLoading ? "Creando Nodos..." : "Iniciar Entrenamiento PAES"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>

          <div className="pt-6 border-t border-white/5 text-center mt-6">
            <p className="text-xs text-zinc-500 font-medium">
              CRITICAL: ¿Ya tienes credenciales?{" "}
              <br className="sm:hidden" />
              <Link href="/auth/login" className="text-white hover:text-brand-accent font-bold transition-colors underline decoration-white/20 underline-offset-4 mt-1 sm:mt-0 inline-block">
                Forzar acceso directo
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
