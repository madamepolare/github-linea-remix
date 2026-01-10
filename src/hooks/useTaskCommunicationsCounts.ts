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

      // Unified communications table (used by EntityCommunications)
      const { data, error } = await supabase
        .from("communications")
        .select("entity_id, created_at")
        .eq("entity_type", "task")
        .in("entity_id", taskIds);

      if (error) throw error;

      // Count per task and check for recent messages
      const counts: Record<string, TaskCommunicationData> = {};

      taskIds.forEach((id) => {
        counts[id] = { count: 0, hasRecent: false };
      });

      data?.forEach((row) => {
        const taskId = row.entity_id as string;
        if (!counts[taskId]) counts[taskId] = { count: 0, hasRecent: false };
        counts[taskId].count += 1;
        if (row.created_at && differenceInMinutes(now, new Date(row.created_at)) < 5) {
          counts[taskId].hasRecent = true;
        }
      });

      return counts;
    },
    enabled: taskIds.length > 0 && !!activeWorkspace?.id,
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every minute to update "recent" status
  });
}
