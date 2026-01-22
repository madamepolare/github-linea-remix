import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  StickyNote,
  Clock,
  FolderPlus,
  FileText,
  Users,
  Receipt,
  Trophy,
  Zap,
  ChevronDown,
  Bell,
  Settings,
  LogOut,
  CalendarPlus,
  Sunrise,
  Moon,
  PenLine,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";
import { useTimeTrackerStore } from "@/hooks/useTimeTrackerStore";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationsSidebar } from "./NotificationsSidebar";
import { differenceInMinutes } from "date-fns";
import { useCheckinStore } from "@/hooks/useCheckinStore";
import { useUserCheckins } from "@/hooks/useUserCheckins";
import { useIsModuleEnabled } from "@/hooks/useModules";
import { useFeedbackMode } from "@/hooks/useFeedbackMode";

// Quick actions config
const quickActions = [
  { id: "new-event", label: "Planifier une réunion", icon: CalendarPlus, event: "open-event-scheduler" },
  { id: "new-project", label: "Nouveau projet", icon: FolderPlus, event: "open-create-project" },
  { id: "new-tender", label: "Nouvel AO", icon: Trophy, event: "open-create-tender" },
  { id: "new-contact", label: "Nouveau contact", icon: Users, event: "open-create-contact" },
  { id: "new-invoice", label: "Nouvelle facture", icon: Receipt, event: "open-create-invoice" },
  { id: "new-document", label: "Nouveau document", icon: FileText, event: "open-create-document" },
];

interface GlobalTopBarProps {
  onOpenPostIt: () => void;
  postItCount: number;
}

