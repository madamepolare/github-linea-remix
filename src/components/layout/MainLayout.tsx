import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { useSidebarStore } from "@/hooks/useSidebarStore";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { collapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main 
        className={cn(
          "min-h-screen transition-all duration-200 ease-out",
          collapsed ? "pl-[72px]" : "pl-[260px]"
        )}
      >
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
