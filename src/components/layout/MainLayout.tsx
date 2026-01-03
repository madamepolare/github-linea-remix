import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { PageTransition } from "./PageTransition";
import { useSidebarStore } from "@/hooks/useSidebarStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { collapsed } = useSidebarStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-4 bg-background border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-9 w-9"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="font-semibold text-sm">DOMINI</span>
        <div className="w-9" /> {/* Spacer for centering */}
      </header>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless menu is open */}
      <div className={cn(
        "lg:block",
        mobileMenuOpen ? "block" : "hidden"
      )}>
        <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>

      {/* Main content */}
      <main 
        className={cn(
          "min-h-screen transition-all duration-200 ease-out",
          "pt-14 lg:pt-0", // Account for mobile header
          collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
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
