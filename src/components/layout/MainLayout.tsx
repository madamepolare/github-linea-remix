import { useState, useEffect } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { GlobalTopBar } from "./GlobalTopBar";
import { PostItSidebar } from "./PostItSidebar";
import { PageTransition } from "./PageTransition";
import { WorkspaceStylesLoader } from "./WorkspaceStylesLoader";
import { useSidebarStore } from "@/hooks/useSidebarStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GlobalTimeTracker } from "@/components/time-tracking/GlobalTimeTracker";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { FeedbackSidebar } from "@/components/feedback/FeedbackSidebar";
import { TerminologyProvider } from "@/contexts/TerminologyContext";
import { useWorkspaceModuleGuard } from "@/hooks/useWorkspaceModuleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { getModuleFromPath } from "@/lib/navigationConfig";
import { THIN_STROKE } from "@/components/ui/icon";
import { usePostItTasks } from "@/hooks/usePostItTasks";

export function MainLayout() {
  // Guard: redirect to home if current module not enabled in new workspace
  useWorkspaceModuleGuard();
  const { collapsed } = useSidebarStore();
  const { activeWorkspace } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [postItOpen, setPostItOpen] = useState(false);
  
  // Get pending post-it count
  const { pendingCount } = usePostItTasks();

  // Get current module for mobile header
  const currentModule = getModuleFromPath(location.pathname);

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
      {/* Load and apply workspace-specific styles */}
      <WorkspaceStylesLoader />
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-3 bg-background border-b border-border">
        {/* Menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-9 w-9 shrink-0"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Workspace name + current module */}
        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          {activeWorkspace?.logo_url ? (
            <img 
              src={activeWorkspace.logo_url} 
              alt={activeWorkspace.name}
              className="h-6 w-6 rounded-md object-cover shrink-0"
            />
          ) : null}
          <span className="font-semibold text-sm truncate">
            {activeWorkspace?.name || "Workspace"}
          </span>
          {currentModule && currentModule.slug !== "dashboard" && (
            <>
              <span className="text-muted-foreground">/</span>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <currentModule.icon className="h-3.5 w-3.5" strokeWidth={THIN_STROKE} />
                <span className="text-xs font-medium">{currentModule.title}</span>
              </div>
            </>
          )}
        </div>

        {/* Spacer for centering */}
        <div className="w-9 shrink-0" />
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

      {/* Main content with TopBar */}
      <div 
        className={cn(
          "min-h-screen flex flex-col transition-all duration-200 ease-out",
          "pt-14 lg:pt-0", // Account for mobile header
          collapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        )}
      >
        {/* Global TopBar with search, actions, post-it, timer - hidden on mobile */}
        <div className="hidden lg:block sticky top-0 z-40 bg-background">
          <GlobalTopBar 
            onOpenPostIt={() => setPostItOpen(true)} 
            postItCount={pendingCount} 
          />
        </div>

        {/* Contextual TopBar - hidden on mobile since we show module in header */}
        <div className="hidden lg:block">
          <TopBar />
        </div>
        
        {/* Page content */}
        <main className="flex-1 flex flex-col">
          <TerminologyProvider>
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <div className="flex-1 flex flex-col">
                  <Outlet />
                </div>
              </PageTransition>
            </AnimatePresence>
          </TerminologyProvider>
        </main>
      </div>

      {/* Post-it Sidebar */}
      <PostItSidebar open={postItOpen} onOpenChange={setPostItOpen} />

      {/* Global Time Tracker Overlay */}
      <GlobalTimeTracker />

      {/* Feedback Mode Components */}
      <FeedbackButton />
      <FeedbackSidebar />
    </div>
  );
}
