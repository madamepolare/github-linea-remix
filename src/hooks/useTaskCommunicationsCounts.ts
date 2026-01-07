import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTaskCommunicationsCounts(taskIds: string[]) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["task-communications-counts", taskIds, activeWorkspace?.id],
    queryFn: async () => {
      if (taskIds.length === 0) return {};

      // Fetch comment counts
      const { data: commentsData, error: commentsError } = await supabase
        .from("task_comments")
        .select("task_id")
        .in("task_id", taskIds);

      if (commentsError) throw commentsError;

      // Fetch exchange counts
      const { data: exchangesData, error: exchangesError } = await supabase
        .from("task_exchanges")
        .select("task_id")
        .in("task_id", taskIds);

      if (exchangesError) throw exchangesError;

      // Count per task
      const counts: Record<string, number> = {};
      
      taskIds.forEach(id => {
        counts[id] = 0;
      });

      commentsData?.forEach(c => {
        counts[c.task_id] = (counts[c.task_id] || 0) + 1;
      });

      exchangesData?.forEach(e => {
        counts[e.task_id] = (counts[e.task_id] || 0) + 1;
      });

      return counts;
    },
    enabled: taskIds.length > 0 && !!activeWorkspace?.id,
    staleTime: 30000, // Cache for 30 seconds
  });
}
