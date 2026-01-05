import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Settings,
  ChevronLeft,
  LogOut,
  ChevronsUpDown,
  HelpCircle,
  LockOpen,
  LayoutDashboard,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { CommandTrigger } from "@/components/command-palette/CommandTrigger";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarStore } from "@/hooks/useSidebarStore";
import { useMemo } from "react";
import { useModules, useWorkspaceModules } from "@/hooks/useModules";
import { 
  MODULE_CONFIG, 
  CORE_MODULES, 
  EXTENSION_MODULES,
  ModuleNavConfig 
} from "@/lib/navigationConfig";

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isExtension?: boolean;
  moduleSlug?: string;
}

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { collapsed, toggle } = useSidebarStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, activeWorkspace, workspaces, signOut, setActiveWorkspace } = useAuth();
  
  // Get modules data
  const { data: modules = [] } = useModules();
  const { data: workspaceModules = [] } = useWorkspaceModules();

  // Check if a module is enabled
  const isModuleEnabled = (slug: string) => {
    const module = modules.find((m) => m.slug === slug);
    // Core modules are always enabled
    if (module?.is_core) return true;
    // Check if module is in workspace_modules
    return workspaceModules.some((wm) => wm.module?.slug === slug);
  };

  // Build navigation based on enabled modules - now without children!
  const { coreNavigation, extensionNavigation } = useMemo(() => {
    const core: NavItem[] = [
      { title: "Dashboard", icon: LayoutDashboard, href: "/" },
    ];
    const extensions: NavItem[] = [];

    // Add core modules
    CORE_MODULES.forEach((slug) => {
      const config = MODULE_CONFIG[slug];
      if (config && isModuleEnabled(slug)) {
        core.push({
          title: config.title,
          icon: config.icon,
          href: config.subNav.length > 0 ? config.subNav[0].href : config.href,
          moduleSlug: slug,
        });
      }
    });

    // Add extension modules
    EXTENSION_MODULES.forEach((slug) => {
      const config = MODULE_CONFIG[slug];
      if (config && isModuleEnabled(slug)) {
        extensions.push({
          title: config.title,
          icon: config.icon,
          href: config.subNav.length > 0 ? config.subNav[0].href : config.href,
          moduleSlug: slug,
          isExtension: true,
        });
      }
    });

    return { coreNavigation: core, extensionNavigation: extensions };
  }, [modules, workspaceModules]);

  const isActive = (href: string, moduleSlug?: string) => {
    if (href === "/" && !moduleSlug) return location.pathname === "/";
    if (moduleSlug) {
      return location.pathname.startsWith(`/${moduleSlug}`);
    }
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    await setActiveWorkspace(workspaceId);
  };

  const userInitials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  const NavItemComponent = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const active = isActive(item.href, item.moduleSlug);

    const content = (
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
          active
            ? "bg-foreground text-background font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            active ? "text-background" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.title}</span>
            {item.isExtension && (
              <LockOpen className={cn(
                "h-3.5 w-3.5 shrink-0",
                active ? "text-background" : "text-muted-foreground"
              )} />
            )}
          </>
        )}
      </div>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink to={item.href} onClick={onClick}>{content}</NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.title}
            {item.isExtension && (
              <LockOpen className="h-3 w-3 text-muted-foreground" />
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <NavLink to={item.href} onClick={onClick}>{content}</NavLink>;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col bg-background border-r border-border"
    >
      {/* Workspace Switcher (top) - h-14 aligns with TopBar */}
      <div className="flex items-center justify-between h-14 px-3">
        {activeWorkspace ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-semibold text-sm">
                  {activeWorkspace.name.slice(0, 1).toUpperCase()}
                </div>
                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {activeWorkspace.name}
                      </p>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal uppercase tracking-wider">Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceSwitch(workspace.id)}
                  className={cn(
                    workspace.id === activeWorkspace.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-background text-xs font-medium">
                      {workspace.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm">{workspace.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <span className="text-background text-sm font-bold">A</span>
            </div>
            {!collapsed && <span className="text-sm font-semibold">Loading...</span>}
          </div>
        )}
        
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Collapsed toggle */}
      {collapsed && (
        <div className="flex justify-start px-3 py-3 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      )}

      {/* Command Palette Trigger */}
      {!collapsed && (
        <div className="px-3 py-2">
          <CommandTrigger />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
        {/* Core navigation */}
        <div className="space-y-1">
          {coreNavigation.map((item) => (
            <NavItemComponent key={item.title} item={item} onClick={onNavigate} />
          ))}
        </div>
        
        {/* Extensions section */}
        {extensionNavigation.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            {!collapsed && (
              <div className="px-3 mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Extensions
                </span>
              </div>
            )}
            <div className="space-y-1">
              {extensionNavigation.map((item) => (
                <NavItemComponent key={item.title} item={item} onClick={onNavigate} />
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-border px-3 py-2 space-y-0.5">
        <NotificationsDropdown collapsed={collapsed} />
        <ThemeToggle collapsed={collapsed} />
        
        <NavItemComponent 
          item={{ title: "Settings", icon: Settings, href: "/settings" }} 
          onClick={onNavigate} 
        />
        
        {!collapsed && (
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <HelpCircle className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span>Help & Support</span>
          </button>
        )}
      </div>

      {/* User Profile */}
      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted cursor-pointer",
                collapsed && "justify-center px-0"
              )}
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || "User"} 
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center text-xs font-medium text-background">
                  {userInitials}
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.job_title || user?.email}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={collapsed ? "center" : "end"} side={collapsed ? "right" : "top"} className="w-52">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || "User"} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center text-xs font-medium text-background">
                    {userInitials}
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{profile?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}
