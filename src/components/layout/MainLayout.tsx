import { useState, useEffect } from "react";
import { useLocation, Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, StickyNote, Bell, Search } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { GlobalTopBar } from "./GlobalTopBar";
import { PostItSidebar } from "./PostItSidebar";
import { NotificationsSidebar } from "./NotificationsSidebar";
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
import { useNotifications } from "@/hooks/useNotifications";
import { EventSchedulerDialog } from "@/components/workflow/EventSchedulerDialog";
import { CheckInModal } from "@/components/checkin/CheckInModal";
import { CheckOutModal } from "@/components/checkin/CheckOutModal";
import { useFavicon } from "@/hooks/useFavicon";

export function MainLayout() {
  // Apply workspace favicon
  useFavicon();
  
  // Guard: redirect to home if current module not enabled in new workspace
  useWorkspaceModuleGuard();
  const { collapsed } = useSidebarStore();
  const { activeWorkspace } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [postItOpen, setPostItOpen] = useState(false);
  const [notifSidebarOpen, setNotifSidebarOpen] = useState(false);
  const [eventSchedulerOpen, setEventSchedulerOpen] = useState(false);
  
  // Get pending post-it count
  const { pendingCount } = usePostItTasks();
  
  // Get notifications
  const { unreadCount } = useNotifications();

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
      
      {/* Mobile Header - App-like design */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-3 bg-background/95 backdrop-blur-xl border-b border-border/50 safe-area-inset-top">
        {/* Left: Workspace logo + name */}
        <motion.button 
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-2 px-1.5 py-1 rounded-xl active:bg-muted/50 touch-manipulation"
          whileTap={{ scale: 0.97 }}
        >
          {activeWorkspace?.logo_url ? (
            <img 
              src={activeWorkspace.logo_url} 
              alt={activeWorkspace.name}
              className="h-8 w-8 rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-background">
                {activeWorkspace?.name?.slice(0, 1).toUpperCase() || "L"}
              </span>
            </div>
          )}
          <div className="flex flex-col items-start">
            <span className="font-semibold text-sm text-foreground leading-tight">
              {activeWorkspace?.name || "Linea"}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">Espace de travail</span>
          </div>
        </motion.button>
        
        {/* Right: Quick actions - Notifications + Post-it */}
        <div className="flex items-center gap-0.5">
          {/* Notifications */}
          <motion.button 
            onClick={() => setNotifSidebarOpen(true)}
            className="relative p-2.5 rounded-xl hover:bg-muted/50 active:bg-muted/70 touch-manipulation"
            whileTap={{ scale: 0.92 }}
          >
            <Bell className="h-5 w-5" strokeWidth={THIN_STROKE} />
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full shadow-sm"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </motion.button>
          
          {/* Post-it */}
          <motion.button 
            onClick={() => setPostItOpen(true)}
            className="relative p-2.5 rounded-xl hover:bg-muted/50 active:bg-muted/70 touch-manipulation"
            whileTap={{ scale: 0.92 }}
          >
            <StickyNote className="h-5 w-5 text-amber-500" />
            {pendingCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-amber-500 text-white rounded-full shadow-sm"
              >
                {pendingCount > 9 ? '9+' : pendingCount}
              </motion.span>
            )}
          </motion.button>
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
          "pt-14 pb-20 lg:pt-0 lg:pb-0", // Account for mobile header (h-14) + bottom nav (h-16 + safe area padding)
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
      
      {/* Notifications Sidebar - for mobile */}
      <NotificationsSidebar open={notifSidebarOpen} onClose={() => setNotifSidebarOpen(false)} />

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
