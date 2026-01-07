import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to get the set of task IDs that have at least one schedule
 * Used to display "Planifié" badges in task views
 */
export function useScheduledTaskIds() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["scheduled-task-ids", activeWorkspace?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_schedules")
        .select("task_id")
        .eq("workspace_id", activeWorkspace!.id);

      if (error) throw error;

      // Return as a Set for O(1) lookup
      const taskIds = new Set<string>();
      data?.forEach((schedule) => {
        if (schedule.task_id) {
          taskIds.add(schedule.task_id);
        }
      });

      return taskIds;
    },
    enabled: !!activeWorkspace?.id,
  });
}

/**
 * Check if a specific task is scheduled
 */
export function useIsTaskScheduled(taskId: string | null) {
  const { data: scheduledIds } = useScheduledTaskIds();
  
  if (!taskId || !scheduledIds) return false;
  return scheduledIds.has(taskId);
}
