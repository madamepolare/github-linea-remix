import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskArchiveView } from "@/components/tasks/TaskArchiveView";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { QuickTasksSection } from "@/components/tasks/QuickTasksSection";

type ViewType = "board" | "list" | "archive";

export default function Tasks() {
  const { view: urlView } = useParams();
  const view = (urlView as ViewType) || "board";
  const [createOpen, setCreateOpen] = useState(false);

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
        {/* Quick Tasks Section */}
        {view !== "archive" && (
          <div className="mb-6">
            <QuickTasksSection />
          </div>
        )}

        {view === "board" && (
          <TaskBoard 
            statusFilter={null} 
            priorityFilter={null}
            onCreateTask={() => setCreateOpen(true)}
          />
        )}
        {view === "list" && (
          <TaskListView />
        )}
        {view === "archive" && <TaskArchiveView />}
      </PageLayout>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
