import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTasks, Task } from "@/hooks/useTasks";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { Loader2 } from "lucide-react";

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tasks, isLoading } = useTasks();
  
  const [task, setTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Get default tab from URL params (e.g., ?tab=comments)
  const defaultTab = searchParams.get("tab") || "details";

  useEffect(() => {
    if (!isLoading && tasks && taskId) {
      const foundTask = tasks.find(t => t.id === taskId);
      if (foundTask) {
        setTask(foundTask);
        setSheetOpen(true);
      } else {
        // Task not found, redirect to tasks page
        navigate("/tasks", { replace: true });
      }
    }
  }, [tasks, taskId, isLoading, navigate]);

  const handleSheetClose = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      // Navigate back to tasks when sheet is closed
      navigate("/tasks", { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TaskDetailSheet
      task={task}
      open={sheetOpen}
      onOpenChange={handleSheetClose}
      defaultTab={defaultTab}
    />
  );
}
