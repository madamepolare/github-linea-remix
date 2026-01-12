import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  StickyNote,
  Play,
  Pause,
  Clock,
  FolderPlus,
  FileText,
  Users,
  Receipt,
  Trophy,
  Zap,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useQuickTasks } from "@/hooks/useQuickTasks";

// Quick actions config
const quickActions = [
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
  const { isOpen: trackerOpen, isRunning, elapsedSeconds, openTracker } = useTimeTrackerStore();

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
      case "task":
        return <FileText className="h-4 w-4" />;
      case "project":
        return <FolderPlus className="h-4 w-4" />;
      case "contact":
        return <Users className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-12 flex items-center justify-end gap-2 px-4 border-b border-border bg-background">
      {/* Search */}
      <div ref={searchRef} className="relative">
        <Popover open={searchOpen && (searchQuery.length >= 2 || searchResults?.length > 0)}>
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
                placeholder="Rechercher... ⌘K"
                className="w-64 h-9 pl-9 pr-3 text-sm bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="w-80 p-0" 
            align="end" 
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

      {/* Separator */}
      <div className="w-px h-6 bg-border mx-1" />

      {/* Quick Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 h-9 px-3">
            <Zap className="h-4 w-4" strokeWidth={THIN_STROKE} />
            <span className="text-sm">Actions</span>
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
        className="gap-1.5 h-9 px-3 relative"
      >
        <StickyNote className="h-4 w-4 text-amber-500" strokeWidth={THIN_STROKE} />
        <span className="text-sm">Post-it</span>
        {postItCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-[10px] bg-amber-500 text-amber-950 hover:bg-amber-500"
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
          "gap-1.5 h-9 px-3",
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
            <span className="text-sm">Timer</span>
          </>
        )}
      </Button>
    </div>
  );
}
