import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, X, MessageSquare, UserPlus, FolderKanban, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";

interface Notification {
  id: string;
  type: "task" | "project" | "mention" | "invite";
  title: string;
  description?: string;
  read: boolean;
  createdAt: Date;
}

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "mention",
    title: "You were mentioned",
    description: "Alex mentioned you in a comment on 'Website Redesign'",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
  },
  {
    id: "2",
    type: "task",
    title: "Task assigned",
    description: "You've been assigned to 'Review API documentation'",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
  },
  {
    id: "3",
    type: "project",
    title: "Project updated",
    description: "Mobile App v2 moved to 'In Progress' phase",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: "4",
    type: "invite",
    title: "Workspace invitation",
    description: "You've been invited to join 'Design Team' workspace",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
];

const iconMap = {
  task: CheckSquare,
  project: FolderKanban,
  mention: MessageSquare,
  invite: UserPlus,
};

export function NotificationsDropdown({ collapsed = false, inNavigation = false }: { collapsed?: boolean; inNavigation?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  
  // Check if any notification is recent (less than 5 minutes old)
  const hasRecentNotification = useMemo(() => {
    return notifications.some((n) => !n.read && differenceInMinutes(new Date(), n.createdAt) < 5);
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

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
              onClick={markAllAsRead}
              className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" strokeWidth={1} />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {notifications.map((notification) => {
                  const Icon = iconMap[notification.type];
                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                        !notification.read && "bg-muted/30"
                      )}
                    >
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}

                      {/* Icon */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      </div>

                      {/* Content */}
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

                      {/* Actions */}
                      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => removeNotification(notification.id)}
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
            <Button variant="ghost" className="w-full text-sm h-8">
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
