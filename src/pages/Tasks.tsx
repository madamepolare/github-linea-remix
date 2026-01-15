import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskArchiveView } from "@/components/tasks/TaskArchiveView";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";

type ViewType = "board" | "list" | "archive";

export default function Tasks() {
  const location = useLocation();
  // Extract view from pathname: /tasks/list -> list, /tasks/board -> board, etc.
  const pathSegments = location.pathname.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];
  const view: ViewType = (lastSegment === "list" || lastSegment === "archive") ? lastSegment : "board";
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
