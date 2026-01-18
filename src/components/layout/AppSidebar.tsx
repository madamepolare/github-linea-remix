import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import {
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronsUpDown,
  HelpCircle,
  LayoutDashboard,
  LucideIcon,
  Plus,
  Check,
  Building2,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
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
import { SupportChatDrawer } from "@/components/support/SupportChatDrawer";

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
  const { user, profile, activeWorkspace, workspaces, signOut, setActiveWorkspace } = useAuth();
  const [showQuickSwitch, setShowQuickSwitch] = useState(false);
  const [switchingWorkspace, setSwitchingWorkspace] = useState<string | null>(null);
  const [showSupportChat, setShowSupportChat] = useState(false);
  
  const canQuickSwitch = useCanQuickSwitch(user?.email);
  const { toast } = useToast();
  
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
      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
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

  // Smart workspace switch
  const handleWorkspaceSwitch = async (workspaceId: string) => {
    const targetWorkspace = workspaces.find(w => w.id === workspaceId);
    if (!targetWorkspace) return;

    if (!isFounderEmail(user?.email)) {
      await setActiveWorkspace(workspaceId);
      return;
    }

    const targetEmail = getEmailForWorkspace(targetWorkspace.slug);

    if (!targetEmail) {
      await setActiveWorkspace(workspaceId);
      return;
    }

    if (targetEmail.toLowerCase() === user?.email?.toLowerCase()) {
      await setActiveWorkspace(workspaceId);
      return;
    }

    if (!hasStoredSessionFor(targetEmail)) {
      toast({
        variant: "destructive",
        title: "Session non disponible",
        description: `Connecte-toi d'abord manuellement à ${targetEmail} pour activer le switch seamless.`,
      });
      setShowQuickSwitch(true);
      return;
    }

    setSwitchingWorkspace(workspaceId);
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

    setTimeout(() => {
      setSwitchingWorkspace(null);
      window.location.href = "/";
    }, 100);
  };

  // Navigation Item Component
  const NavItemComponent = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const active = isActive(item.href, item.moduleSlug);

    const content = (
      <div
        className={cn(
          "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
          "cursor-pointer select-none",
          active
            ? "bg-foreground/5 text-foreground font-semibold"
            : "text-foreground/80 font-medium hover:bg-muted/50 hover:text-foreground"
        )}
      >
        {/* Active indicator */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-foreground rounded-full" />
        )}
        
        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            active ? "text-foreground" : "text-foreground/60"
          )}
          strokeWidth={1.75}
        />

        {!collapsed && (
          <span className="flex-1 truncate text-left">
            {item.title}
          </span>
        )}

        {/* Extension indicator */}
        {!collapsed && item.isExtension && (
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
            active 
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
              : "bg-muted text-muted-foreground"
          )}>
            Ext
          </span>
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
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                Ext
              </span>
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
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col",
        "bg-background",
        "border-r border-border/40"
      )}
    >
      {/* Workspace Switcher */}
      <div className="relative flex items-center justify-between h-14 px-3 border-b border-border/40">
        {activeWorkspace ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="flex flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
              >
                {/* Logo */}
                {activeWorkspace.logo_url ? (
                  <img 
                    src={activeWorkspace.logo_url} 
                    alt={activeWorkspace.name} 
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-foreground font-medium text-sm">
                    {activeWorkspace.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                
                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activeWorkspace.name}
                      </p>
                    </div>
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" strokeWidth={THIN_STROKE} />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Workspaces
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceSwitch(workspace.id)}
                  disabled={switchingWorkspace === workspace.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg",
                    workspace.id === activeWorkspace.id && "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {workspace.logo_url ? (
                      <img 
                        src={workspace.logo_url} 
                        alt={workspace.name} 
                        className="h-6 w-6 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground/5 text-xs font-medium">
                        {workspace.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm">{workspace.name}</span>
                  </div>
                  {switchingWorkspace === workspace.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                  ) : workspace.id === activeWorkspace.id ? (
                    <Check className="h-3.5 w-3.5 text-foreground shrink-0" />
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => navigate("/settings/workspace/new")}
                className="text-muted-foreground"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Nouveau workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
            {!collapsed && <div className="h-4 w-20 rounded bg-muted animate-pulse" />}
          </div>
        )}
        
        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={THIN_STROKE} />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={THIN_STROKE} />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 scrollbar-thin">
        {/* Core Navigation */}
        <div className="space-y-0.5">
          {coreNavigation.map((item) => (
            <NavItemComponent key={item.href} item={item} onClick={onNavigate} />
          ))}
        </div>
        
        {/* Extensions */}
        {extensionNavigation.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/40">
            {!collapsed && (
              <div className="flex items-center gap-1.5 px-3 mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  Extensions
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              {extensionNavigation.map((item) => (
                <NavItemComponent key={item.href} item={item} onClick={onNavigate} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="relative border-t border-border/40 px-2.5 py-2 space-y-0.5">
        {/* Settings */}
        <NavItemComponent 
          item={{ title: "Paramètres", icon: Settings, href: "/settings" }} 
          onClick={onNavigate} 
        />
        
        {/* Help */}
        {!collapsed ? (
          <button 
            onClick={() => setShowSupportChat(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/80 font-medium transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <HelpCircle className="h-[18px] w-[18px] text-foreground/60" strokeWidth={1.75} />
            <span>Aide & Support</span>
          </button>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button 
                onClick={() => setShowSupportChat(true)}
                className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <HelpCircle className="h-[18px] w-[18px] text-muted-foreground/70" strokeWidth={THIN_STROKE} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Aide & Support</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* User Profile */}
      <div className="relative border-t border-border/40 p-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted/50",
                collapsed && "justify-center"
              )}
            >
              {/* Avatar */}
              <div className="relative">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || "User"} 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-foreground/5 flex items-center justify-center text-xs font-medium text-foreground">
                    {profile?.full_name
                      ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : user?.email?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                )}
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile?.full_name || "Utilisateur"}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70 truncate">
                    {profile?.job_title || "En ligne"}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={collapsed ? "center" : "end"} side="top" className="w-52">
            <DropdownMenuLabel>
              <div className="flex items-center gap-2.5">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || "User"} 
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-foreground/5 flex items-center justify-center text-sm font-medium text-foreground">
                    {profile?.full_name
                      ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : user?.email?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{profile?.full_name || "Utilisateur"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <User className="h-3.5 w-3.5 mr-2" strokeWidth={THIN_STROKE} />
              Mon Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-3.5 w-3.5 mr-2" strokeWidth={THIN_STROKE} />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSwitchAccount}>
              <RefreshCw className="h-3.5 w-3.5 mr-2" strokeWidth={THIN_STROKE} />
              Changer de compte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-3.5 w-3.5 mr-2" strokeWidth={THIN_STROKE} />
              Déconnexion
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

      {/* Support Chat Drawer */}
      <SupportChatDrawer
        open={showSupportChat}
        onClose={() => setShowSupportChat(false)}
      />
    </motion.aside>
  );
}
