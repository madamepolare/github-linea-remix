import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInDays, parseISO } from "date-fns";

export interface ProjectAlert {
  type: 'warning' | 'error' | 'info';
  code: string;
  message: string;
}

export interface ProjectFinancialData {
  budget: number;
  totalConsomme: number;
  margePercent: number;
  isProfitable: boolean;
  alerts: ProjectAlert[];
}

// Hook to get financial data and alerts for multiple projects at once
export function useProjectsAlertsForList(projectIds: string[]) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["projects-alerts-list", projectIds, activeWorkspace?.id],
    queryFn: async () => {
      if (!projectIds.length || !activeWorkspace?.id) return {};

      // Get projects with budget
      const { data: projects } = await supabase
        .from("projects")
        .select("id, budget, end_date")
        .in("id", projectIds);

      // Get time entries costs (billable time) from team_time_entries
      const { data: timeEntries } = await supabase
        .from("team_time_entries")
        .select("project_id, duration_minutes, hourly_rate")
        .in("project_id", projectIds)
        .eq("workspace_id", activeWorkspace.id);

      // Get purchases
      const { data: purchases } = await supabase
        .from("project_purchases")
        .select("project_id, amount_ttc")
        .in("project_id", projectIds)
        .eq("workspace_id", activeWorkspace.id);

      // Get upcoming tasks (due within 7 days, not done)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const { data: upcomingTasks } = await supabase
        .from("tasks")
        .select("id, project_id, title, due_date, status")
        .in("project_id", projectIds)
        .eq("workspace_id", activeWorkspace.id)
        .neq("status", "done")
        .neq("status", "archived")
        .not("due_date", "is", null)
        .lte("due_date", sevenDaysFromNow.toISOString());

      // Get all deliverables that are not delivered (including overdue ones)
      const { data: allDeliverables } = await supabase
        .from("project_deliverables")
        .select("id, project_id, name, due_date, status")
        .in("project_id", projectIds)
        .neq("status", "delivered")
        .not("due_date", "is", null);

      // Calculate per-project data
      const result: Record<string, ProjectFinancialData> = {};

      for (const projectId of projectIds) {
        const project = projects?.find(p => p.id === projectId);
        const projectTimeEntries = timeEntries?.filter(t => t.project_id === projectId) || [];
        const projectPurchases = purchases?.filter(p => p.project_id === projectId) || [];
        const projectTasks = upcomingTasks?.filter(t => t.project_id === projectId) || [];
        const projectDeliverables = allDeliverables?.filter(d => d.project_id === projectId) || [];

        const budget = project?.budget || 0;
        const tempsConsomme = projectTimeEntries.reduce((sum, t) => {
          const hourlyRate = t.hourly_rate || 0;
          const hours = (t.duration_minutes || 0) / 60;
          return sum + (hours * hourlyRate);
        }, 0);
        const achatsConsommes = projectPurchases.reduce((sum, p) => sum + (p.amount_ttc || 0), 0);
        const totalConsomme = tempsConsomme + achatsConsommes;

        const margePercent = budget > 0 ? ((budget - totalConsomme) / budget) * 100 : 0;
        const isProfitable = budget > 0 ? totalConsomme <= budget : true;

        const alerts: ProjectAlert[] = [];

        // Alert: Budget exceeded
        if (budget > 0 && totalConsomme > budget) {
          alerts.push({
            type: 'error',
            code: 'budget_exceeded',
            message: `Budget dépassé`,
          });
        }

        // Alert: Low margin (< 20%)
        if (budget > 0 && margePercent < 20 && margePercent >= 0) {
          alerts.push({
            type: 'warning',
            code: 'low_margin',
            message: `Marge faible (${Math.round(margePercent)}%)`,
          });
        }

        // Alert: Upcoming tasks
        const overdueTasks = projectTasks.filter(t => t.due_date && differenceInDays(parseISO(t.due_date), new Date()) < 0);
        const soonTasks = projectTasks.filter(t => t.due_date && differenceInDays(parseISO(t.due_date), new Date()) >= 0);
        
        if (overdueTasks.length > 0) {
          alerts.push({
            type: 'error',
            code: 'overdue_tasks',
            message: `${overdueTasks.length} tâche(s) en retard`,
          });
        } else if (soonTasks.length > 0) {
          alerts.push({
            type: 'info',
            code: 'upcoming_tasks',
            message: `${soonTasks.length} tâche(s) à venir`,
          });
        }

        // Alert: Upcoming deliverables
        const overdueDeliverables = projectDeliverables.filter(d => d.due_date && differenceInDays(parseISO(d.due_date), new Date()) < 0);
        const soonDeliverables = projectDeliverables.filter(d => d.due_date && differenceInDays(parseISO(d.due_date), new Date()) >= 0);
        
        if (overdueDeliverables.length > 0) {
          alerts.push({
            type: 'error',
            code: 'overdue_deliverables',
            message: `${overdueDeliverables.length} rendu(s) en retard`,
          });
        } else if (soonDeliverables.length > 0) {
          alerts.push({
            type: 'info',
            code: 'upcoming_deliverables',
            message: `${soonDeliverables.length} rendu(s) à venir`,
          });
        }

        // Alert: Project deadline approaching
        if (project?.end_date) {
          const daysToDeadline = differenceInDays(parseISO(project.end_date), new Date());
          if (daysToDeadline < 0) {
            alerts.push({
              type: 'error',
              code: 'project_overdue',
              message: `Projet en retard`,
            });
          } else if (daysToDeadline <= 7) {
            alerts.push({
              type: 'warning',
              code: 'deadline_soon',
              message: `Échéance dans ${daysToDeadline}j`,
            });
          }
        }

        result[projectId] = {
          budget,
          totalConsomme,
          margePercent,
          isProfitable,
          alerts,
        };
      }

      return result;
    },
    enabled: projectIds.length > 0 && !!activeWorkspace?.id,
    staleTime: 30000, // Cache for 30 seconds
  });
}
