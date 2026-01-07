import { useState } from "react";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { ViewSwitcher } from "@/components/ui/view-switcher";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProjectTasksTabProps {
  projectId: string;
}

type ViewType = "board" | "list";

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const [view, setView] = useState<ViewType>("board");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header with view switcher and create button */}
      <div className="flex items-center justify-between">
        <ViewSwitcher
          value={view}
          onChange={(v) => setView(v as ViewType)}
          options={[
            { value: "board", label: "Kanban" },
            { value: "list", label: "Liste" },
          ]}
        />
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Task views */}
      {view === "board" && (
        <TaskBoard
          projectId={projectId}
          statusFilter={null}
          priorityFilter={null}
          onCreateTask={() => setCreateOpen(true)}
        />
      )}
      {view === "list" && (
        <TaskListView projectId={projectId} />
      )}

      {/* Create dialog with project pre-filled */}
      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultProjectId={projectId}
      />
    </div>
  );
}
