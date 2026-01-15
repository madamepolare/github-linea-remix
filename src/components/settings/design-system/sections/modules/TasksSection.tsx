import { ComponentShowcase } from "../../ComponentShowcase";
import { Badge } from "@/components/ui/badge";
import { CheckSquare } from "lucide-react";

export function TasksSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">23+ composants</Badge>
        <Badge variant="secondary">src/components/tasks/</Badge>
      </div>
      
      <ComponentShowcase
        name="Task Card"
        description="Carte tâche pour le kanban"
        filePath="src/components/tasks/TaskCard.tsx"
      >
        <div className="p-3 border rounded-lg bg-card space-y-2">
          <div className="flex items-start gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Finaliser les plans</p>
              <p className="text-xs text-muted-foreground">Projet: Villa Dupont</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">Urgent</Badge>
            <span className="text-xs text-muted-foreground">Échéance: Demain</span>
          </div>
        </div>
      </ComponentShowcase>

      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Composants Tâches disponibles:</p>
        <ul className="grid grid-cols-2 gap-1 text-xs">
          <li>• TaskBoard</li>
          <li>• TaskDetailSheet</li>
          <li>• TaskListView</li>
          <li>• SubtasksManager</li>
          <li>• TaskTimeTracker</li>
        </ul>
      </div>
    </div>
  );
}
