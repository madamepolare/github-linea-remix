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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className="flex-1"
            >
              <motion.div
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl transition-colors",
                  active 
                    ? "text-foreground" 
                    : "text-muted-foreground"
                )}
                whileTap={{ scale: 0.92 }}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-7 rounded-full transition-colors",
                  active && "bg-foreground/10"
                )}>
                  <item.icon 
                    className={cn(
                      "h-5 w-5 transition-all",
                      active && "scale-110"
                    )} 
                    strokeWidth={active ? 2 : THIN_STROKE} 
                  />
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  active && "font-semibold"
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
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 text-muted-foreground"
          whileTap={{ scale: 0.92 }}
        >
          <div className="flex items-center justify-center w-10 h-7 rounded-full">
            <Menu className="h-5 w-5" strokeWidth={THIN_STROKE} />
          </div>
          <span className="text-[10px] font-medium">Plus</span>
        </motion.button>
      </div>
    </motion.nav>
  );
}