export function GlobalTopBar({ onOpenPostIt, postItCount }: GlobalTopBarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: searchResults, isLoading: searchLoading } = useGlobalSearch(searchQuery);
  const { isRunning, elapsedSeconds, openTracker } = useTimeTrackerStore();
  const { user, profile, signOut } = useAuth();
  
  // Check-in/Check-out state
  const { openCheckin, openCheckout } = useCheckinStore();
  const { hasCheckedIn, hasCheckedOut } = useUserCheckins();
  const isCheckinModuleEnabled = useIsModuleEnabled("checkin");
  
  // For testing: show both buttons always (remove time constraints later for production)
  // In production, uncomment time-based logic:
  // const now = new Date();
  // const currentHour = now.getHours();
  // const currentMinutes = now.getMinutes();
  // const showCheckinButton = isCheckinModuleEnabled && (currentHour > 9 || (currentHour === 9 && currentMinutes >= 45)) && !hasCheckedIn;
  // const showCheckoutButton = isCheckinModuleEnabled && (currentHour > 17 || (currentHour === 17 && currentMinutes >= 50)) && hasCheckedIn && !hasCheckedOut;
  
  // TEST MODE: Always show both buttons if module is enabled
  const showCheckinButton = isCheckinModuleEnabled;
  const showCheckoutButton = isCheckinModuleEnabled;
  
  // Notifications state - use real notifications from hook
  const { notifications, unreadCount } = useNotifications();
  const [notifSidebarOpen, setNotifSidebarOpen] = useState(false);
  const hasRecentNotification = notifications.some(
    (n) => !n.is_read && differenceInMinutes(new Date(), new Date(n.created_at)) < 5
  );

  // Feedback mode
  const { isEnabled: feedbackEnabled, toggleSidebar: toggleFeedback, isSidebarOpen: feedbackSidebarOpen } = useFeedbackMode();

  // User initials
  const userInitials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSearchSelect = (result: SearchResult) => {
    navigate(result.url);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleQuickAction = (event: string) => {
    window.dispatchEvent(new CustomEvent(event));
  };

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "task": return <FileText className="h-4 w-4" />;
      case "project": return <FolderPlus className="h-4 w-4" />;
      case "contact": return <Users className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };


  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };
  const location = useLocation();
  const isMessagesPage = location.pathname.startsWith("/messages");
  const isDirectFilter = location.pathname === "/messages/direct" || location.pathname.startsWith("/messages/direct/");

  const handleMessagesFilterChange = (filter: "all" | "direct") => {
    navigate(filter === "direct" ? "/messages/direct" : "/messages");
  };

  return (
    <div className="h-12 flex items-center gap-4 px-4 border-b border-border bg-background">
      {/* Search - Fully extends to fill available space */}
      <div ref={searchRef} className="relative flex-1 min-w-0">
        <Popover open={searchOpen && (searchQuery.length >= 2 || (searchResults?.length ?? 0) > 0)}>
          <PopoverTrigger asChild>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" strokeWidth={1.25} />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Rechercher projets, tâches, contacts..."
                className="w-full h-9 pl-9 pr-16 text-sm bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-foreground/20 placeholder:text-muted-foreground/50"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] min-w-[320px] max-w-[600px] p-0 shadow-lg border-border/50" 
            align="start" 
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="bg-background rounded-lg overflow-hidden">
              {searchLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <div className="h-4 w-4 border-2 border-foreground/20 border-t-foreground/60 rounded-full animate-spin" />
                  <span>Recherche en cours...</span>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="py-1 max-h-[400px] overflow-y-auto">
                  {/* Group results by type */}
                  {["project", "task", "contact"].map((type) => {
                    const typeResults = searchResults.filter((r) => r.type === type);
                    if (typeResults.length === 0) return null;
                    
                    const typeLabel = type === "task" ? "Tâches" : type === "project" ? "Projets" : "Contacts";
                    
                    return (
                      <div key={type}>
                        <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 bg-muted/30">
                          {typeLabel}
                        </div>
                        {typeResults.map((result) => (
                          <button
                            key={result.id}
                            onClick={() => handleSearchSelect(result)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors group"
                          >
                            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-muted/50 text-foreground/60 group-hover:bg-foreground group-hover:text-background transition-colors">
                              {getResultIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery.length >= 2 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-30" strokeWidth={1.25} />
                  <p className="text-sm">Aucun résultat pour "{searchQuery}"</p>
                  <p className="text-xs mt-1 opacity-60">Essayez avec d'autres mots-clés</p>
                </div>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Right side - All actions + Notifications + User */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Quick Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2.5">
              <Zap className="h-4 w-4" strokeWidth={THIN_STROKE} />
              <span className="text-sm hidden xl:inline">Actions</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {quickActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => handleQuickAction(action.event)}
                className="gap-2"
              >
                <action.icon className="h-4 w-4" strokeWidth={THIN_STROKE} />
                {action.label}
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
        </DropdownMenu>

        {/* Check-in Button */}
        {showCheckinButton && (
          <Button
            variant="default"
            size="sm"
            onClick={openCheckin}
            className="gap-1.5 h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Sunrise className="h-4 w-4" strokeWidth={THIN_STROKE} />
            <span className="text-sm">Check-in</span>
          </Button>
        )}

        {/* Check-out Button */}
        {showCheckoutButton && (
          <Button
            variant="default"
            size="sm"
            onClick={openCheckout}
            className="gap-1.5 h-8 px-3 bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Moon className="h-4 w-4" strokeWidth={THIN_STROKE} />
            <span className="text-sm">Check-out</span>
          </Button>
        )}

        {/* Post-it Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenPostIt}
          className="gap-1.5 h-8 px-2.5 relative"
        >
          <StickyNote className="h-4 w-4 text-amber-500" strokeWidth={THIN_STROKE} />
          <span className="text-sm hidden xl:inline">Post-it</span>
          {postItCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-amber-500 text-amber-950 hover:bg-amber-500"
            >
              {postItCount}
            </Badge>
          )}
        </Button>

        {/* Time Tracker Quick Button */}
        <Button
          variant={isRunning ? "default" : "ghost"}
          size="sm"
          onClick={() => openTracker()}
          className={cn(
            "gap-1.5 h-8 px-2.5",
            isRunning && "bg-primary text-primary-foreground"
          )}
        >
          {isRunning ? (
            <>
              <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
              <span className="font-mono text-sm tabular-nums">{formatTime(elapsedSeconds)}</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4" strokeWidth={THIN_STROKE} />
              <span className="text-sm hidden xl:inline">Timer</span>
            </>
          )}
        </Button>

        {/* Feedback Mode Button - Only show when enabled */}
        {feedbackEnabled && (
          <Button
            variant={feedbackSidebarOpen ? "default" : "ghost"}
            size="icon-sm"
            onClick={toggleFeedback}
            className={cn(
              "h-8 w-8",
              feedbackSidebarOpen && "bg-primary text-primary-foreground"
            )}
            title="Mode feedback"
          >
            <PenLine className="h-4 w-4" strokeWidth={THIN_STROKE} />
          </Button>
        )}

        {/* Separator */}
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Notifications Button - More prominent */}
        <Button 
          variant={unreadCount > 0 ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "h-8 px-2.5 relative gap-1.5",
            unreadCount > 0 && "bg-destructive/10 hover:bg-destructive/20 text-destructive",
            hasRecentNotification && "ring-2 ring-destructive/30"
          )}
          onClick={() => setNotifSidebarOpen(true)}
        >
          <Bell className={cn("h-4 w-4", hasRecentNotification && "animate-pulse")} strokeWidth={THIN_STROKE} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={hasRecentNotification ? { 
                  scale: [1, 1.1, 1],
                  transition: { repeat: Infinity, duration: 1.5 }
                } : { scale: 1 }}
                exit={{ scale: 0 }}
                className="text-xs font-semibold"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        {/* Notifications Sidebar */}
        <NotificationsSidebar 
          open={notifSidebarOpen} 
          onClose={() => setNotifSidebarOpen(false)} 
        />

        {/* User Menu - Icon only, no avatar in topbar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" strokeWidth={THIN_STROKE} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || "User"} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center text-xs font-medium text-background">
                    {userInitials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{profile?.full_name || "Utilisateur"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
