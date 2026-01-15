import { ComponentStyleEditor } from "../../ComponentStyleEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckSquare, MoreHorizontal, Calendar, Clock, AlertTriangle, Flag, MessageSquare, Paperclip } from "lucide-react";

export function TasksSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">23+ composants</Badge>
        <Badge variant="secondary">src/components/tasks/</Badge>
      </div>
      
      <ComponentStyleEditor
        componentName="Task Card"
        description="Carte tâche pour le kanban et les listes"
        filePath="src/components/tasks/TaskCard.tsx"
        usedIn={["TaskBoard", "TaskListView", "ProjectTasksTab"]}
        properties={[
          { id: "destructive", label: "Urgent Color", type: "color", cssVariable: "--destructive" },
          { id: "warning", label: "High Priority", type: "color", cssVariable: "--warning" },
        ]}
      >
        <div className="task-card max-w-xs">
          <div className="flex items-start gap-2">
            <Checkbox className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Finaliser les plans d'exécution</p>
              <p className="text-xs text-muted-foreground mt-1">Projet: Villa Dupont</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-2 border-t">
            <Badge variant="destructive" className="text-xs gap-1">
              <Flag className="h-3 w-3" />
              Urgent
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Demain
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                3
              </div>
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                2
              </div>
            </div>
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">JD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Task Row"
        description="Ligne de tâche pour les vues liste"
        filePath="src/components/tasks/TaskListRow.tsx"
        usedIn={["TaskListView", "ProjectTasksTab"]}
        properties={[]}
      >
        <div className="space-y-1">
          {[
            { title: "Réunion client", priority: "high", due: "Aujourd'hui" },
            { title: "Revue des plans", priority: "normal", due: "Demain" },
            { title: "Mise à jour budget", priority: "low", due: "Lun 20" },
          ].map((task) => (
            <div key={task.title} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg">
              <Checkbox />
              <span className="flex-1 text-sm">{task.title}</span>
              <Badge 
                variant={task.priority === "high" ? "destructive" : "secondary"}
                className="text-xs"
              >
                {task.priority === "high" ? "Haute" : task.priority === "normal" ? "Normale" : "Basse"}
              </Badge>
              <span className="text-xs text-muted-foreground w-20">{task.due}</span>
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs">JD</AvatarFallback>
              </Avatar>
            </div>
          ))}
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Kanban Column"
        description="Colonne de kanban pour les tâches"
        filePath="src/components/tasks/TaskBoard.tsx"
        usedIn={["TaskBoard"]}
        properties={[]}
      >
        <div className="flex gap-3">
          <div className="w-64 kanban-column">
            <div className="kanban-column-header">
              <span className="font-medium text-sm">À faire</span>
              <Badge variant="secondary" className="text-xs">3</Badge>
            </div>
            <div className="p-2 space-y-2">
              <div className="task-card text-sm">
                <p className="font-medium">Tâche exemple 1</p>
                <Badge variant="secondary" className="text-xs mt-2">Normal</Badge>
              </div>
              <div className="task-card text-sm">
                <p className="font-medium">Tâche exemple 2</p>
                <Badge variant="destructive" className="text-xs mt-2">Urgent</Badge>
              </div>
            </div>
          </div>
          <div className="w-64 kanban-column">
            <div className="kanban-column-header">
              <span className="font-medium text-sm">En cours</span>
              <Badge variant="secondary" className="text-xs">2</Badge>
            </div>
            <div className="p-2 space-y-2">
              <div className="task-card text-sm border-l-2 border-l-info">
                <p className="font-medium">Tâche en cours</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  2h30
                </div>
              </div>
            </div>
          </div>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Subtasks Manager"
        description="Gestion des sous-tâches"
        filePath="src/components/tasks/SubtasksManager.tsx"
        usedIn={["TaskDetailSheet", "TaskDetailModal"]}
        properties={[]}
      >
        <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Sous-tâches</span>
            <span className="text-xs text-muted-foreground">2/4</span>
          </div>
          {[
            { title: "Vérifier les mesures", done: true },
            { title: "Corriger le plan RDC", done: true },
            { title: "Ajouter les cotes", done: false },
            { title: "Export PDF", done: false },
          ].map((subtask) => (
            <div key={subtask.title} className="flex items-center gap-2">
              <Checkbox checked={subtask.done} />
              <span className={`text-sm ${subtask.done ? "line-through text-muted-foreground" : ""}`}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      </ComponentStyleEditor>

      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Autres composants Tâches:</p>
        <ul className="grid grid-cols-2 gap-1 text-xs">
          <li>• TaskBoard</li>
          <li>• TaskDetailSheet</li>
          <li>• TaskListView</li>
          <li>• SubtasksManager</li>
          <li>• TaskTimeTracker</li>
          <li>• TaskFilters</li>
          <li>• CreateTaskDialog</li>
          <li>• QuickTaskRow</li>
          <li>• TaskCommunications</li>
          <li>• MultiAssigneePicker</li>
        </ul>
      </div>
    </div>
  );
}
