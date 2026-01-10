import { useState, useMemo } from "react";
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
  Archive,
  Trash2,
  MoreHorizontal,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { THIN_STROKE } from "@/components/ui/icon";
import { useNotifications } from "@/hooks/useNotifications";

type NotificationType = "task" | "project" | "mention" | "invite" | "document" | "alert" | "calendar" | "team";
type NotificationCategory = "all" | "unread" | "mentions" | "tasks" | "projects" | "documents" | "archived";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description?: string;
  read: boolean;
  archived: boolean;
  createdAt: Date;
  actionUrl?: string;
  actor?: {
    name: string;
    avatar?: string;
  };
  relatedEntity?: {
    type: string;
    name: string;
    id: string;
  };
}

// Mock notifications with more variety
const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "mention",
    title: "Nouvelle mention",
    description: "Alex vous a mentionné dans un commentaire sur 'Refonte Site Web'",
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 2),
    actor: { name: "Alex Martin" },
    relatedEntity: { type: "project", name: "Refonte Site Web", id: "proj-1" },
  },
  {
    id: "2",
    type: "task",
    title: "Tâche assignée",
    description: "Vous avez été assigné à 'Revue documentation API'",
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    actor: { name: "Marie Dupont" },
    relatedEntity: { type: "task", name: "Revue documentation API", id: "task-1" },
  },
  {
    id: "3",
    type: "document",
    title: "Document à signer",
    description: "Un devis attend votre signature - Client Durand",
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    relatedEntity: { type: "quote", name: "Devis #2024-042", id: "quote-1" },
  },
  {
    id: "4",
    type: "project",
    title: "Projet mis à jour",
    description: "Mobile App v2 est passé en phase 'En cours'",
    read: true,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    relatedEntity: { type: "project", name: "Mobile App v2", id: "proj-2" },
  },
  {
    id: "5",
    type: "calendar",
    title: "Réunion dans 1 heure",
    description: "Point hebdo équipe Design - 14h00",
    read: true,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: "6",
    type: "alert",
    title: "Échéance proche",
    description: "La tâche 'Livraison maquettes' arrive à échéance demain",
    read: false,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    relatedEntity: { type: "task", name: "Livraison maquettes", id: "task-2" },
  },
  {
    id: "7",
    type: "team",
    title: "Nouveau membre",
    description: "Sophie Bernard a rejoint l'équipe 'Design'",
    read: true,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    actor: { name: "Sophie Bernard" },
  },
  {
    id: "8",
    type: "invite",
    title: "Invitation workspace",
    description: "Vous avez été invité à rejoindre 'Agence Créative'",
    read: true,
    archived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: "9",
    type: "document",
    title: "Contrat validé",
    description: "Le contrat pour le projet Villa Moderne a été signé",
    read: true,
    archived: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    relatedEntity: { type: "contract", name: "Contrat Villa Moderne", id: "contract-1" },
  },
];

const iconMap: Record<NotificationType, typeof Bell> = {
  task: CheckSquare,
  project: FolderKanban,
  mention: MessageSquare,
  invite: UserPlus,
  document: FileText,
  alert: AlertCircle,
  calendar: Calendar,
  team: Users,
};

const categoryConfig: Record<NotificationCategory, { label: string; icon: typeof Bell }> = {
  all: { label: "Toutes", icon: Inbox },
  unread: { label: "Non lues", icon: Bell },
  mentions: { label: "Mentions", icon: MessageSquare },
  tasks: { label: "Tâches", icon: CheckSquare },
  projects: { label: "Projets", icon: FolderKanban },
  documents: { label: "Documents", icon: FileText },
  archived: { label: "Archivées", icon: Archive },
};

function groupNotificationsByDate(notifications: NotificationItem[]) {
  const groups: { label: string; notifications: NotificationItem[] }[] = [];
  const today: NotificationItem[] = [];
  const yesterday: NotificationItem[] = [];
  const thisWeek: NotificationItem[] = [];
  const older: NotificationItem[] = [];

  notifications.forEach((n) => {
    if (isToday(n.createdAt)) {
      today.push(n);
    } else if (isYesterday(n.createdAt)) {
      yesterday.push(n);
    } else if (isThisWeek(n.createdAt)) {
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

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Filter notifications based on category and search
  const filteredNotifications = useMemo(() => {
    let result = notifications;

    // Filter by category
    switch (selectedCategory) {
      case "unread":
        result = result.filter((n) => !n.read && !n.archived);
        break;
      case "mentions":
        result = result.filter((n) => n.type === "mention" && !n.archived);
        break;
      case "tasks":
        result = result.filter((n) => n.type === "task" && !n.archived);
        break;
      case "projects":
        result = result.filter((n) => n.type === "project" && !n.archived);
        break;
      case "documents":
        result = result.filter((n) => n.type === "document" && !n.archived);
        break;
      case "archived":
        result = result.filter((n) => n.archived);
        break;
      default:
        result = result.filter((n) => !n.archived);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.description?.toLowerCase().includes(query) ||
          n.actor?.name.toLowerCase().includes(query) ||
          n.relatedEntity?.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, selectedCategory, searchQuery]);

  const groupedNotifications = useMemo(() => {
    return groupNotificationsByDate(filteredNotifications);
  }, [filteredNotifications]);

  const unreadCount = notifications.filter((n) => !n.read && !n.archived).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const archiveNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, archived: true, read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
    setNotifications((prev) =>
      prev.map((n) => (selectedIds.has(n.id) ? { ...n, read: true } : n))
    );
    clearSelection();
  };

  const bulkArchive = () => {
    setNotifications((prev) =>
      prev.map((n) => (selectedIds.has(n.id) ? { ...n, archived: true, read: true } : n))
    );
    clearSelection();
  };

  const bulkDelete = () => {
    setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    clearSelection();
  };

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
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
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
              {Object.entries(categoryConfig).slice(0, 6).map(([key, { label, icon: Icon }]) => (
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
                <Button variant="ghost" size="sm" onClick={bulkArchive}>
                  <Archive className="h-4 w-4 mr-1" />
                  Archiver
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
                  : selectedCategory === "archived"
                  ? "Aucune notification archivée."
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
                        const Icon = iconMap[notification.type];
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
                              !notification.read && "bg-primary/5",
                              isSelected && "bg-primary/10 ring-1 ring-primary/20",
                              "hover:bg-muted/50"
                            )}
                            onClick={() => {
                              if (isSelectionMode) {
                                toggleSelection(notification.id);
                              } else {
                                markAsRead(notification.id);
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
                            {!notification.read && (
                              <div className="absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                            )}

                            {/* Icon */}
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                notification.type === "alert" ? "bg-destructive/10" : "bg-muted"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "h-5 w-5",
                                  notification.type === "alert" ? "text-destructive" : "text-muted-foreground"
                                )}
                                strokeWidth={THIN_STROKE}
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className={cn(
                                    "text-sm",
                                    !notification.read && "font-medium"
                                  )}>
                                    {notification.title}
                                  </p>
                                  {notification.description && (
                                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                      {notification.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: fr })}
                                    </span>
                                    {notification.relatedEntity && (
                                      <>
                                        <span className="text-muted-foreground">•</span>
                                        <Badge variant="secondary" className="text-xs font-normal">
                                          {notification.relatedEntity.name}
                                        </Badge>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
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
                                      {!notification.read && (
                                        <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                          <Check className="h-4 w-4 mr-2" />
                                          Marquer comme lu
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={() => archiveNotification(notification.id)}>
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archiver
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => deleteNotification(notification.id)}
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
