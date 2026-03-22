'use client';

export function DashboardFooter() {

  return (
    <footer className="mt-10 px-6 py-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-blue-600/70">
        <p>
           2026 Preuniversitario PAES · Aprende a tu ritmo
        </p>
        <div className="flex items-center gap-4">
          <span> Estudio guiado</span>
          <span> IA educativa</span>
          <span> Progreso real</span>
        </div>
      </div>
    </footer>
  );
}
