import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UsageStats {
  usage_type: string;
  service_name: string;
  call_count: number;
  total_tokens: number;
  total_credits: number;
  month: string;
}

interface UsageSummary {
  ai_credits: {
    total_calls: number;
    total_tokens: number;
    total_credits: number;
    by_service: Record<string, { calls: number; tokens: number; credits: number }>;
  };
  api_calls: {
    total_calls: number;
    by_service: Record<string, number>;
  };
  current_month: string;
}

export function useWorkspaceUsage() {
  const { activeWorkspace } = useAuth();

  const { data: usageStats, isLoading } = useQuery({
    queryKey: ["workspace-usage", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;

      // Get current month's usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("workspace_usage_logs")
        .select("usage_type, service_name, tokens_used, credits_used, created_at")
        .eq("workspace_id", activeWorkspace.id)
        .gte("created_at", startOfMonth.toISOString());

      if (error) {
        console.error("Error fetching usage stats:", error);
        return null;
      }

      // Aggregate the data
      const summary: UsageSummary = {
        ai_credits: {
          total_calls: 0,
          total_tokens: 0,
          total_credits: 0,
          by_service: {},
        },
        api_calls: {
          total_calls: 0,
          by_service: {},
        },
        current_month: startOfMonth.toLocaleString("fr-FR", { month: "long", year: "numeric" }),
      };

      data?.forEach((log) => {
        if (log.usage_type === "ai_credits") {
          summary.ai_credits.total_calls++;
          summary.ai_credits.total_tokens += log.tokens_used || 0;
          summary.ai_credits.total_credits += Number(log.credits_used) || 0;

          if (!summary.ai_credits.by_service[log.service_name]) {
            summary.ai_credits.by_service[log.service_name] = { calls: 0, tokens: 0, credits: 0 };
          }
          summary.ai_credits.by_service[log.service_name].calls++;
          summary.ai_credits.by_service[log.service_name].tokens += log.tokens_used || 0;
          summary.ai_credits.by_service[log.service_name].credits += Number(log.credits_used) || 0;
        } else if (log.usage_type === "api_call") {
          summary.api_calls.total_calls++;
          summary.api_calls.by_service[log.service_name] = 
            (summary.api_calls.by_service[log.service_name] || 0) + 1;
        }
      });

      return summary;
    },
    enabled: !!activeWorkspace?.id,
  });

  return {
    usageStats,
    isLoading,
  };
}

// Hook to log usage (to be used in edge functions or frontend)
export async function logWorkspaceUsage(params: {
  workspaceId: string;
  userId?: string;
  usageType: "ai_credits" | "api_call" | "storage";
  serviceName: string;
  tokensUsed?: number;
  creditsUsed?: number;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("workspace_usage_logs").insert([{
    workspace_id: params.workspaceId,
    user_id: params.userId,
    usage_type: params.usageType,
    service_name: params.serviceName,
    tokens_used: params.tokensUsed || 0,
    credits_used: params.creditsUsed || 0,
    metadata: (params.metadata || {}) as Record<string, string | number | boolean>,
  }]);

  if (error) {
    console.error("Error logging usage:", error);
  }

  return { error };
}
