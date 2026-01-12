import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  MessageSquare, 
  UserPlus, 
  FolderKanban, 
  CheckSquare,
  Filter,
  Search,
  Clock,
  FileText,
  AlertCircle,
  Calendar,
  Settings,
  Users,
  Inbox,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  Loader2,
  Heart,
  AtSign,
  Reply,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format } from "date-fns";
import { fr } from "date-fns/locale";
import { THIN_STROKE } from "@/components/ui/icon";
import { useNotifications, NotificationWithActor } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper to format mentions in notification messages
function formatMentionMessage(message: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push(message.slice(lastIndex, match.index));
    }

    const mentionName = match[1];

    parts.push(
      <span
        key={match.index}
        className="inline-flex items-center gap-0.5 text-primary font-medium"
      >
        @{mentionName}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < message.length) {
    parts.push(message.slice(lastIndex));
  }

  return parts.length > 0 ? parts : message;
}

type NotificationCategory = "all" | "unread" | "mentions" | "tasks" | "projects" | "messages";

// Map notification types to icons and colors
const notificationTypeConfig: Record<string, { 
  icon: typeof Bell; 
  label: string; 
  color: string; 
  bgColor: string;
}> = {
  comment_reply: { 
    icon: Reply, 
    label: "Réponse", 
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30"
  },
  reaction: { 
    icon: Heart, 
    label: "Réaction", 
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/30"
  },
  task_created: { 
    icon: CheckSquare, 
    label: "Nouvelle tâche", 
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30"
  },
  project_update: { 
    icon: FolderKanban, 
    label: "Projet", 
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30"
  },
  mention: { 
    icon: AtSign, 
    label: "Mention", 
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30"
  },
  invite: { 
    icon: UserPlus, 
    label: "Invitation", 
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30"
  },
  default: { 
    icon: Bell, 
    label: "Notification", 
    color: "text-muted-foreground",
    bgColor: "bg-muted"
  },
};

const categoryConfig: Record<NotificationCategory, { label: string; icon: typeof Bell; types?: string[] }> = {
  all: { label: "Toutes", icon: Inbox },
  unread: { label: "Non lues", icon: Bell },
  mentions: { label: "Mentions", icon: AtSign, types: ["mention"] },
  messages: { label: "Messages", icon: MessageSquare, types: ["comment_reply", "reaction"] },
  tasks: { label: "Tâches", icon: CheckSquare, types: ["task_created"] },
  projects: { label: "Projets", icon: FolderKanban, types: ["project_update"] },
};

function groupNotificationsByDate(notifications: NotificationWithActor[]) {
  const groups: { label: string; notifications: NotificationWithActor[] }[] = [];
  const today: NotificationWithActor[] = [];
  const yesterday: NotificationWithActor[] = [];
  const thisWeek: NotificationWithActor[] = [];
  const older: NotificationWithActor[] = [];

  notifications.forEach((n) => {
    const date = new Date(n.created_at);
    if (isToday(date)) {
      today.push(n);
    } else if (isYesterday(date)) {
      yesterday.push(n);
    } else if (isThisWeek(date)) {
      thisWeek.push(n);
    } else {
      older.push(n);
    }
  });

  if (today.length > 0) groups.push({ label: "Aujourd'hui", notifications: today });
  if (yesterday.length > 0) groups.push({ label: "Hier", notifications: yesterday });
  if (thisWeek.length > 0) groups.push({ label: "Cette semaine", notifications: thisWeek });
  if (older.length > 0) groups.push({ label: "Plus ancien", notifications: older });

  return groups;
}

// Entity type labels
const entityTypeLabels: Record<string, { label: string; icon: typeof CheckSquare }> = {
  task: { label: "Tâche", icon: CheckSquare },
  project: { label: "Projet", icon: FolderKanban },
};

