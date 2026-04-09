import { SignUpForm } from "@/src/features/auth/components/sign-up-form";

export default function Page() {
  return (
    <div className="auth-shell">
      <div className="relative flex min-h-svh items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-xl">
          <div className="mb-8 text-center">
            <h1 className="display-hero text-4xl sm:text-5xl">
              Tu Tutor de Bolsillo
            </h1>
            <p className="mt-3 text-text-secondary">
              Registra tu cuenta y entra al entrenamiento PAES con seguimiento real.
            </p>
          </div>
          <SignUpForm />
          <div className="mt-8 text-center">
            <p className="text-sm text-text-tertiary">
              Al registrarte aceptas los términos, condiciones y políticas académicas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
