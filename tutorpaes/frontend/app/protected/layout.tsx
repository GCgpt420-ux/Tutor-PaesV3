import { DashboardSidebar } from "@/src/components/layout/sidebar";
import { DashboardHeader } from "@/src/components/layout/header";
import { DashboardFooter } from "@/src/components/layout/footer";
import { MobileNav } from "@/src/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-surface-base text-text-primary selection:bg-brand-primary/30">
      
      {/* Sidebar - oculto en móviles */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>
      
      {/* Contenido principal */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <DashboardHeader />
        
        {/* Contenido dinámico */}
        <main id="main-content" className="flex-1 p-4 pb-24 md:p-6 md:pb-6">
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