// Helper to get initials
function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { 
    notifications, 
    isLoading, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Filter notifications based on category and search
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    // Filter by category
    if (selectedCategory === "unread") {
      result = result.filter((n) => !n.is_read);
    } else if (selectedCategory !== "all") {
      const categoryTypes = categoryConfig[selectedCategory]?.types;
      if (categoryTypes) {
        result = result.filter((n) => categoryTypes.includes(n.type));
      }
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, selectedCategory, searchQuery]);

  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications]);

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  const handleNotificationClick = (notification: NotificationWithActor) => {
    handleMarkAsRead(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  };

  const bulkMarkAsRead = () => {
    selectedIds.forEach((id) => markAsRead.mutate(id));
    clearSelection();
  };

  const bulkDelete = () => {
    selectedIds.forEach((id) => deleteNotification.mutate(id));
    clearSelection();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bell className="h-5 w-5 text-primary" strokeWidth={THIN_STROKE} />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Notifications</h1>
                <p className="text-sm text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" strokeWidth={THIN_STROKE} />
              </Button>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrer
                  <ChevronDown className="h-3 w-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(categoryConfig).map(([key, { label, icon: Icon }]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setSelectedCategory(key as NotificationCategory)}
                    className={cn(selectedCategory === key && "bg-muted")}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                    {key === "unread" && unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-6 border-t border-border">
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as NotificationCategory)}>
            <TabsList className="h-12 bg-transparent border-0 p-0 gap-1">
              {Object.entries(categoryConfig).map(([key, { label, icon: Icon }]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-lg px-4"
                >
                  <Icon className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
                  {label}
                  {key === "unread" && unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Bulk actions bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border bg-muted/50 overflow-hidden"
            >
              <div className="px-6 py-2 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} sélectionnée{selectedIds.size > 1 ? 's' : ''}
                </span>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Tout sélectionner
                </Button>
                <div className="flex-1" />
                <Button variant="ghost" size="sm" onClick={bulkMarkAsRead}>
                  <Check className="h-4 w-4 mr-1" />
                  Marquer comme lu
                </Button>
                <Button variant="ghost" size="sm" onClick={bulkDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notifications list */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {groupedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" strokeWidth={1} />
              </div>
              <h3 className="text-lg font-medium mb-1">Aucune notification</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {selectedCategory === "unread"
                  ? "Vous êtes à jour ! Toutes vos notifications ont été lues."
                  : "Vous n'avez aucune notification pour le moment."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedNotifications.map((group) => (
                <div key={group.label}>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">
                    {group.label}
                  </h3>
                  <div className="space-y-1">
                    <AnimatePresence mode="popLayout">
                      {group.notifications.map((notification) => {
                        const typeConfig = notificationTypeConfig[notification.type] || notificationTypeConfig.default;
                        const Icon = typeConfig.icon;
                        const isSelected = selectedIds.has(notification.id);

                        return (
                          <motion.div
                            key={notification.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className={cn(
                              "group relative flex items-start gap-4 rounded-lg p-4 transition-colors cursor-pointer",
                              !notification.is_read && "bg-primary/5",
                              isSelected && "bg-primary/10 ring-1 ring-primary/20",
                              "hover:bg-muted/50"
                            )}
                            onClick={() => {
                              if (isSelectionMode) {
                                toggleSelection(notification.id);
                              } else {
                                handleNotificationClick(notification);
                              }
                            }}
                          >
                            {/* Selection checkbox */}
                            <div
                              className={cn(
                                "shrink-0 transition-opacity",
                                isSelectionMode || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelection(notification.id);
                                if (!isSelectionMode) setIsSelectionMode(true);
                              }}
                            >
                              <Checkbox checked={isSelected} />
                            </div>

                            {/* Unread indicator */}
                            {!notification.is_read && (
                              <div className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                            )}

                            {/* Actor Avatar or Icon */}
                            {notification.actor ? (
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={notification.actor.avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {getInitials(notification.actor.full_name)}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div
                                className={cn(
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                  typeConfig.bgColor
                                )}
                              >
                                <Icon
                                  className={cn("h-5 w-5", typeConfig.color)}
                                  strokeWidth={THIN_STROKE}
                                />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  {/* Type and Entity badges */}
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", typeConfig.color, typeConfig.bgColor)}>
                                      {typeConfig.label}
                                    </Badge>
                                    {notification.related_entity_type && notification.related_entity_name && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                                        {entityTypeLabels[notification.related_entity_type]?.icon && (
                                          <span className="inline-flex">
                                            {(() => {
                                              const EntityIcon = entityTypeLabels[notification.related_entity_type]?.icon;
                                              return EntityIcon ? <EntityIcon className="h-3 w-3" /> : null;
                                            })()}
                                          </span>
                                        )}
                                        <span className="truncate max-w-[120px]">
                                          {notification.related_entity_name}
                                        </span>
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* Title */}
                                  <p className={cn(
                                    "text-sm",
                                    !notification.is_read && "font-medium"
                                  )}>
                                    {notification.title}
                                  </p>
                                  
                                  {/* Message content */}
                                  {notification.message && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 bg-muted/50 rounded px-2 py-1">
                                      {formatMentionMessage(notification.message)}
                                    </p>
                                  )}
                                  
                                  {/* Metadata row */}
                                  <div className="flex items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                                      </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground/50">•</span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                                    </span>
                                    {notification.action_url && (
                                      <>
                                        <span className="text-xs text-muted-foreground/50">•</span>
                                        <span className="text-xs text-primary flex items-center gap-1">
                                          <ExternalLink className="h-3 w-3" />
                                          Voir
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notification.is_read && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notification.id);
                                      }}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {!notification.is_read && (
                                        <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                          <Check className="h-4 w-4 mr-2" />
                                          Marquer comme lu
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDelete(notification.id)}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
