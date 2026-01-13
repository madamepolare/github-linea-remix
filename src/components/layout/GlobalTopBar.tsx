import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  
  // Determine if check-in/out buttons should show
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const showCheckinButton = (currentHour > 9 || (currentHour === 9 && currentMinutes >= 45)) && !hasCheckedIn;
  const showCheckoutButton = (currentHour > 17 || (currentHour === 17 && currentMinutes >= 50)) && hasCheckedIn && !hasCheckedOut;
  
  // Notifications state - use real notifications from hook
  const { notifications, unreadCount } = useNotifications();
  const [notifSidebarOpen, setNotifSidebarOpen] = useState(false);
  const hasRecentNotification = notifications.some(
    (n) => !n.is_read && differenceInMinutes(new Date(), new Date(n.created_at)) < 5
  );

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

  return (
    <div className="h-12 flex items-center gap-3 px-4 border-b border-border bg-background">
      {/* Search - Left side, takes all available space */}
      <div ref={searchRef} className="relative flex-1">
        <Popover open={searchOpen && (searchQuery.length >= 2 || (searchResults?.length ?? 0) > 0)}>
          <PopoverTrigger asChild>
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Rechercher projets, tâches, contacts... ⌘K"
                className="w-full h-9 pl-9 pr-3 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[400px] p-0" 
            align="start" 
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {searchLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Recherche...
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSearchSelect(result)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors"
                  >
                    <div className="text-muted-foreground">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {result.type === "task" ? "Tâche" : result.type === "project" ? "Projet" : "Contact"}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucun résultat trouvé
              </div>
            ) : null}
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
