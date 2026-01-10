import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInMinutes } from "date-fns";

export interface TaskCommunicationData {
  count: number;
  hasRecent: boolean; // Message within last 5 minutes
}

export function useTaskCommunicationsCounts(taskIds: string[]) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["task-communications-counts", taskIds, activeWorkspace?.id],
    queryFn: async () => {
      if (taskIds.length === 0) return {};

      const now = new Date();

      // Fetch comment counts with created_at
      const { data: commentsData, error: commentsError } = await supabase
        .from("task_comments")
        .select("task_id, created_at")
        .in("task_id", taskIds);

      if (commentsError) throw commentsError;

      // Fetch exchange counts with created_at
      const { data: exchangesData, error: exchangesError } = await supabase
        .from("task_exchanges")
        .select("task_id, created_at")
        .in("task_id", taskIds);

      if (exchangesError) throw exchangesError;

      // Count per task and check for recent messages
      const counts: Record<string, TaskCommunicationData> = {};
      
      taskIds.forEach(id => {
        counts[id] = { count: 0, hasRecent: false };
      });

      commentsData?.forEach(c => {
        if (!counts[c.task_id]) {
          counts[c.task_id] = { count: 0, hasRecent: false };
        }
        counts[c.task_id].count += 1;
        if (c.created_at && differenceInMinutes(now, new Date(c.created_at)) < 5) {
          counts[c.task_id].hasRecent = true;
        }
      });

      exchangesData?.forEach(e => {
        if (!counts[e.task_id]) {
          counts[e.task_id] = { count: 0, hasRecent: false };
        }
        counts[e.task_id].count += 1;
        if (e.created_at && differenceInMinutes(now, new Date(e.created_at)) < 5) {
          counts[e.task_id].hasRecent = true;
        }
      });

      return counts;
    },
    enabled: taskIds.length > 0 && !!activeWorkspace?.id,
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every minute to update "recent" status
  });
}
