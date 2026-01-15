import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SubProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  parent_id: string;
  color: string | null;
}

export interface SubProjectWithStats extends SubProject {
  total_time_hours: number;
  tasks_count: number;
  tasks_completed: number;
  billing_type?: string;
  client_request_id?: string;
}

export function useSubProjects(parentId: string | undefined) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["sub-projects", parentId],
    queryFn: async () => {
      if (!parentId || !activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, status, start_date, end_date, created_at, parent_id, color")
        .eq("parent_id", parentId)
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as SubProject[];
    },
    enabled: !!parentId && !!activeWorkspace?.id,
  });
}

export function useSubProjectsWithStats(parentId: string | undefined) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["sub-projects-stats", parentId],
    queryFn: async () => {
      if (!parentId || !activeWorkspace?.id) return [];

      // Get sub-projects
      const { data: subProjects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, description, status, start_date, end_date, created_at, parent_id, color, billing_type, client_request_id")
        .eq("parent_id", parentId)
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;
      if (!subProjects?.length) return [];

      const subProjectIds = subProjects.map((p) => p.id);

      // Get time entries for all sub-projects
      const { data: timeEntries, error: timeError } = await supabase
        .from("team_time_entries")
        .select("project_id, duration_minutes")
        .in("project_id", subProjectIds);

      if (timeError) throw timeError;

      // Get tasks for all sub-projects
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("project_id, status")
        .in("project_id", subProjectIds);

      if (tasksError) throw tasksError;

      // Aggregate stats per sub-project
      const statsMap = new Map<string, { timeMinutes: number; tasksCount: number; tasksCompleted: number }>();

      subProjectIds.forEach((id) => {
        statsMap.set(id, { timeMinutes: 0, tasksCount: 0, tasksCompleted: 0 });
      });

      timeEntries?.forEach((entry) => {
        if (entry.project_id) {
          const stats = statsMap.get(entry.project_id);
          if (stats) {
            stats.timeMinutes += entry.duration_minutes || 0;
          }
        }
      });

      tasks?.forEach((task) => {
        if (task.project_id) {
          const stats = statsMap.get(task.project_id);
          if (stats) {
            stats.tasksCount += 1;
            if (task.status === "done") {
              stats.tasksCompleted += 1;
            }
          }
        }
      });

      // Combine data
      return subProjects.map((project): SubProjectWithStats => {
        const stats = statsMap.get(project.id) || { timeMinutes: 0, tasksCount: 0, tasksCompleted: 0 };
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status || "active",
          start_date: project.start_date,
          end_date: project.end_date,
          created_at: project.created_at || new Date().toISOString(),
          parent_id: project.parent_id || parentId,
          color: project.color,
          billing_type: (project as any).billing_type || "included",
          client_request_id: (project as any).client_request_id,
          total_time_hours: Math.round((stats.timeMinutes / 60) * 10) / 10,
          tasks_count: stats.tasksCount,
          tasks_completed: stats.tasksCompleted,
        };
      });
    },
    enabled: !!parentId && !!activeWorkspace?.id,
  });
}

export function useFrameworkAggregation(projectId: string | undefined) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["framework-aggregation", projectId],
    queryFn: async () => {
      if (!projectId || !activeWorkspace?.id) return null;

      // Get project to check if it's a framework
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;
      if (project.contract_type !== "framework") return null;

      // Get all sub-projects
      const { data: subProjects, error: subError } = await supabase
        .from("projects")
        .select("id, status")
        .eq("parent_id", projectId);

      if (subError) throw subError;

      const subProjectIds = subProjects?.map((p) => p.id) || [];

      // Get total time for all sub-projects this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      let totalTimeThisMonth = 0;
      let totalTimeAllTime = 0;

      if (subProjectIds.length > 0) {
        // Time this month
        const { data: monthEntries } = await supabase
          .from("team_time_entries")
          .select("duration_minutes")
          .in("project_id", subProjectIds)
          .gte("date", startOfMonth)
          .lte("date", endOfMonth);

        totalTimeThisMonth = monthEntries?.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0;

        // Time all time
        const { data: allEntries } = await supabase
          .from("team_time_entries")
          .select("duration_minutes")
          .in("project_id", subProjectIds);

        totalTimeAllTime = allEntries?.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0;
      }

      // Count sub-projects by status
      const activeCount = subProjects?.filter((p) => p.status === "active" || p.status === "in_progress").length || 0;
      const completedCount = subProjects?.filter((p) => p.status === "completed" || p.status === "done").length || 0;

      return {
        monthlyBudget: project.monthly_budget,
        timeThisMonthHours: Math.round((totalTimeThisMonth / 60) * 10) / 10,
        timeAllTimeHours: Math.round((totalTimeAllTime / 60) * 10) / 10,
        subProjectsActive: activeCount,
        subProjectsCompleted: completedCount,
        subProjectsTotal: subProjects?.length || 0,
        frameworkStartDate: project.framework_start_date,
        frameworkEndDate: project.framework_end_date,
        autoRenew: project.auto_renew,
      };
    },
    enabled: !!projectId && !!activeWorkspace?.id,
  });
}

export function useCreateSubProject() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      parent_id: string;
      end_date?: string;
      billing_type?: "included" | "supplementary";
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      // Get parent project to inherit some fields
      const { data: parent, error: parentError } = await supabase
        .from("projects")
        .select("crm_company_id, project_type, color")
        .eq("id", data.parent_id)
        .single();

      if (parentError) throw parentError;

      const { data: newProject, error } = await supabase
        .from("projects")
        .insert({
          name: data.name,
          description: data.description ?? null,
          parent_id: data.parent_id,
          workspace_id: activeWorkspace.id,
          crm_company_id: parent.crm_company_id,
          project_type: parent.project_type,
          color: parent.color,
          status: "active",
          end_date: data.end_date ?? null,
          contract_type: "standard",
          billing_type: data.billing_type || "included",
        })
        .select()
        .single();

      if (error) throw error;
      return newProject;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sub-projects", variables.parent_id] });
      queryClient.invalidateQueries({ queryKey: ["sub-projects-stats", variables.parent_id] });
      queryClient.invalidateQueries({ queryKey: ["framework-aggregation", variables.parent_id] });
      toast.success("Demande créée avec succès");
    },
    onError: (error) => {
      console.error("Error creating sub-project:", error);
      toast.error("Erreur lors de la création de la demande");
    },
  });
}
