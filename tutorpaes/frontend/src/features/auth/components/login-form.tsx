"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Server, Sparkles } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Error al iniciar sesión");
      }

      router.push("/protected");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    
    const demoEmail = "demo@example.com";
    const demoPassword = "demo123";
    
    // Simular tipeo animado
    for (let i = 0; i <= demoEmail.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      setEmail(demoEmail.slice(0, i));
    }
    for (let i = 0; i <= demoPassword.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      setPassword(demoPassword.slice(0, i));
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Error al iniciar sesión demo");
      }

      router.push("/protected");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión demo";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Indicador de Estado */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
          <Server className="h-3 w-3 text-brand-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-mono">
            Conexión Segura
          </span>
          <span className="w-2 h-2 rounded-full bg-success animate-pulse ml-2" />
        </div>
      </div>

      <div className="glass-card bg-surface-raised/20 border-white/10 p-8 sm:p-10 rounded-[2.5rem] relative overflow-hidden backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        {/* Glow Decorativo */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-primary/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="mb-10 text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-zinc-400 text-sm font-medium">
            Accede a tu panel, historial y progreso de simulaciones.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
              Identificador (Correo)
            </Label>
            <div className="relative group">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-14 bg-black/50 border-white/10 text-white placeholder:text-zinc-700 font-mono text-sm focus-visible:ring-1 focus-visible:ring-brand-primary/50 focus-visible:border-brand-primary transition-all rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                Contraseña
              </Label>
              <Link href="/auth/forgot-password" className="text-[10px] uppercase font-bold tracking-wider text-brand-primary hover:text-white transition-colors">
                ¿Recuperar?
              </Link>
            </div>
            <div className="relative group">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-12 h-14 bg-black/50 border-white/10 text-white placeholder:text-zinc-700 font-mono text-sm focus-visible:ring-1 focus-visible:ring-brand-primary/50 focus-visible:border-brand-primary transition-all rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
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
            {isLoading ? "Ingresando..." : "Ir a mi panel"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <span className="relative px-3 bg-zinc-950 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              o
            </span>
          </div>

          <Button
            type="button"
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-brand-primary/20 via-brand-accent/20 to-brand-primary/20 border border-brand-primary/30 text-white hover:border-brand-primary hover:from-brand-primary/30 hover:to-brand-accent/30 font-black uppercase tracking-[0.2em] text-[11px] transition-all hover:scale-[1.02] active:scale-[0.98] flex gap-2 justify-center items-center shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-pulse"
          >
            <Sparkles className="h-4 w-4 text-brand-primary" />
            {isLoading ? "Ingresando..." : "Probar Demostración"}
          </Button>

          <div className="pt-6 border-t border-white/5 text-center mt-6">
            <p className="text-xs text-zinc-500 font-medium">
              ¿Aún no tienes cuenta?{" "}
              <br className="sm:hidden" />
              <Link href="/auth/sign-up" className="text-white hover:text-brand-primary font-bold transition-colors underline decoration-white/20 underline-offset-4 mt-1 sm:mt-0 inline-block">
                Crear cuenta
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
