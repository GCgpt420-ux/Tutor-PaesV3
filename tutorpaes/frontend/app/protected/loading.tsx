import { Loader } from 'lucide-react';

export default function ProtectedLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader className="h-8 w-8 text-brand-primary animate-spin" />
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Cargando...</p>
      </div>
    </div>
  );
}
