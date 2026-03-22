import { DashboardSidebar } from "@/src/components/layout/sidebar";
import { DashboardHeader } from "@/src/components/layout/header";
import { DashboardFooter } from "@/src/components/layout/footer";
import { MobileNav } from "@/src/components/layout/mobile-nav";
import { AiTutorChat } from "@/src/features/ai/components/AiTutorChat";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0B1220] text-white overflow-hidden selection:bg-brand-primary/30">
      
      {/* Sidebar - oculto en móviles */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>
      
      {/* Contenido principal */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <DashboardHeader />
        
        {/* Contenido dinámico */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
        
        {/* Footer - oculto en móviles */}
        <div className="hidden md:block">
          <DashboardFooter />
        </div>
      </div>

      {/* Navegación móvil */}
      <MobileNav />
    </div>
  );
}
