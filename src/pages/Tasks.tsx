import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskArchiveView } from "@/components/tasks/TaskArchiveView";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Archive, CheckSquare } from "lucide-react";

type ViewType = "board" | "list" | "archive";

export default function Tasks() {
  const [view, setView] = useState<ViewType>("board");
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
        icon={CheckSquare}
        title="Tâches"
        description="Gérez et suivez vos tâches"
        primaryAction={{
          label: "Tâche",
          onClick: () => setCreateOpen(true),
        }}
        actions={
          <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
            <TabsList className="h-9 p-1 bg-muted/50">
              <TabsTrigger value="board" className="h-7 px-2.5 text-xs gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Board</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="h-7 px-2.5 text-xs gap-1.5">
                <List className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Liste</span>
              </TabsTrigger>
              <TabsTrigger value="archive" className="h-7 px-2.5 text-xs gap-1.5">
                <Archive className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Archives</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
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
