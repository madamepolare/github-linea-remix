import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Settings,
  ChevronLeft,
  LogOut,
  ChevronsUpDown,
  HelpCircle,
  LockOpen,
  LayoutDashboard,
  LucideIcon,
  Plus,
  Check,
  Building2,
  RefreshCw,
  Loader2,
  Bell,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CommandTrigger } from "@/components/command-palette/CommandTrigger";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { THIN_STROKE } from "@/components/ui/icon";
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
} from "@/lib/navigationConfig";
import { 
  QuickAccountSwitch, 
  useCanQuickSwitch, 
  instantSwitchToEmail,
  hasStoredSessionFor,
} from "@/components/auth/QuickAccountSwitch";
import {
  isFounderEmail,
  getEmailForWorkspace,
  setPendingWorkspace,
} from "@/lib/founderSwitch";
import { useToast } from "@/hooks/use-toast";

interface NavItem {
  title: string;
  icon: LucideIcon;
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
  const { user, profile, activeWorkspace, workspaces, signOut, setActiveWorkspace, refreshProfile } = useAuth();
  const [showQuickSwitch, setShowQuickSwitch] = useState(false);
  const [switchingWorkspace, setSwitchingWorkspace] = useState<string | null>(null);
  const canQuickSwitch = useCanQuickSwitch(user?.email);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get modules data
  const { data: modules = [] } = useModules();
  const { data: workspaceModules = [] } = useWorkspaceModules();

  // Check if a module is enabled
  const isModuleEnabled = (slug: string) => {
    const module = modules.find((m) => m.slug === slug);
    if (module?.is_core) return true;
    return workspaceModules.some((wm) => wm.module?.slug === slug);
  };

