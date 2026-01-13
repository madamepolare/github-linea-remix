import { useWorkspaceNavigation } from "@/hooks/useWorkspaceNavigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  client: string;
  phase: string;
  progress: number;
  dueDate: Date;
}

// Mock data
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Villa Moderne",
    client: "M. Dupont",
    phase: "APD",
    progress: 65,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  },
  {
    id: "2",
    name: "Résidence Étoile",
    client: "SCI Immobilier",
    phase: "PRO",
    progress: 40,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
  },
  {
    id: "3",
    name: "Bureau Central",
    client: "Entreprise ABC",
    phase: "EXE",
    progress: 85,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
  },
  {
    id: "4",
    name: "Loft Bastille",
    client: "Mme Martin",
    phase: "ESQ",
    progress: 20,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
  },
];

const phaseColors: Record<string, string> = {
  ESQ: "bg-info/10 text-info",
  APS: "bg-accent/10 text-accent",
  APD: "bg-warning/10 text-warning",
  PRO: "bg-success/10 text-success",
  EXE: "bg-primary/10 text-primary",
  AOR: "bg-muted text-muted-foreground",
};

export function ActiveProjectsWidget() {
  const { navigate } = useWorkspaceNavigation();

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3">
        {mockProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => navigate(`/projects/${project.id}`)}
            className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate">{project.name}</h4>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium",
                      phaseColors[project.phase] || "bg-muted text-muted-foreground"
                    )}
                  >
                    {project.phase}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {project.client}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-1.5" />
            </div>

            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Échéance : {format(project.dueDate, "d MMM yyyy", { locale: fr })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
