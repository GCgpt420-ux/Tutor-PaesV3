import { LoginForm } from "@/src/features/auth/components/login-form";

export default function Page() {
  return (
    <div className="auth-shell flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-lg">
        <LoginForm />
      </div>
    </div>
  );
}
