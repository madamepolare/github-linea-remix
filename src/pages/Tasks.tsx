import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskArchiveView } from "@/components/tasks/TaskArchiveView";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { TaskFiltersBar } from "@/components/tasks/TaskFiltersBar";
import { defaultTaskFilters, TaskFiltersState } from "@/hooks/useTaskFilters";
import { useTasks } from "@/hooks/useTasks";
import { useScheduledTaskIds } from "@/hooks/useScheduledTaskIds";

type ViewType = "board" | "list" | "archive";

export default function Tasks() {
  const location = useLocation();
  // Extract view from pathname: /tasks/list -> list, /tasks/board -> board, etc.
  const pathSegments = location.pathname.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];
  const view: ViewType = (lastSegment === "list" || lastSegment === "archive") ? lastSegment : "board";
  const [createOpen, setCreateOpen] = useState(false);

  // Unified filters state at page level
  const [filters, setFilters] = useState<TaskFiltersState>(defaultTaskFilters);
  
  // Get tasks for extracting available tags
  const { tasks } = useTasks();
  const { data: scheduledTaskIds } = useScheduledTaskIds();
  
  // Extract available tags from tasks
  const availableTags = tasks?.reduce((tags, task) => {
    task.tags?.forEach(tag => tags.add(tag));
    return tags;
  }, new Set<string>()) || new Set<string>();

  // Listen for command palette event
  useEffect(() => {
    const handleOpen = () => setCreateOpen(true);
    window.addEventListener("open-create-task", handleOpen);
    return () => window.removeEventListener("open-create-task", handleOpen);
  }, []);

  return (
    <>
      <PageLayout
        title="Tâches"
        description="Gérez et suivez vos tâches"
      >
        {/* Unified filters bar (shown for board and list views, not archive) */}
        {view !== "archive" && (
          <TaskFiltersBar
            filters={filters}
            onChange={setFilters}
            availableTags={Array.from(availableTags)}
          />
        )}

        {view === "board" && (
          <TaskBoard 
            statusFilter={null} 
            priorityFilter={null}
            onCreateTask={() => setCreateOpen(true)}
            externalFilters={filters}
            onExternalFiltersChange={setFilters}
          />
        )}
        {view === "list" && (
          <TaskListView 
            externalFilters={filters}
            onExternalFiltersChange={setFilters}
          />
        )}
        {view === "archive" && <TaskArchiveView />}
      </PageLayout>

      <TaskDetailSheet 
        task={null} 
        open={createOpen} 
        onOpenChange={setCreateOpen}
        isCreateMode={true}
      />
    </>
  );
}
