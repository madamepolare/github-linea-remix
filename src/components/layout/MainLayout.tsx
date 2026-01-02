import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AppSidebar } from "./AppSidebar";
import { PageTransition } from "./PageTransition";
import { useSidebarStore } from "@/hooks/useSidebarStore";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { collapsed } = useSidebarStore();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main 
        className={cn(
          "min-h-screen transition-all duration-200 ease-out",
          collapsed ? "pl-[72px]" : "pl-[260px]"
        )}
      >
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <div className="min-h-screen">
              {children}
            </div>
          </PageTransition>
        </AnimatePresence>
      </main>
    </div>
  );
}
