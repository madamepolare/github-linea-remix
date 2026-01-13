import { useState, useEffect } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { GlobalTopBar } from "./GlobalTopBar";
import { PostItSidebar } from "./PostItSidebar";
import { PageTransition } from "./PageTransition";
import { WorkspaceStylesLoader } from "./WorkspaceStylesLoader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileSubNav } from "./MobileSubNav";
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
import { EventSchedulerDialog } from "@/components/workflow/EventSchedulerDialog";
import { CheckInModal } from "@/components/checkin/CheckInModal";
import { CheckOutModal } from "@/components/checkin/CheckOutModal";

export function MainLayout() {
  // Guard: redirect to home if current module not enabled in new workspace
  useWorkspaceModuleGuard();
  const { collapsed } = useSidebarStore();
  const { activeWorkspace } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [postItOpen, setPostItOpen] = useState(false);
  const [eventSchedulerOpen, setEventSchedulerOpen] = useState(false);
  
  // Get pending post-it count
  const { pendingCount } = usePostItTasks();

  // Listen for open-event-scheduler event
  useEffect(() => {
    const handleOpenScheduler = () => setEventSchedulerOpen(true);
    window.addEventListener("open-event-scheduler", handleOpenScheduler);
    return () => window.removeEventListener("open-event-scheduler", handleOpenScheduler);
  }, []);

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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Load and apply workspace-specific styles */}
      <WorkspaceStylesLoader />
      
      {/* Mobile Header - Simplified */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-center h-12 px-4 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-2">
          {activeWorkspace?.logo_url ? (
            <img 
              src={activeWorkspace.logo_url} 
              alt={activeWorkspace.name}
              className="h-6 w-6 rounded-md object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-md bg-foreground flex items-center justify-center">
              <span className="text-xs font-semibold text-background">
                {activeWorkspace?.name?.slice(0, 1).toUpperCase() || "L"}
              </span>
            </div>
          )}
          <span className="font-semibold text-sm">
            {activeWorkspace?.name || "Linea"}
          </span>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] bg-background shadow-2xl"
            >
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="absolute top-3 right-3 h-8 w-8 rounded-full z-10"
              >
                <X className="h-5 w-5" />
              </Button>
              
              <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar - always visible on lg+ */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Main content with TopBar */}
      <div 
        className={cn(
          "min-h-screen flex flex-col transition-all duration-200 ease-out",
          "pt-12 pb-16 lg:pt-0 lg:pb-0", // Account for mobile header + bottom nav
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

        {/* Mobile Sub-Navigation */}
        <MobileSubNav />
        
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Post-it Sidebar */}
      <PostItSidebar open={postItOpen} onOpenChange={setPostItOpen} />

      {/* Global Time Tracker Overlay */}
      <GlobalTimeTracker />

      {/* Feedback Mode Components */}
      <FeedbackButton />
      <FeedbackSidebar />

      {/* Event Scheduler Dialog */}
      <EventSchedulerDialog 
        open={eventSchedulerOpen} 
        onOpenChange={setEventSchedulerOpen} 
      />

      {/* Check-in / Check-out Modals */}
      <CheckInModal />
      <CheckOutModal />
    </div>
  );
}