  // Build navigation based on enabled modules
  const { coreNavigation, extensionNavigation } = useMemo(() => {
    const core: NavItem[] = [
      { title: "Dashboard", icon: LayoutDashboard, href: "/" },
    ];
    const extensions: NavItem[] = [];

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

  const handleSwitchAccount = () => {
    if (canQuickSwitch) {
      setShowQuickSwitch(true);
    } else {
      signOut().then(() => navigate("/auth?switch=true"));
    }
  };

  // Smart workspace switch: pour le fondateur, TOUJOURS switch au bon compte
  const handleWorkspaceSwitch = async (workspaceId: string) => {
    const targetWorkspace = workspaces.find(w => w.id === workspaceId);
    if (!targetWorkspace) return;

    // Si pas fondateur, comportement normal
    if (!isFounderEmail(user?.email)) {
      await setActiveWorkspace(workspaceId);
      return;
    }

    // Cherche l'email IMPOSÉ pour ce workspace (par slug)
    const targetEmail = getEmailForWorkspace(targetWorkspace.slug);

    // Si pas de mapping pour ce workspace, juste changer le workspace
    if (!targetEmail) {
      await setActiveWorkspace(workspaceId);
      return;
    }

    // Si déjà sur le bon compte, juste changer le workspace actif
    if (targetEmail.toLowerCase() === user?.email?.toLowerCase()) {
      await setActiveWorkspace(workspaceId);
      return;
    }

    // On doit changer de compte - vérifie si on a un token
    if (!hasStoredSessionFor(targetEmail)) {
      toast({
        variant: "destructive",
        title: "Session non disponible",
        description: `Connecte-toi d'abord manuellement à ${targetEmail} pour activer le switch seamless.`,
      });
      setShowQuickSwitch(true);
      return;
    }

    // Switch instantané vers l'autre compte
    setSwitchingWorkspace(workspaceId);
    
    // Stocke le workspace cible pour l'appliquer après le switch d'auth
    setPendingWorkspace(workspaceId);

    const result = await instantSwitchToEmail(targetEmail);

    if (!result.ok) {
      setSwitchingWorkspace(null);
      const reason = result.reason;
      const messages: Record<string, string> = {
        no_token: "Connecte-toi d'abord manuellement à ce compte.",
        expired: "Session expirée, reconnecte-toi manuellement.",
        error: "Impossible de changer de compte.",
      };
      toast({
        variant: "destructive",
        title: "Erreur de switch",
        description: messages[reason],
      });
      return;
    }

    // Petit délai pour laisser onAuthStateChange traiter le pending workspace
    setTimeout(() => {
      setSwitchingWorkspace(null);
      window.location.href = "/";
    }, 100);
  };

  const userInitials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  // Notifications nav item with unread count
  const NotificationsNavItem = ({ collapsed: isCollapsed, onClick }: { collapsed: boolean; onClick?: () => void }) => {
    const { unreadCount } = useNotifications();
    const active = location.pathname === "/notifications";

    const content = (
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
          active
            ? "bg-foreground text-background font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <div className="relative">
          <Bell
            className={cn(
              "h-[18px] w-[18px] shrink-0 transition-colors",
              active ? "text-background" : "text-muted-foreground group-hover:text-foreground"
            )}
            strokeWidth={THIN_STROKE}
          />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full text-[9px] font-medium px-0.5",
              active ? "bg-background text-foreground" : "bg-destructive text-destructive-foreground"
            )}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <span className="flex-1 truncate text-left">Notifications</span>
        )}
      </div>
    );

    if (isCollapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink to="/notifications" onClick={onClick}>{content}</NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">
            Notifications
            {unreadCount > 0 && ` (${unreadCount})`}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <NavLink to="/notifications" onClick={onClick}>{content}</NavLink>;
  };

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
          strokeWidth={THIN_STROKE}
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.title}</span>
            {item.isExtension && (
              <LockOpen className={cn(
                "h-3.5 w-3.5 shrink-0",
                active ? "text-background" : "text-muted-foreground"
              )} strokeWidth={THIN_STROKE} />
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
              <LockOpen className="h-3 w-3 text-muted-foreground" strokeWidth={THIN_STROKE} />
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
      {/* Workspace Switcher (top) */}
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
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={THIN_STROKE} />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground font-normal uppercase tracking-wider">
                <Building2 className="h-3 w-3" />
                Mes Workspaces ({workspaces.length})
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceSwitch(workspace.id)}
                  disabled={switchingWorkspace === workspace.id}
                  className={cn(
                    "flex items-center justify-between",
                    workspace.id === activeWorkspace.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {workspace.logo_url ? (
                      <img 
                        src={workspace.logo_url} 
                        alt={workspace.name} 
                        className="h-7 w-7 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-xs font-semibold">
                        {workspace.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{workspace.name}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{workspace.role}</span>
                    </div>
                  </div>
                  {switchingWorkspace === workspace.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  ) : workspace.id === activeWorkspace.id ? (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate("/settings/workspace/new")}
                className="text-muted-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un workspace
              </DropdownMenuItem>
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
            <ChevronLeft className="h-4 w-4" strokeWidth={THIN_STROKE} />
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
            <ChevronLeft className="h-4 w-4 rotate-180" strokeWidth={THIN_STROKE} />
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
        {/* Notifications link at the top */}
        <div className="mb-2">
          <NotificationsNavItem collapsed={collapsed} onClick={onNavigate} />
        </div>
        
        <div className="space-y-1">
          {coreNavigation.map((item) => (
            <NavItemComponent key={item.title} item={item} onClick={onNavigate} />
          ))}
        </div>
        
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
        <ThemeToggle collapsed={collapsed} />
        
        <NavItemComponent 
          item={{ title: "Settings", icon: Settings, href: "/settings" }} 
          onClick={onNavigate} 
        />
        
        {!collapsed && (
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <HelpCircle className="h-[18px] w-[18px]" strokeWidth={THIN_STROKE} />
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
              <Settings className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSwitchAccount}>
              <RefreshCw className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Changer de compte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Account Switch Modal */}
      <QuickAccountSwitch
        open={showQuickSwitch}
        onOpenChange={setShowQuickSwitch}
        currentEmail={user?.email}
      />
    </motion.aside>
  );
}
