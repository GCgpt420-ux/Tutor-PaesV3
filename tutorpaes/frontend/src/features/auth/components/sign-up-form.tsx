"use client";

import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { 
  BookOpen, 
  GraduationCap, 
  Lightbulb, 
  Notebook, 
  Brain,
  Users,
  Library,
  User // <- Añadí el icono de usuario
} from "lucide-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  // 2. AÑADIMOS el estado para el nombre
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
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, name, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Ocurrió un error al crear la cuenta');
      }

      router.push("/protected");
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocurrió un error al crear la cuenta";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/20 bg-gradient-to-br from-amber-50 to-blue-50 shadow-lg shadow-amber-100/30">
        {/* Elementos decorativos de fondo */}
        <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-amber-200/10 blur-xl" />
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-blue-200/10 blur-xl" />
        
        <div className="relative p-1">
          <Card className="border-amber-200/30 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
                  <GraduationCap className="h-8 w-8 text-white" aria-hidden="true" />
                </div>
                <div className="flex flex-col items-center">
                  <CardTitle className="text-3xl font-bold text-amber-900">
                    Crear Cuenta
                  </CardTitle>
                  <CardDescription className="text-amber-700/80 mt-2">
                    Únete a la comunidad estudiantil
                  </CardDescription>
                </div>
              </div>
              
              {/* Frase motivacional */}
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-blue-100 border border-amber-200/50">
                  <Brain className="h-4 w-4 text-amber-600" aria-hidden="true" />
                  <span className="text-sm font-medium text-amber-800">
                    Donde las ideas cobran vida
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">

                  {/* Name - Nuevo campo requerido por nuestro backend */}
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <User className="h-4 w-4 text-amber-700" aria-hidden="true" />
                      </div>
                      <Label htmlFor="name" className="text-amber-900 font-medium">
                        Nombre o Apodo
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="name"
                        type="text"
                        placeholder="Ej: Gabo"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-12 border-amber-300 focus:border-amber-500 focus:ring-amber-500/20 bg-white/90"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <span className="text-amber-600"></span>
                      </div>
                    </div>
                  </div>

                  {/* Email - Estilo cuaderno */}
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-amber-100">
                        <BookOpen className="h-4 w-4 text-amber-700" aria-hidden="true" />
                      </div>
                      <Label htmlFor="email" className="text-amber-900 font-medium">
                        Correo Institucional
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="estudiante@universidad.edu"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 border-amber-300 focus:border-amber-500 focus:ring-amber-500/20 bg-white/90"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <span className="text-amber-600"></span>
                      </div>
                    </div>
                  </div>

                  {/* Password - Estilo libro */}
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Notebook className="h-4 w-4 text-blue-700" aria-hidden="true" />
                      </div>
                      <Label htmlFor="password" className="text-blue-900 font-medium">
                        Contraseña
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 border-blue-300 focus:border-blue-500 focus:ring-blue-500/20 bg-white/90"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <span className="text-blue-600"></span>
                      </div>
                    </div>
                  </div>

                  {/* Repeat Password - Estilo grupo de estudio */}
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Users className="h-4 w-4 text-green-700" aria-hidden="true" />
                      </div>
                      <Label htmlFor="repeat-password" className="text-green-900 font-medium">
                        Confirmar Contraseña
                      </Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="repeat-password"
                        type="password"
                        placeholder="••••••••"
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className="pl-12 border-green-300 focus:border-green-500 focus:ring-green-500/20 bg-white/90"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <span className="text-green-600">OK</span>
                      </div>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="p-2 rounded-full bg-red-100">
                        <Lightbulb className="h-4 w-4 text-red-600" aria-hidden="true" />
                      </div>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Button - Estilo destacado */}
                  <Button 
                    type="submit" 
                    className="w-full py-6 text-base font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25 hover:shadow-amber-600/30 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creando tu espacio de estudio...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="p-1 rounded-full bg-white/20">
                          <GraduationCap className="h-5 w-5" aria-hidden="true" />
                        </span>
                        Comenzar el Aprendizaje
                      </span>
                    )}
                  </Button>
                </div>
                
                {/* Link to login */}
                <div className="mt-8 pt-6 border-t border-amber-200/50">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Library className="h-4 w-4 text-amber-600" aria-hidden="true" />
                      <span className="text-sm text-amber-700">
                        ¿Ya tienes una cuenta?
                      </span>
                    </div>
                    <Link 
                      href="/auth/login" 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200/70 transition-colors duration-200"
                    >
                      <span>Acceder a mi biblioteca</span>
                      <span className="text-amber-600">→</span>
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Elementos decorativos adicionales */}
      <div className="flex items-center justify-center gap-6 text-amber-700/50">
        <div className="flex items-center gap-2">
          <div className="h-1 w-6 bg-amber-300/30 rounded-full" />
          <span className="text-xs">Aprendizaje Colaborativo</span>
        </div>
        <div className="h-4 w-px bg-amber-300/30" />
        <div className="flex items-center gap-2">
          <div className="h-1 w-6 bg-blue-300/30 rounded-full" />
          <span className="text-xs">Recursos Académicos</span>
        </div>
      </div>
    </div>
  );
}