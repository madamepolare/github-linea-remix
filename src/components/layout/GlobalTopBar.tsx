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
  RefreshCw,
  CheckCheck,
  Check,
  X,
  MessageSquare,
  UserPlus,
  FolderKanban,
  CheckSquare,
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
import { formatDistanceToNow, differenceInMinutes } from "date-fns";

// Quick actions config
const quickActions = [
  { id: "new-project", label: "Nouveau projet", icon: FolderPlus, event: "open-create-project" },
  { id: "new-tender", label: "Nouvel AO", icon: Trophy, event: "open-create-tender" },
  { id: "new-contact", label: "Nouveau contact", icon: Users, event: "open-create-contact" },
  { id: "new-invoice", label: "Nouvelle facture", icon: Receipt, event: "open-create-invoice" },
  { id: "new-document", label: "Nouveau document", icon: FileText, event: "open-create-document" },
];

// Mock notifications (replace with real data later)
interface Notification {
  id: string;
  type: "task" | "project" | "mention" | "invite";
  title: string;
  description?: string;
  read: boolean;
  createdAt: Date;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "mention",
    title: "Vous avez été mentionné",
    description: "Alex vous a mentionné dans un commentaire",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: "2",
    type: "task",
    title: "Tâche assignée",
    description: "Nouvelle tâche: Réviser la documentation API",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "3",
    type: "project",
    title: "Projet mis à jour",
    description: "Mobile App v2 passé en phase 'En cours'",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
];

const iconMap = {
  task: CheckSquare,
  project: FolderKanban,
  mention: MessageSquare,
  invite: UserPlus,
};

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
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasRecentNotification = notifications.some(
    (n) => !n.read && differenceInMinutes(new Date(), n.createdAt) < 5
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

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="h-12 flex items-center gap-3 px-4 border-b border-border bg-background">
      {/* Search - Left side, takes available space */}
      <div ref={searchRef} className="relative flex-1 max-w-xl">
        <Popover open={searchOpen && (searchQuery.length >= 2 || (searchResults?.length ?? 0) > 0)}>
          <PopoverTrigger asChild>
            <div className="relative">
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

      {/* Center actions */}
      <div className="flex items-center gap-1">
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
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-border" />

      {/* Right side - Notifications + User */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className={cn("h-4 w-4", hasRecentNotification && "animate-pulse")} strokeWidth={THIN_STROKE} />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={hasRecentNotification ? { 
                      scale: [1, 1.2, 1],
                      transition: { repeat: Infinity, duration: 1.5 }
                    } : { scale: 1 }}
                    exit={{ scale: 0 }}
                    className={cn(
                      "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground",
                      hasRecentNotification && "ring-2 ring-destructive/30"
                    )}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-medium">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Tout lire
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => {
                    const Icon = iconMap[notification.type];
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer",
                          !notification.read && "bg-muted/30"
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        {!notification.read && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                          {notification.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {notification.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border p-2">
                <Button 
                  variant="ghost" 
                  className="w-full text-sm h-8"
                  onClick={() => {
                    navigate("/notifications");
                    setNotifOpen(false);
                  }}
                >
                  Voir toutes les notifications
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0">
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
