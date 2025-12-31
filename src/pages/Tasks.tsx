import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskArchiveView } from "@/components/tasks/TaskArchiveView";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Calendar, Archive, CheckSquare } from "lucide-react";

type ViewType = "board" | "list" | "calendar" | "archive";

export default function Tasks() {
  const [view, setView] = useState<ViewType>("board");
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);

  const clearFilters = () => {
    setStatusFilter(null);
    setPriorityFilter(null);
    setAssigneeFilter(null);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <PageHeader
          icon={CheckSquare}
          title="Tâches"
          description="Gérez et suivez vos tâches"
          primaryAction={{
            label: "Nouveau",
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
                <TabsTrigger value="calendar" className="h-7 px-2.5 text-xs gap-1.5">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Cal</span>
                </TabsTrigger>
                <TabsTrigger value="archive" className="h-7 px-2.5 text-xs gap-1.5">
                  <Archive className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Arch</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
          filters={
            view !== "archive" ? (
              <TaskFilters
                status={statusFilter}
                priority={priorityFilter}
                assignee={assigneeFilter}
                onStatusChange={setStatusFilter}
                onPriorityChange={setPriorityFilter}
                onAssigneeChange={setAssigneeFilter}
                onClearAll={clearFilters}
              />
            ) : undefined
          }
        />

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {view === "board" && (
            <TaskBoard statusFilter={statusFilter} priorityFilter={priorityFilter} />
          )}
          {view === "list" && <TaskListView />}
          {view === "archive" && <TaskArchiveView />}
          {view === "calendar" && (
            <div className="flex items-center justify-center h-96 border border-dashed border-border rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground">Vue calendrier à venir...</p>
            </div>
          )}
        </div>
      </div>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </MainLayout>
  );
}
