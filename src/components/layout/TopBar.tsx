import { useLocation, NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  getModuleFromPath, 
  getActiveSubNav,
  ModuleNavConfig 
} from "@/lib/navigationConfig";

interface TopBarProps {
  /** Override module config (useful for detail pages) */
  moduleOverride?: ModuleNavConfig;
  /** Additional actions to show on the right */
  actions?: React.ReactNode;
  /** Hide quick actions */
  hideQuickActions?: boolean;
}

export function TopBar({ moduleOverride, actions, hideQuickActions }: TopBarProps) {
  const location = useLocation();
  const module = moduleOverride || getModuleFromPath(location.pathname);
  
  // Don't show topbar for dashboard or if no module found
  if (!module || module.slug === "dashboard") {
    return null;
  }

  const hasSubNav = module.subNav.length > 0;
  const hasQuickActions = !hideQuickActions && module.quickActions && module.quickActions.length > 0;
  const activeSubNav = getActiveSubNav(location.pathname, module);

  const handleQuickAction = (event: string) => {
    window.dispatchEvent(new CustomEvent(event));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="sticky top-0 z-30 bg-background border-b border-border"
    >
      <div className="flex items-center justify-between h-12 px-6">
        {/* Left: Module title + Sub-navigation */}
        <div className="flex items-center gap-6">
          {/* Module Title with Icon */}
          <div className="flex items-center gap-2">
            <module.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {module.title}
            </span>
          </div>

          {/* Sub-navigation tabs */}
          {hasSubNav && (
            <nav className="flex items-center gap-1">
              {module.subNav.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== module.href && location.pathname.startsWith(item.href));
                
                return (
                  <NavLink
                    key={item.key}
                    to={item.href}
                    className={cn(
                      "relative px-3 py-1.5 text-sm rounded-md transition-colors",
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="topbar-active-tab"
                        className="absolute inset-0 bg-muted rounded-md -z-10"
                        transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                      />
                    )}
                  </NavLink>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right: Quick actions + Custom actions */}
        <div className="flex items-center gap-2">
          {actions}
          
          {hasQuickActions && module.quickActions?.map((action) => (
            <Button
              key={action.key}
              variant="default"
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
    </motion.div>
  );
}
