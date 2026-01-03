import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  activeProjects: number;
  activeProjectsChange: number;
  pendingInvoices: number;
  pendingInvoicesAmount: number;
  pendingInvoicesChange: number;
  activeTenders: number;
  activeTendersChange: number;
  teamMembers: number;
  teamMembersChange: number;
}

export function useDashboardStats() {
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;

  return useQuery({
    queryKey: ["dashboard-stats", workspaceId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!workspaceId) {
        return {
          activeProjects: 0,
          activeProjectsChange: 0,
          pendingInvoices: 0,
          pendingInvoicesAmount: 0,
          pendingInvoicesChange: 0,
          activeTenders: 0,
          activeTendersChange: 0,
          teamMembers: 0,
          teamMembersChange: 0,
        };
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Fetch all stats in parallel
      const [
        activeProjectsResult,
        previousProjectsResult,
        pendingInvoicesResult,
        previousInvoicesResult,
        activeTendersResult,
        previousTendersResult,
        teamMembersResult,
        previousMembersResult,
      ] = await Promise.all([
        // Current active projects
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "active"),

        // Projects created in previous 30-day period
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "active")
          .lt("created_at", thirtyDaysAgo.toISOString()),

        // Current pending invoices (documents with status 'sent')
        supabase
          .from("commercial_documents")
          .select("id, total_amount", { count: "exact" })
          .eq("workspace_id", workspaceId)
          .eq("status", "sent"),

        // Previous pending invoices
        supabase
          .from("commercial_documents")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "sent")
          .lt("created_at", thirtyDaysAgo.toISOString()),

        // Current active tenders (using actual French status values)
        supabase
          .from("tenders")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("status", ["repere", "en_analyse", "en_montage", "go"]),

        // Previous tenders
        supabase
          .from("tenders")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("status", ["repere", "en_analyse", "en_montage", "go"])
          .lt("created_at", thirtyDaysAgo.toISOString()),

        // Current team members
        supabase
          .from("workspace_members")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),

        // Previous team members
        supabase
          .from("workspace_members")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .lt("created_at", thirtyDaysAgo.toISOString()),
      ]);

      // Calculate stats
      const activeProjects = activeProjectsResult.count || 0;
      const previousProjects = previousProjectsResult.count || 0;
      const activeProjectsChange = activeProjects - previousProjects;

      const pendingInvoices = pendingInvoicesResult.count || 0;
      const pendingInvoicesAmount = pendingInvoicesResult.data?.reduce(
        (sum, doc) => sum + (doc.total_amount || 0),
        0
      ) || 0;
      const previousInvoices = previousInvoicesResult.count || 0;
      const pendingInvoicesChange = pendingInvoices - previousInvoices;

      const activeTenders = activeTendersResult.count || 0;
      const previousTenders = previousTendersResult.count || 0;
      const activeTendersChange = activeTenders - previousTenders;

      const teamMembers = teamMembersResult.count || 0;
      const previousMembers = previousMembersResult.count || 0;
      const teamMembersChange = teamMembers - previousMembers;

      return {
        activeProjects,
        activeProjectsChange,
        pendingInvoices,
        pendingInvoicesAmount,
        pendingInvoicesChange,
        activeTenders,
        activeTendersChange,
        teamMembers,
        teamMembersChange,
      };
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
