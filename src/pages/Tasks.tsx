import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskArchiveView } from "@/components/tasks/TaskArchiveView";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskEntityTabs } from "@/components/tasks/TaskEntityTabs";
import { QuickTasksSection } from "@/components/tasks/QuickTasksSection";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Calendar, Archive, CheckSquare, Plus } from "lucide-react";

type ViewType = "board" | "list" | "calendar" | "archive";

export default function Tasks() {
  const [view, setView] = useState<ViewType>("board");
  const [createOpen, setCreateOpen] = useState(false);
  const [entityFilter, setEntityFilter] = useState("all");
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
              <TabsTrigger value="archive" className="h-7 px-2.5 text-xs gap-1.5">
                <Archive className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Archives</span>
              </TabsTrigger>
              <TabsTrigger value="board" className="h-7 px-2.5 text-xs gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Board</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="h-7 px-2.5 text-xs gap-1.5">
                <List className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Liste</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="h-7 px-2.5 text-xs gap-1.5">
                <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        {/* Quick Tasks Section */}
        {view !== "archive" && (
          <div className="mb-6">
            <QuickTasksSection />
          </div>
        )}

        {/* Entity Tabs + Filters */}
        {view !== "archive" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <TaskEntityTabs value={entityFilter} onChange={setEntityFilter} />
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
            entityFilter={entityFilter}
            onCreateTask={() => setCreateOpen(true)}
          />
        )}
        {view === "list" && (
          <TaskListView 
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            entityFilter={entityFilter}
          />
        )}
        {view === "archive" && <TaskArchiveView />}
        {view === "calendar" && (
          <div className="flex items-center justify-center h-96 border border-dashed border-border rounded-lg bg-muted/20">
            <p className="text-sm text-muted-foreground">Vue timeline à venir...</p>
          </div>
        )}
      </PageLayout>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
