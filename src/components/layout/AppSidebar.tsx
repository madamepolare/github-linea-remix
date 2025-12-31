import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  Calendar,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronDown,
  Search,
  Bell,
  LogOut,
  ChevronsUpDown,
  HelpCircle,
} from "lucide-react";
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

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  children?: { title: string; href: string }[];
}

const navigation: NavItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/" },
  { title: "Projects", icon: FolderKanban, href: "/projects" },
  { title: "Tasks", icon: CheckSquare, href: "/tasks" },
  { title: "CRM", icon: Users, href: "/crm" },
  { title: "Planning", icon: Calendar, href: "/planning" },
  { title: "Time Tracking", icon: Clock, href: "/time" },
  { title: "Finance", icon: Receipt, href: "/finance" },
];

const bottomNavigation: NavItem[] = [
  { title: "Settings", icon: Settings, href: "/settings" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, activeWorkspace, workspaces, signOut, setActiveWorkspace } = useAuth();

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
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

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);

    const content = (
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
        )}
      >
        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            active ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground/80"
          )}
        />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.title}</span>
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-sidebar-muted transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            )}
          </>
        )}
      </div>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink to={item.href}>{content}</NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.title}
            {item.badge && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (hasChildren) {
      return (
        <div>
          <button
            onClick={() => toggleExpanded(item.title)}
            className="w-full"
          >
            {content}
          </button>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="ml-7 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                  {item.children?.map((child) => (
                    <NavLink
                      key={child.href}
                      to={child.href}
                      className={cn(
                        "block rounded-md px-3 py-1.5 text-sm transition-colors",
                        location.pathname === child.href
                          ? "text-sidebar-primary font-medium"
                          : "text-sidebar-muted hover:text-sidebar-foreground"
                      )}
                    >
                      {child.title}
                    </NavLink>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return <NavLink to={item.href}>{content}</NavLink>;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar border-r border-sidebar-border"
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-3">
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <span className="text-background text-sm font-bold">A</span>
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-base font-semibold text-sidebar-foreground tracking-tight"
            >
              ARCHIMIND
            </motion.span>
          )}
        </NavLink>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-150",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Workspace Switcher */}
      {!collapsed && activeWorkspace && (
        <div className="px-3 pb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-sidebar-accent">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-foreground font-medium text-xs">
                  {activeWorkspace.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {activeWorkspace.name}
                  </p>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-sidebar-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal uppercase tracking-wide">Workspaces</DropdownMenuLabel>
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
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium text-foreground">
                      {workspace.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm">{workspace.name}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <Search className="h-4 w-4" />
            <span>Search...</span>
            <kbd className="ml-auto text-2xs font-mono text-sidebar-muted bg-sidebar-accent rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        <div className="space-y-0.5">
          {navigation.map((item) => (
            <NavItemComponent key={item.title} item={item} />
          ))}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-sidebar-border px-2 py-2">
        {bottomNavigation.map((item) => (
          <NavItemComponent key={item.title} item={item} />
        ))}
        
        {!collapsed && (
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <HelpCircle className="h-[18px] w-[18px]" />
            <span>Need Help?</span>
          </button>
        )}
      </div>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-sidebar-accent cursor-pointer",
                collapsed && "justify-center px-0"
              )}
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground">
                {userInitials}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {profile?.full_name || "User"}
                    </p>
                    <p className="text-xs text-sidebar-muted truncate">
                      {profile?.job_title || user?.email}
                    </p>
                  </div>
                  <Bell className="h-4 w-4 shrink-0 text-sidebar-muted" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium text-sm">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}
