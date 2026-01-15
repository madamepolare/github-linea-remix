import { ComponentShowcase } from "../../ComponentShowcase";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderKanban } from "lucide-react";

export function ProjectsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">37+ composants</Badge>
        <Badge variant="secondary">src/components/projects/</Badge>
      </div>
      
      <ComponentShowcase
        name="Project Card"
        description="Carte projet pour les listes"
        filePath="src/components/projects/ProjectCard.tsx"
      >
        <div className="p-4 border rounded-lg bg-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-accent/10 flex items-center justify-center">
              <FolderKanban className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="font-medium text-sm">Rénovation Villa</p>
              <p className="text-xs text-muted-foreground">Client: Dupont</p>
            </div>
          </div>
          <Progress value={65} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Phase: DCE</span>
            <span>65%</span>
          </div>
        </div>
      </ComponentShowcase>

      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Composants Projets disponibles:</p>
        <ul className="grid grid-cols-2 gap-1 text-xs">
          <li>• ProjectBoard</li>
          <li>• PhaseGanttTimeline</li>
          <li>• ChantierDashboard</li>
          <li>• ProjectPhasesTab</li>
          <li>• ProjectBudgetTab</li>
          <li>• MeetingReportBuilder</li>
        </ul>
      </div>
    </div>
  );
}
