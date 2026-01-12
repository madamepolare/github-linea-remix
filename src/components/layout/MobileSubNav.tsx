import { useLocation, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getModuleFromPath, SubNavItem } from "@/lib/navigationConfig";

export function MobileSubNav() {
  const location = useLocation();
  const module = getModuleFromPath(location.pathname);

  // Only show if module has sub-navigation
  if (!module || module.subNav.length === 0) {
    return null;
  }

  const isNavActive = (item: SubNavItem) => {
    return location.pathname === item.href || 
      (item.href !== module.href && location.pathname.startsWith(item.href));
  };

  return (
    <div className="lg:hidden sticky top-12 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
      <ScrollArea className="w-full">
        <div className="flex items-center gap-1 px-4 py-2">
          {module.subNav.map((item) => {
            const isActive = isNavActive(item);
            
            return (
              <NavLink
                key={item.key}
                to={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-all duration-150",
                  isActive
                    ? "text-background font-medium bg-foreground"
                    : "text-muted-foreground hover:text-foreground bg-muted/50"
                )}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "h-4 min-w-4 px-1 text-[10px] font-medium",
                      isActive 
                        ? "bg-background text-foreground" 
                        : "bg-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
}
