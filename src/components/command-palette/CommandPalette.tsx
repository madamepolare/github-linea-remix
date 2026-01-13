import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Target,
  Settings,
  Plus,
  Moon,
  Sun,
  LogOut,
  User,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

interface CommandItemType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  group: "navigation" | "actions" | "settings";
}

const typeIcons = {
  task: CheckSquare,
  project: FolderKanban,
  contact: User,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const { data: searchResults, isLoading: isSearching } = useGlobalSearch(search);

  // Toggle dark mode
  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");
    html.classList.toggle("dark", !isDark);
    localStorage.setItem("theme", isDark ? "light" : "dark");
  }, []);

  const commands: CommandItemType[] = [
    // Navigation
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      action: () => navigate("/"),
      keywords: ["home", "accueil", "tableau de bord"],
      group: "navigation",
    },
    {
      id: "tasks",
      label: "Tâches",
      icon: CheckSquare,
      action: () => navigate("/tasks"),
      keywords: ["todo", "task", "taches"],
      group: "navigation",
    },
    {
      id: "projects",
      label: "Projets",
      icon: FolderKanban,
      action: () => navigate("/projects"),
      keywords: ["project", "kanban"],
      group: "navigation",
    },
    {
      id: "crm",
      label: "CRM",
      icon: Target,
      action: () => navigate("/crm"),
      keywords: ["contacts", "leads", "clients", "entreprises"],
      group: "navigation",
    },
    {
      id: "settings",
      label: "Paramètres",
      icon: Settings,
      action: () => navigate("/settings"),
      keywords: ["settings", "config", "configuration"],
      group: "navigation",
    },
    // Actions
    {
      id: "new-task",
      label: "Nouvelle tâche",
      icon: Plus,
      action: () => {
        navigate("/tasks");
        setTimeout(() => window.dispatchEvent(new CustomEvent("open-create-task")), 100);
      },
      keywords: ["create", "add", "nouvelle", "ajouter"],
      group: "actions",
    },
    {
      id: "new-project",
      label: "Nouveau projet",
      icon: Plus,
      action: () => {
        navigate("/projects");
        setTimeout(() => window.dispatchEvent(new CustomEvent("open-create-project")), 100);
      },
      keywords: ["create", "add", "nouvelle", "ajouter"],
      group: "actions",
    },
    // Settings
    {
      id: "toggle-theme",
      label: "Changer le thème",
      icon: document.documentElement.classList.contains("dark") ? Sun : Moon,
      action: toggleTheme,
      keywords: ["dark", "light", "theme", "mode", "sombre", "clair"],
      group: "settings",
    },
    {
      id: "logout",
      label: "Déconnexion",
      icon: LogOut,
      action: () => signOut(),
      keywords: ["logout", "signout", "deconnexion", "quitter"],
      group: "settings",
    },
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const navigationCommands = commands.filter((c) => c.group === "navigation");
  const actionCommands = commands.filter((c) => c.group === "actions");
  const settingsCommands = commands.filter((c) => c.group === "settings");

  const hasSearchResults = searchResults && searchResults.length > 0;
  const showStaticCommands = search.length < 2;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Rechercher tâches, projets, contacts..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            "Aucun résultat trouvé."
          )}
        </CommandEmpty>
        
        {/* Search Results */}
        {hasSearchResults && (
          <>
            <CommandGroup heading="Résultats">
              {searchResults.map((result) => {
                const Icon = typeIcons[result.type];
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.title} ${result.subtitle || ""}`}
                    onSelect={() => runCommand(() => navigate(result.url))}
                  >
                    <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        
        {/* Static Commands (show when no search or search is short) */}
        {showStaticCommands && (
          <>
            <CommandGroup heading="Navigation">
              {navigationCommands.map((command) => (
                <CommandItem
                  key={command.id}
                  value={`${command.label} ${command.keywords?.join(" ") || ""}`}
                  onSelect={() => runCommand(command.action)}
                >
                  <command.icon className="mr-2 h-4 w-4" />
                  <span>{command.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Actions rapides">
              {actionCommands.map((command) => (
                <CommandItem
                  key={command.id}
                  value={`${command.label} ${command.keywords?.join(" ") || ""}`}
                  onSelect={() => runCommand(command.action)}
                >
                  <command.icon className="mr-2 h-4 w-4" />
                  <span>{command.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Paramètres">
              {settingsCommands.map((command) => (
                <CommandItem
                  key={command.id}
                  value={`${command.label} ${command.keywords?.join(" ") || ""}`}
                  onSelect={() => runCommand(command.action)}
                >
                  <command.icon className="mr-2 h-4 w-4" />
                  <span>{command.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
