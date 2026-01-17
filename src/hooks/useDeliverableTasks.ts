import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DeliverableTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_hours: number | null;
  subtasks?: {
    id: string;
    title: string;
    status: string;
  }[];
}

export function useDeliverableTasks(deliverableId: string | null) {
  return useQuery({
    queryKey: ["deliverable-tasks", deliverableId],
    queryFn: async () => {
      if (!deliverableId) return null;

      // Get the main task linked to this deliverable (parent task)
      const { data: mainTask, error } = await supabase
        .from("tasks")
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          estimated_hours
        `)
        .eq("deliverable_id", deliverableId)
        .is("parent_id", null)
        .maybeSingle();

      if (error) throw error;
      if (!mainTask) return null;

      // Get subtasks of this main task
      const { data: subtasks, error: subtasksError } = await supabase
        .from("tasks")
        .select("id, title, status")
        .eq("parent_id", mainTask.id)
        .order("sort_order", { ascending: true });

      if (subtasksError) throw subtasksError;

      return {
        ...mainTask,
        subtasks: subtasks || [],
      } as DeliverableTask;
    },
    enabled: !!deliverableId,
  });
}

export function useDeliverableTasksCount(deliverableId: string | null) {
  const { data: task, isLoading } = useDeliverableTasks(deliverableId);
  
  if (!task) return { total: 0, completed: 0, isLoading };
  
  const subtasks = task.subtasks || [];
  const completed = subtasks.filter(s => s.status === "done").length;
  
  return {
    total: subtasks.length,
    completed,
    isLoading,
    mainTask: task,
  };
}
