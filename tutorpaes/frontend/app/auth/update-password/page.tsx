import { UpdatePasswordForm } from "@/src/features/auth/components/update-password-form";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="text-sm text-muted-foreground p-4">Cargando validador de seguridad...</div>}>
          <UpdatePasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
