import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageCircle,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";
import { useUnreadCounts } from "@/hooks/useTeamMessages";

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Accueil", href: "/dashboard" },
  { icon: FolderKanban, label: "Projets", href: "/projects" },
  { icon: CheckSquare, label: "Tâches", href: "/tasks" },
  { icon: MessageCircle, label: "Messages", href: "/messages" },
];

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const location = useLocation();
  const { data: unreadCounts } = useUnreadCounts();

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === "/dashboard" || location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  // Calculate total unread messages
  const totalUnread = unreadCounts 
    ? Object.values(unreadCounts).reduce((sum: number, count) => sum + (count as number), 0)
    : 0;

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const showBadge = item.href === "/messages" && totalUnread > 0;
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className="flex-1 touch-manipulation"
            >
              <motion.div
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-1 transition-colors",
                  active 
                    ? "text-primary" 
                    : "text-muted-foreground active:text-foreground"
                )}
                whileTap={{ scale: 0.9 }}
              >
                <div className={cn(
                  "relative flex items-center justify-center w-14 h-8 rounded-2xl transition-all duration-200",
                  active && "bg-primary/10"
                )}>
                  <item.icon 
                    className={cn(
                      "h-[22px] w-[22px] transition-transform",
                      active && "scale-110"
                    )} 
                    strokeWidth={active ? 2.2 : THIN_STROKE} 
                  />
                  {/* Badge for unread messages */}
                  {showBadge && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 right-1 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full"
                    >
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </motion.span>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] leading-tight transition-colors",
                  active ? "font-semibold" : "font-medium"
                )}>
                  {item.label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}
        
        {/* Menu button */}
        <motion.button
          onClick={onMenuClick}
          className="flex-1 flex flex-col items-center justify-center h-full gap-1 text-muted-foreground active:text-foreground touch-manipulation"
          whileTap={{ scale: 0.9 }}
        >
          <div className="flex items-center justify-center w-14 h-8 rounded-2xl">
            <Menu className="h-[22px] w-[22px]" strokeWidth={THIN_STROKE} />
          </div>
          <span className="text-[11px] font-medium leading-tight">Plus</span>
        </motion.button>
      </div>
    </motion.nav>
  );
}
