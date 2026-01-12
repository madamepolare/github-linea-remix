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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
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
    const isHovered = hoveredItem === item.href;

    const content = (
      <motion.div
        className={cn(
          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
          "cursor-pointer select-none",
          active
            ? "text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground"
        )}
        onHoverStart={() => setHoveredItem(item.href)}
        onHoverEnd={() => setHoveredItem(null)}
      >
        {/* Background indicator - simple approach without layoutId to avoid gradient glitch */}
        {active && (
          <div className="absolute inset-0 rounded-xl -z-10 bg-foreground" />
        )}
        {!active && isHovered && (
          <div className="absolute inset-0 rounded-xl -z-10 bg-muted/80" />
        )}

        {/* Icon with glow effect when active */}
        <div className="relative">
          <item.icon
            className={cn(
              "h-[18px] w-[18px] shrink-0 transition-all duration-200",
              active 
                ? "text-background" 
                : isHovered 
                  ? "text-foreground" 
                  : "text-muted-foreground"
            )}
            strokeWidth={THIN_STROKE}
          />
          {active && (
            <motion.div
              className="absolute inset-0 blur-sm bg-background/30 rounded-full -z-10"
              initial={{ scale: 0 }}
              animate={{ scale: 1.5 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </div>

        {!collapsed && (
          <span className={cn(
            "flex-1 truncate text-left transition-colors duration-200",
            active ? "text-background" : ""
          )}>
            {item.title}
          </span>
        )}

        {/* Extension indicator */}
        {!collapsed && item.isExtension && (
          <Sparkles className={cn(
            "h-3 w-3 shrink-0 transition-colors",
            active ? "text-background/70" : "text-muted-foreground/50"
          )} strokeWidth={THIN_STROKE} />
        )}
      </motion.div>
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
              <Sparkles className="h-3 w-3 text-muted-foreground" strokeWidth={THIN_STROKE} />
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
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col",
        "bg-gradient-to-b from-background to-background/98",
        "border-r border-border/50"
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-transparent to-transparent pointer-events-none" />

      {/* Workspace Switcher */}
      <div className="relative flex items-center justify-between h-16 px-3 border-b border-border/50">
        {activeWorkspace ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button 
                className="flex flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left transition-all hover:bg-muted/50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Logo with gradient border */}
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-foreground/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  {activeWorkspace.logo_url ? (
                    <img 
                      src={activeWorkspace.logo_url} 
                      alt={activeWorkspace.name} 
                      className="relative h-9 w-9 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background font-semibold text-sm">
                      {activeWorkspace.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {activeWorkspace.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Workspace
                      </p>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={THIN_STROKE} />
                  </>
                )}
              </motion.button>
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
                    "flex items-center justify-between rounded-lg",
                    workspace.id === activeWorkspace.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {workspace.logo_url ? (
                      <img 
                        src={workspace.logo_url} 
                        alt={workspace.name} 
                        className="h-7 w-7 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background text-xs font-semibold">
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
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
            {!collapsed && <div className="h-4 w-24 rounded bg-muted animate-pulse" />}
          </div>
        )}
        
        {/* Collapse toggle */}
        <motion.div
          initial={false}
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={THIN_STROKE} />
          </Button>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {/* Core Navigation */}
        <div className="space-y-1">
          {coreNavigation.map((item) => (
            <NavItemComponent key={item.href} item={item} onClick={onNavigate} />
          ))}
        </div>
        
        {/* Extensions */}
        {extensionNavigation.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border/50">
            {!collapsed && (
              <div className="flex items-center gap-2 px-3 mb-3">
                <Sparkles className="h-3 w-3 text-muted-foreground" strokeWidth={THIN_STROKE} />
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Extensions
                </span>
              </div>
            )}
            <div className="space-y-1">
              {extensionNavigation.map((item) => (
                <NavItemComponent key={item.href} item={item} onClick={onNavigate} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="relative border-t border-border/50 px-3 py-3 space-y-1">
        {/* Settings */}
        <NavItemComponent 
          item={{ title: "Paramètres", icon: Settings, href: "/settings" }} 
          onClick={onNavigate} 
        />
        
        {/* Help */}
        {!collapsed ? (
          <motion.button 
            onClick={() => setShowSupportChat(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <HelpCircle className="h-[18px] w-[18px]" strokeWidth={THIN_STROKE} />
            <span>Aide & Support</span>
          </motion.button>
        ) : (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <motion.button 
                onClick={() => setShowSupportChat(true)}
                className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <HelpCircle className="h-[18px] w-[18px]" strokeWidth={THIN_STROKE} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right">Aide & Support</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* User Profile - Minimal design */}
      <div className="relative border-t border-border/50 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              className={cn(
                "flex w-full items-center gap-3 rounded-xl p-2 transition-all hover:bg-muted/50",
                collapsed && "justify-center"
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {/* Avatar with ring */}
              <div className="relative">
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-foreground/10 to-transparent" />
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || "User"} 
                    className="relative h-9 w-9 rounded-full object-cover ring-2 ring-background"
                  />
                ) : (
                  <div className="relative h-9 w-9 rounded-full bg-foreground flex items-center justify-center text-xs font-medium text-background ring-2 ring-background">
                    {profile?.full_name
                      ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : user?.email?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                )}
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
              </div>
              
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile?.full_name || "Utilisateur"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {profile?.job_title || "En ligne"}
                  </p>
                </div>
              )}
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={collapsed ? "center" : "end"} side="top" className="w-56">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || "User"} 
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center text-sm font-medium text-background">
                    {profile?.full_name
                      ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : user?.email?.slice(0, 2).toUpperCase() || "??"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{profile?.full_name || "Utilisateur"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSwitchAccount}>
              <RefreshCw className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
              Changer de compte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" strokeWidth={THIN_STROKE} />
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
