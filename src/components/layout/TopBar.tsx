import { useState, useEffect } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreHorizontal, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTopBar } from "@/contexts/TopBarContext";
import { THIN_STROKE } from "@/components/ui/icon";
import { 
  getModuleFromPath, 
  getActiveSubNav,
  ModuleNavConfig,
  SubNavItem 
} from "@/lib/navigationConfig";
import { CRMAddDropdown } from "@/components/crm/CRMAddDropdown";
import { useFilteredSubNav } from "@/hooks/useFilteredSubNav";

interface TopBarProps {
  /** Override module config (useful for detail pages) */
  moduleOverride?: ModuleNavConfig;
  /** Additional actions to show on the right */
  actions?: React.ReactNode;
  /** Hide quick actions */
  hideQuickActions?: boolean;
}

export function TopBar({ 
  moduleOverride, 
  actions, 
  hideQuickActions,
}: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { entityConfig } = useTopBar();
  const module = moduleOverride || getModuleFromPath(location.pathname);
  
  // Don't show topbar for dashboard or if no module found
  if (!module || module.slug === "dashboard") {
    return null;
  }

  // If entity config is set, render entity view
  if (entityConfig) {
    return <EntityTopBar config={entityConfig} module={module} />;
  }

  // Standard module view
  return <ModuleTopBar module={module} actions={actions} hideQuickActions={hideQuickActions} />;
}

// Standard module TopBar
interface ModuleTopBarProps {
  module: ModuleNavConfig;
  actions?: React.ReactNode;
  hideQuickActions?: boolean;
}

function ModuleTopBar({ module, actions, hideQuickActions }: ModuleTopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Filter sub-nav based on enabled modules
  const filteredSubNav = useFilteredSubNav(module.slug, module.subNav);
  
  const hasModuleSubNav = filteredSubNav.length > 0;
  const hasQuickActions = !hideQuickActions && module.quickActions && module.quickActions.length > 0;
  const isCRM = module.slug === "crm";
  
  // CRM add menu state
  const [crmContactOpen, setCrmContactOpen] = useState(false);
  const [crmCompanyOpen, setCrmCompanyOpen] = useState(false);
  const [crmLeadOpen, setCrmLeadOpen] = useState(false);
  
  // Listen for CRM add menu events
  useEffect(() => {
    const handleCrmAddMenu = () => {
      // This is handled by the dropdown itself
    };
    window.addEventListener("open-crm-add-menu", handleCrmAddMenu);
    return () => window.removeEventListener("open-crm-add-menu", handleCrmAddMenu);
  }, []);

  const handleQuickAction = (event: string) => {
    window.dispatchEvent(new CustomEvent(event));
  };

  const isNavActive = (item: SubNavItem) => {
    return location.pathname === item.href || 
      (item.href !== module.href && location.pathname.startsWith(item.href));
  };

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: Module title + Sub-navigation */}
        <div className="flex items-center gap-6">
          {/* Module Title with Icon */}
          <div className="flex items-center gap-2.5">
            <module.icon className="h-4 w-4 text-muted-foreground" strokeWidth={THIN_STROKE} />
            <span className="text-sm font-semibold text-foreground">
              {module.title}
            </span>
          </div>

          {/* Module-level sub-navigation tabs */}
          {hasModuleSubNav && (
            <nav className="flex items-center">
              <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
                {filteredSubNav.map((item) => {
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
          
          {/* Special handling for CRM module */}
          {isCRM && (
            <CRMAddDropdown
              onCreateContact={() => window.dispatchEvent(new CustomEvent("open-create-contact"))}
              onCreateCompany={() => window.dispatchEvent(new CustomEvent("open-create-company"))}
              onCreateLead={() => window.dispatchEvent(new CustomEvent("open-create-lead"))}
              onAIProspecting={() => window.dispatchEvent(new CustomEvent("open-ai-prospecting"))}
            />
          )}
          
          {/* Standard quick actions for non-CRM modules */}
          {!isCRM && hasQuickActions && module.quickActions?.map((action) => (
            <Button
              key={action.key}
              variant={action.variant || "default"}
              size="sm"
              onClick={() => handleQuickAction(action.event)}
              className="gap-1.5 h-8"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={THIN_STROKE} />
              <span className="hidden sm:inline">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Entity detail TopBar (project detail, lead detail, etc.)
import { TopBarEntityConfig } from "@/contexts/TopBarContext";

interface EntityTopBarProps {
  config: TopBarEntityConfig;
  module: ModuleNavConfig;
}

function EntityTopBar({ config, module }: EntityTopBarProps) {
  const navigate = useNavigate();
  const hasTabs = config.tabs && config.tabs.length > 0;

  return (
    <div className="sticky top-0 z-30 bg-background border-b border-border">
      {/* Entity Header Row */}
      <div className="flex items-center justify-between h-14 px-6">
        {/* Left: Back + Entity info */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(config.backTo)}
            className="h-8 w-8 rounded-full hover:bg-muted shrink-0"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={THIN_STROKE} />
          </Button>

          {/* Color accent line */}
          {config.color && (
            <div
              className="w-1 h-8 rounded-full shrink-0"
              style={{ backgroundColor: config.color }}
            />
          )}

          {/* Entity title + badges */}
          <div className="flex flex-col gap-0.5 min-w-0 max-w-[50vw]">
            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-base font-semibold tracking-tight truncate max-w-[40vw]" title={config.title}>
                {config.title}
              </h1>
              <div className="flex items-center gap-1.5 shrink-0">
                {config.badges?.map((badge, idx) => (
                  <Badge
                    key={idx}
                    variant={badge.variant || "outline"}
                    className="text-xs font-normal text-muted-foreground border-border whitespace-nowrap"
                  >
                    {badge.icon && <badge.icon className="h-3 w-3 mr-1" strokeWidth={THIN_STROKE} />}
                    {badge.label}
                  </Badge>
                ))}
              </div>
            </div>
            {/* Metadata row */}
            {config.metadata && config.metadata.length > 0 && (
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                {config.metadata.map((meta, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    {meta.icon && <meta.icon className="h-3 w-3" strokeWidth={THIN_STROKE} />}
                    {meta.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {config.actions}
          {config.onSettings && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={config.onSettings}
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={THIN_STROKE} />
            </Button>
          )}
        </div>
      </div>

      {/* Entity Tabs Row */}
      {hasTabs && (
        <div className="flex items-center h-10 px-6 border-t border-border/30">
          <nav className="flex items-center gap-1">
            {config.tabs!.map((tab) => {
              const isActive = config.activeTab === tab.key;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => config.onTabChange?.(tab.key)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all duration-150",
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {tab.icon && <tab.icon className="h-3.5 w-3.5" strokeWidth={THIN_STROKE} />}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "h-4 min-w-4 px-1 text-[10px] font-medium ml-1",
                        isActive 
                          ? "bg-foreground text-background" 
                          : "bg-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="entity-tab-active"
                      className="absolute inset-0 bg-muted rounded-md -z-10"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                </button>
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
