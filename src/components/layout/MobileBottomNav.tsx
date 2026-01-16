import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Accueil", href: "/" },
  { icon: FolderKanban, label: "Projets", href: "/projects" },
  { icon: CheckSquare, label: "Tâches", href: "/tasks" },
  { icon: Calendar, label: "Planning", href: "/planning" },
];

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around h-14">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className="flex-1 touch-manipulation"
            >
              <motion.div
                className={cn(
                  "flex flex-col items-center justify-center h-full gap-0.5 transition-colors",
                  active 
                    ? "text-foreground" 
                    : "text-muted-foreground active:text-foreground"
                )}
                whileTap={{ scale: 0.95 }}
              >
                <div className={cn(
                  "flex items-center justify-center w-12 h-7 rounded-full transition-colors",
                  active && "bg-primary/10"
                )}>
                  <item.icon 
                    className={cn(
                      "h-5 w-5 transition-transform",
                      active && "scale-105"
                    )} 
                    strokeWidth={active ? 2.2 : THIN_STROKE} 
                  />
                </div>
                <span className={cn(
                  "text-[10px] leading-tight transition-colors",
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
          className="flex-1 flex flex-col items-center justify-center h-full gap-0.5 text-muted-foreground active:text-foreground touch-manipulation"
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center justify-center w-12 h-7 rounded-full">
            <Menu className="h-5 w-5" strokeWidth={THIN_STROKE} />
          </div>
          <span className="text-[10px] font-medium leading-tight">Plus</span>
        </motion.button>
      </div>
    </motion.nav>
  );
}
