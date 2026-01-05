import { useLocation, NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  getModuleFromPath, 
  getActiveSubNav,
  ModuleNavConfig,
  SubNavItem 
} from "@/lib/navigationConfig";

interface TopBarProps {
  /** Override module config (useful for detail pages) */
  moduleOverride?: ModuleNavConfig;
  /** Additional actions to show on the right */
  actions?: React.ReactNode;
  /** Hide quick actions */
  hideQuickActions?: boolean;
  /** Page-level sub-navigation (for nested tabs) */
  pageSubNav?: SubNavItem[];
  /** Page title override */
  pageTitle?: string;
}

export function TopBar({ 
  moduleOverride, 
  actions, 
  hideQuickActions,
  pageSubNav,
  pageTitle 
}: TopBarProps) {
  const location = useLocation();
  const module = moduleOverride || getModuleFromPath(location.pathname);
  
  // Don't show topbar for dashboard or if no module found
  if (!module || module.slug === "dashboard") {
    return null;
  }

  const hasModuleSubNav = module.subNav.length > 0;
  const hasPageSubNav = pageSubNav && pageSubNav.length > 0;
  const hasQuickActions = !hideQuickActions && module.quickActions && module.quickActions.length > 0;
  const activeSubNav = getActiveSubNav(location.pathname, module);

  const handleQuickAction = (event: string) => {
    window.dispatchEvent(new CustomEvent(event));
  };

  // Check if a nav item is active
  const isNavActive = (item: SubNavItem) => {
    return location.pathname === item.href || 
      (item.href !== module.href && location.pathname.startsWith(item.href));
  };

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border">
      {/* Main TopBar Row */}
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: Module title + Sub-navigation */}
        <div className="flex items-center gap-6">
          {/* Module Title with Icon */}
          <div className="flex items-center gap-2.5">
            <module.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              {pageTitle || module.title}
            </span>
          </div>

          {/* Module-level sub-navigation tabs */}
          {hasModuleSubNav && (
            <nav className="flex items-center">
              <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
                {module.subNav.map((item) => {
                  const isActive = isNavActive(item);
                  
                  return (
                    <NavLink
                      key={item.key}
                      to={item.href}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-150",
                        isActive
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "h-5 min-w-5 px-1.5 text-xs font-medium",
                            isActive 
                              ? "bg-foreground text-background" 
                              : "bg-muted-foreground/20 text-muted-foreground"
                          )}
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="topbar-active-tab"
                          className="absolute inset-0 bg-background rounded-md shadow-sm -z-10"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </nav>
          )}
        </div>

        {/* Right: Quick actions + Custom actions */}
        <div className="flex items-center gap-2">
          {actions}
          
          {hasQuickActions && module.quickActions?.map((action) => (
            <Button
              key={action.key}
              variant={action.variant || "default"}
              size="sm"
              onClick={() => handleQuickAction(action.event)}
              className="gap-1.5 h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Secondary Row: Page-level sub-navigation (nested tabs) */}
      {hasPageSubNav && (
        <div className="flex items-center h-10 px-6 border-t border-border/50 bg-muted/30">
          <nav className="flex items-center gap-1">
            {pageSubNav.map((item) => {
              const isActive = location.pathname === item.href || 
                location.pathname.startsWith(item.href + "/");
              
              return (
                <NavLink
                  key={item.key}
                  to={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1 text-sm rounded transition-colors",
                    isActive
                      ? "text-foreground font-medium bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "h-4 min-w-4 px-1 text-[10px] font-medium",
                        isActive 
                          ? "border-foreground/20 text-foreground" 
                          : "border-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}

// Composable TabBar component for use within pages
interface TabBarProps {
  items: SubNavItem[];
  className?: string;
  size?: "sm" | "default";
}

export function TabBar({ items, className, size = "default" }: TabBarProps) {
  const location = useLocation();
  
  return (
    <nav className={cn("flex items-center", className)}>
      <div className={cn(
        "flex items-center bg-muted/50 rounded-lg",
        size === "sm" ? "p-0.5" : "p-0.5"
      )}>
        {items.map((item) => {
          const isActive = location.pathname === item.href || 
            location.pathname.startsWith(item.href + "/");
          
          return (
            <NavLink
              key={item.key}
              to={item.href}
              className={cn(
                "relative flex items-center gap-1.5 rounded-md transition-all duration-150",
                size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "font-medium",
                    size === "sm" 
                      ? "h-4 min-w-4 px-1 text-[10px]" 
                      : "h-5 min-w-5 px-1.5 text-xs",
                    isActive 
                      ? "bg-foreground text-background" 
                      : "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </Badge>
              )}
              {isActive && (
                <motion.div
                  layoutId="tabbar-active"
                  className="absolute inset-0 bg-background rounded-md shadow-sm -z-10"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

// Simple inline tabs for use within content areas
interface InlineTabsProps {
  items: SubNavItem[];
  className?: string;
}

export function InlineTabs({ items, className }: InlineTabsProps) {
  const location = useLocation();
  
  return (
    <div className={cn("flex items-center gap-1 border-b border-border", className)}>
      {items.map((item) => {
        const isActive = location.pathname === item.href || 
          location.pathname.startsWith(item.href + "/");
        
        return (
          <NavLink
            key={item.key}
            to={item.href}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
              isActive
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "h-5 min-w-5 px-1.5 text-xs font-medium",
                  isActive 
                    ? "bg-foreground text-background" 
                    : "bg-muted-foreground/20 text-muted-foreground"
                )}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </Badge>
            )}
            {isActive && (
              <motion.div
                layoutId="inline-tabs-active"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
          </NavLink>
        );
      })}
    </div>
  );
}
