import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  X,
  CheckCheck,
  MessageSquare,
  FolderKanban,
  CheckSquare,
  UserPlus,
  AtSign,
  Heart,
  ExternalLink,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";
import { useNotifications, NotificationWithActor } from "@/hooks/useNotifications";

// Helper to format mentions in notification messages (simplified version without needing profiles)
function formatMentionMessage(message: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(message)) !== null) {
    // Add text before mention
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

  // Add remaining text
  if (lastIndex < message.length) {
    parts.push(message.slice(lastIndex));
  }

  return parts.length > 0 ? parts : message;
}

// Entity type labels
const entityTypeLabels: Record<string, { label: string; icon: typeof CheckSquare }> = {
  task: { label: "Tâche", icon: CheckSquare },
  project: { label: "Projet", icon: FolderKanban },
};

const iconMap: Record<string, typeof Bell> = {
  comment_reply: MessageSquare,
  reaction: Heart,
  task_created: CheckSquare,
  project_update: FolderKanban,
  mention: AtSign,
  invite: UserPlus,
  default: Bell,
};

interface NotificationsSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationsSidebar({ open, onClose }: NotificationsSidebarProps) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  const handleNotificationClick = (notification: NotificationWithActor) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    
    // Navigate if action_url exists
    if (notification.action_url) {
      navigate(notification.action_url);
      onClose();
    }
  };

  const getIcon = (type: string) => {
    return iconMap[type] || iconMap.default;
  };
  
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-background border-l border-border shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" strokeWidth={THIN_STROKE} />
                <h2 className="text-base font-semibold">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsRead.mutate()}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Tout lire
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground/50" strokeWidth={1} />
                  </div>
                  <p className="text-sm font-medium text-foreground">Aucune notification</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vous recevrez des notifications pour les messages, réactions et mises à jour de projets
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification) => {
                    const Icon = getIcon(notification.type);
                    const entityConfig = notification.related_entity_type 
                      ? entityTypeLabels[notification.related_entity_type] 
                      : null;
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "group relative flex gap-3 px-4 py-3 transition-colors cursor-pointer",
                          !notification.is_read 
                            ? "bg-primary/5 hover:bg-primary/10" 
                            : "hover:bg-muted/50"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {/* Unread indicator */}
                        {!notification.is_read && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                        )}
                        
                        {/* Avatar or Icon */}
                        {notification.actor ? (
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={notification.actor.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(notification.actor.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            notification.type === "reaction" ? "bg-pink-100 dark:bg-pink-900/30" :
                            notification.type === "mention" ? "bg-blue-100 dark:bg-blue-900/30" :
                            notification.type === "task_created" ? "bg-green-100 dark:bg-green-900/30" :
                            notification.type === "project_update" ? "bg-amber-100 dark:bg-amber-900/30" :
                            "bg-muted"
                          )}>
                            <Icon className={cn(
                              "h-4 w-4",
                              notification.type === "reaction" ? "text-pink-600 dark:text-pink-400" :
                              notification.type === "mention" ? "text-blue-600 dark:text-blue-400" :
                              notification.type === "task_created" ? "text-green-600 dark:text-green-400" :
                              notification.type === "project_update" ? "text-amber-600 dark:text-amber-400" :
                              "text-muted-foreground"
                            )} strokeWidth={1.5} />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm",
                            !notification.is_read ? "font-medium text-foreground" : "text-foreground/90"
                          )}>
                            {notification.title}
                          </p>
                          
                          {/* Entity context badge */}
                          {entityConfig && notification.related_entity_name && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge 
                                variant="secondary" 
                                className="text-[10px] px-1.5 py-0 h-5 gap-1 font-normal"
                              >
                                <entityConfig.icon className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">
                                  {entityConfig.label}: {notification.related_entity_name}
                                </span>
                              </Badge>
                            </div>
                          )}
                          
                          {notification.message && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 bg-muted/50 rounded px-2 py-1">
                              {formatMentionMessage(notification.message)}
                            </p>
                          )}
                          <p className="text-[11px] text-muted-foreground/70 mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true,
                              locale: fr 
                            })}
                          </p>
                        </div>
                        
                        {/* Action indicator */}
                        {notification.action_url && (
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-border p-3 shrink-0">
                <Button 
                  variant="outline" 
                  className="w-full text-sm"
                  onClick={() => {
                    navigate("/notifications");
                    onClose();
                  }}
                >
                  Voir toutes les notifications
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
