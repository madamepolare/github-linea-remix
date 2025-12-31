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
  Search,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  group: "navigation" | "actions" | "settings";
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  // Toggle dark mode
  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const isDark = html.classList.contains("dark");
    html.classList.toggle("dark", !isDark);
    localStorage.setItem("theme", isDark ? "light" : "dark");
  }, []);

  const commands: CommandItem[] = [
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
        // Dispatch custom event to open create dialog
        window.dispatchEvent(new CustomEvent("open-create-task"));
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
        window.dispatchEvent(new CustomEvent("open-create-project"));
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

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const navigationCommands = commands.filter((c) => c.group === "navigation");
  const actionCommands = commands.filter((c) => c.group === "actions");
  const settingsCommands = commands.filter((c) => c.group === "settings");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher une commande..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        
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
      </CommandList>
    </CommandDialog>
  );
}
