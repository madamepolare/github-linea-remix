import { useLocation, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getModuleFromPath, SubNavItem } from "@/lib/navigationConfig";
import { useFilteredSubNav } from "@/hooks/useFilteredSubNav";

export function MobileSubNav() {
  const location = useLocation();
  const module = getModuleFromPath(location.pathname);
  
  // Filter sub-nav based on enabled modules
  const filteredSubNav = useFilteredSubNav(module?.slug || "", module?.subNav || []);

  // Only show if module has sub-navigation
  if (!module || filteredSubNav.length === 0) {
    return null;
  }

  const isNavActive = (item: SubNavItem) => {
    return location.pathname === item.href || 
      (item.href !== module.href && location.pathname.startsWith(item.href));
  };

  return (
    <div className="lg:hidden sticky top-14 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          {filteredSubNav.map((item) => {
            const isActive = isNavActive(item);
            
            return (
              <NavLink
                key={item.key}
                to={item.href}
                className="touch-manipulation"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "relative flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl whitespace-nowrap transition-all duration-150",
                    isActive
                      ? "text-primary-foreground font-semibold bg-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground bg-muted/40 active:bg-muted"
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full",
                        isActive 
                          ? "bg-background text-foreground" 
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </div>
  );
}
