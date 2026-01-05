import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskArchiveView } from "@/components/tasks/TaskArchiveView";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { QuickTasksSection } from "@/components/tasks/QuickTasksSection";

type ViewType = "board" | "list" | "archive";

export default function Tasks() {
  const { view: urlView } = useParams();
  const view = (urlView as ViewType) || "board";
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);

  // Listen for command palette event
  useEffect(() => {
    const handleOpen = () => setCreateOpen(true);
    window.addEventListener("open-create-task", handleOpen);
    return () => window.removeEventListener("open-create-task", handleOpen);
  }, []);

  const clearFilters = () => {
    setStatusFilter(null);
    setPriorityFilter(null);
    setAssigneeFilter(null);
  };

  return (
    <>
      <PageLayout
        title="Tâches"
        description="Gérez et suivez vos tâches"
      >
        {/* Filters - only show for non-archive views */}
        {view !== "archive" && (
          <div className="flex justify-end mb-4">
            <TaskFilters
              status={statusFilter}
              priority={priorityFilter}
              assignee={assigneeFilter}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
              onAssigneeChange={setAssigneeFilter}
              onClearAll={clearFilters}
            />
          </div>
        )}

        {/* Quick Tasks Section */}
        {view !== "archive" && (
          <div className="mb-6">
            <QuickTasksSection />
          </div>
        )}

        {view === "board" && (
          <TaskBoard 
            statusFilter={statusFilter} 
            priorityFilter={priorityFilter}
            onCreateTask={() => setCreateOpen(true)}
          />
        )}
        {view === "list" && (
          <TaskListView 
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
          />
        )}
        {view === "archive" && <TaskArchiveView />}
      </PageLayout>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
