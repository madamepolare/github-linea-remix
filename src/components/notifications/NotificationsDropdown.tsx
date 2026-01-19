import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, X, MessageSquare, UserPlus, FolderKanban, CheckSquare, AtSign, Heart, Reply, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { useNotifications, NotificationWithActor } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Map notification types to icons
const iconMap: Record<string, typeof Bell> = {
  task_created: CheckSquare,
  task_assigned: CheckSquare,
  project_update: FolderKanban,
  mention: AtSign,
  new_message: MessageSquare,
  comment_reply: Reply,
  reaction: Heart,
  invite: UserPlus,
  default: Bell,
};

// Map notification types to colors
const colorMap: Record<string, string> = {
  task_created: "text-green-600 dark:text-green-400",
  task_assigned: "text-blue-600 dark:text-blue-400",
  project_update: "text-amber-600 dark:text-amber-400",
  mention: "text-purple-600 dark:text-purple-400",
  new_message: "text-cyan-600 dark:text-cyan-400",
  comment_reply: "text-blue-600 dark:text-blue-400",
  reaction: "text-pink-600 dark:text-pink-400",
  invite: "text-indigo-600 dark:text-indigo-400",
  default: "text-muted-foreground",
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function NotificationsDropdown({ collapsed = false, inNavigation = false }: { collapsed?: boolean; inNavigation?: boolean }) {
  const navigate = useNavigate();
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  
  // Check if any notification is recent (less than 5 minutes old)
  const hasRecentNotification = useMemo(() => {
    return notifications.some((n) => !n.is_read && differenceInMinutes(new Date(), new Date(n.created_at)) < 5);
  }, [notifications]);

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification.mutate(id);
  };

  const handleNotificationClick = (notification: NotificationWithActor) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      setOpen(false);
    }
  };

  const displayedNotifications = notifications.slice(0, 8);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
            "text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <div className="relative">
            <Bell className={cn("h-[18px] w-[18px]", hasRecentNotification && "animate-pulse")} strokeWidth={1.5} />
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
                    "absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground",
                    hasRecentNotification && "ring-2 ring-destructive/30"
                  )}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && <span className="flex-1 text-left">Notifications</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={collapsed ? "center" : "start"}
        side="right"
        sideOffset={8}
        className="w-80 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Tout marquer lu
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" strokeWidth={1} />
              <p className="text-sm text-muted-foreground">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {displayedNotifications.map((notification) => {
                  const Icon = iconMap[notification.type] || iconMap.default;
                  const color = colorMap[notification.type] || colorMap.default;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer",
                        !notification.is_read && "bg-muted/30"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}

                      {/* Avatar or Icon */}
                      {notification.actor ? (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={notification.actor.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(notification.actor.full_name)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted", color)}>
                          <Icon className="h-4 w-4" strokeWidth={1.5} />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleRemove(e, notification.id)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
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
                navigate('/notifications');
                setOpen(false);
              }}
            >
              Voir toutes les notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
