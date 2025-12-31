import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskArchiveView } from "@/components/tasks/TaskArchiveView";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, Plus, Calendar, Archive } from "lucide-react";

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Tâches</h1>
            <p className="text-muted-foreground">Gérez et suivez vos tâches</p>
          </div>

          <div className="flex items-center gap-3">
            <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
              <TabsList>
                <TabsTrigger value="board" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Tableau</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Liste</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendrier</span>
                </TabsTrigger>
                <TabsTrigger value="archive" className="gap-2">
                  <Archive className="h-4 w-4" />
                  <span className="hidden sm:inline">Archives</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle tâche
            </Button>
          </div>
        </div>

        {/* Filters */}
        {view !== "archive" && (
          <TaskFilters
            status={statusFilter}
            priority={priorityFilter}
            assignee={assigneeFilter}
            onStatusChange={setStatusFilter}
            onPriorityChange={setPriorityFilter}
            onAssigneeChange={setAssigneeFilter}
            onClearAll={clearFilters}
          />
        )}

        {/* Content */}
        <div className="min-h-[600px]">
          {view === "board" && (
            <TaskBoard statusFilter={statusFilter} priorityFilter={priorityFilter} />
          )}
          {view === "list" && <TaskListView />}
          {view === "archive" && <TaskArchiveView />}
          {view === "calendar" && (
            <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/20">
              <p className="text-muted-foreground">Vue calendrier à venir...</p>
            </div>
          )}
        </div>
      </div>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </MainLayout>
  );
}
