import { GenericSettingsManager } from "./GenericSettingsManager";
import { Tag, AlertCircle, CheckCircle } from "lucide-react";

// Default task tags
const DEFAULT_TASK_TAGS = [
  { key: "urgent", label: "Urgent", color: "#EF4444" },
  { key: "bug", label: "Bug", color: "#F97316" },
  { key: "feature", label: "Fonctionnalité", color: "#8B5CF6" },
  { key: "design", label: "Design", color: "#EC4899" },
  { key: "review", label: "Review", color: "#3B82F6" },
  { key: "documentation", label: "Documentation", color: "#06B6D4" },
  { key: "meeting", label: "Réunion", color: "#10B981" },
  { key: "client", label: "Client", color: "#F59E0B" },
];

// Default task statuses
const DEFAULT_TASK_STATUSES = [
  { key: "todo", label: "À faire", color: "#6B7280" },
  { key: "in_progress", label: "En cours", color: "#3B82F6" },
  { key: "review", label: "En revue", color: "#F59E0B" },
  { key: "done", label: "Terminé", color: "#10B981" },
  { key: "blocked", label: "Bloqué", color: "#EF4444" },
];

// Default task priorities
const DEFAULT_TASK_PRIORITIES = [
  { key: "low", label: "Basse", color: "#6B7280" },
  { key: "medium", label: "Moyenne", color: "#3B82F6" },
  { key: "high", label: "Haute", color: "#F59E0B" },
  { key: "urgent", label: "Urgente", color: "#EF4444" },
];

export function TasksSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Paramètres des tâches</h3>
        <p className="text-sm text-muted-foreground">
          Personnalisez les statuts, priorités et tags pour vos tâches
        </p>
      </div>

      <div className="space-y-6">
        <GenericSettingsManager
          settingType="tags"
          title="Tags"
          description="Étiquettes pour catégoriser vos tâches"
          icon={<Tag className="h-5 w-5 text-primary" />}
          showColor
          defaultItems={DEFAULT_TASK_TAGS}
        />

        <GenericSettingsManager
          settingType="task_statuses"
          title="Statuts de tâche"
          description="États possibles pour vos tâches"
          icon={<CheckCircle className="h-5 w-5 text-primary" />}
          showColor
          defaultItems={DEFAULT_TASK_STATUSES}
        />

        <GenericSettingsManager
          settingType="task_priorities"
          title="Priorités"
          description="Niveaux de priorité pour vos tâches"
          icon={<AlertCircle className="h-5 w-5 text-primary" />}
          showColor
          defaultItems={DEFAULT_TASK_PRIORITIES}
        />
      </div>
    </div>
  );
}
