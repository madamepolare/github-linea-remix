import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, startOfMonth, startOfYear, format, subDays, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

export interface UserTimeStats {
  userId: string;
  userName: string;
  avatarUrl?: string;
  totalHours: number;
  billableHours: number;
  billablePercent: number;
}

export interface ProjectTimeStats {
  projectId: string;
  projectName: string;
  totalHours: number;
  totalAmount: number;
}

export interface WeeklyHours {
  week: string;
  weekLabel: string;
  billable: number;
  nonBillable: number;
}

export interface DailyActivity {
  date: string;
  dayOfWeek: number;
  hours: number;
}

export interface TimeAnalytics {
  // Summary
  totalHoursWeek: number;
  totalHoursMonth: number;
  totalHoursYear: number;
  
  // Billable vs non-billable
  billableHours: number;
  nonBillableHours: number;
  billablePercent: number;
  
  // By user
  byUser: UserTimeStats[];
  topContributors: UserTimeStats[];
  
  // By project
  byProject: ProjectTimeStats[];
  
  // Weekly trend (last 8 weeks)
  weeklyTrend: WeeklyHours[];
  
  // Daily activity heatmap (last 30 days)
  dailyActivity: DailyActivity[];
  
  // Averages
  avgHoursPerDay: number;
  avgHoursPerUser: number;
}

export function useTimeAnalytics() {
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;

  return useQuery({
    queryKey: ['time-analytics', workspaceId],
    queryFn: async (): Promise<TimeAnalytics> => {
      if (!workspaceId) throw new Error("No workspace");

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const monthStart = startOfMonth(now);
      const yearStart = startOfYear(now);
      const thirtyDaysAgo = subDays(now, 30);
      const eightWeeksAgo = subDays(now, 56);

      // Fetch time entries with profiles
      const { data: timeEntries } = await supabase
        .from('team_time_entries')
        .select(`
          id,
          user_id,
          project_id,
          duration_minutes,
          hourly_rate,
          date,
          is_billable,
          status
        `)
        .eq('workspace_id', workspaceId)
        .gte('date', yearStart.toISOString().split('T')[0]);

      // Fetch profiles for user names
      const userIds = [...new Set((timeEntries || []).map(te => te.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      // Fetch projects for names
      const projectIds = [...new Set((timeEntries || []).filter(te => te.project_id).map(te => te.project_id))];
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const projectMap = new Map(projects?.map(p => [p.id, p.name]) || []);

      // Filter valid entries
      const validEntries = (timeEntries || []).filter(te => te.status !== 'rejected');

      // Calculate period totals
      const totalHoursWeek = validEntries
        .filter(te => new Date(te.date) >= weekStart)
        .reduce((sum, te) => sum + (te.duration_minutes || 0), 0) / 60;

      const totalHoursMonth = validEntries
        .filter(te => new Date(te.date) >= monthStart)
        .reduce((sum, te) => sum + (te.duration_minutes || 0), 0) / 60;

      const totalHoursYear = validEntries
        .reduce((sum, te) => sum + (te.duration_minutes || 0), 0) / 60;

      // Billable vs non-billable
      const billableHours = validEntries
        .filter(te => te.is_billable)
        .reduce((sum, te) => sum + (te.duration_minutes || 0), 0) / 60;
      
      const nonBillableHours = totalHoursYear - billableHours;
      const billablePercent = totalHoursYear > 0 ? (billableHours / totalHoursYear) * 100 : 0;

      // By user
      const userStats = new Map<string, { total: number; billable: number }>();
      validEntries.forEach(te => {
        const current = userStats.get(te.user_id) || { total: 0, billable: 0 };
        current.total += te.duration_minutes || 0;
        if (te.is_billable) current.billable += te.duration_minutes || 0;
        userStats.set(te.user_id, current);
      });

      const byUser: UserTimeStats[] = Array.from(userStats.entries()).map(([userId, stats]) => {
        const profile = profileMap.get(userId);
        const totalHours = stats.total / 60;
        const billableUserHours = stats.billable / 60;
        return {
          userId,
          userName: profile?.full_name || 'Utilisateur inconnu',
          avatarUrl: profile?.avatar_url || undefined,
          totalHours,
          billableHours: billableUserHours,
          billablePercent: totalHours > 0 ? (billableUserHours / totalHours) * 100 : 0,
        };
      });

      const topContributors = [...byUser]
        .sort((a, b) => b.totalHours - a.totalHours)
        .slice(0, 5);

      // By project
      const projectStats = new Map<string, { hours: number; amount: number }>();
      validEntries.filter(te => te.project_id).forEach(te => {
        const current = projectStats.get(te.project_id!) || { hours: 0, amount: 0 };
        const hours = (te.duration_minutes || 0) / 60;
        current.hours += hours;
        current.amount += hours * (te.hourly_rate || 0);
        projectStats.set(te.project_id!, current);
      });

      const byProject: ProjectTimeStats[] = Array.from(projectStats.entries())
        .map(([projectId, stats]) => ({
          projectId,
          projectName: projectMap.get(projectId) || 'Projet inconnu',
          totalHours: stats.hours,
          totalAmount: stats.amount,
        }))
        .sort((a, b) => b.totalHours - a.totalHours);

      // Weekly trend (last 8 weeks)
      const weeklyTrend: WeeklyHours[] = [];
      for (let i = 7; i >= 0; i--) {
        const weekDate = subDays(now, i * 7);
        const weekStartDate = startOfWeek(weekDate, { weekStartsOn: 1 });
        const weekEndDate = subDays(startOfWeek(subDays(weekDate, -7), { weekStartsOn: 1 }), 1);
        
        const weekEntries = validEntries.filter(te => {
          const d = new Date(te.date);
          return d >= weekStartDate && d <= weekEndDate;
        });

        const billable = weekEntries
          .filter(te => te.is_billable)
          .reduce((sum, te) => sum + (te.duration_minutes || 0), 0) / 60;
        
        const nonBillableWeek = weekEntries
          .filter(te => !te.is_billable)
          .reduce((sum, te) => sum + (te.duration_minutes || 0), 0) / 60;

        weeklyTrend.push({
          week: format(weekStartDate, 'yyyy-MM-dd'),
          weekLabel: `S${format(weekStartDate, 'w')}`,
          billable,
          nonBillable: nonBillableWeek,
        });
      }

      // Daily activity (last 30 days)
      const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
      const dailyActivity: DailyActivity[] = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayHours = validEntries
          .filter(te => te.date === dayStr)
          .reduce((sum, te) => sum + (te.duration_minutes || 0), 0) / 60;
        
        return {
          date: dayStr,
          dayOfWeek: day.getDay(),
          hours: dayHours,
        };
      });

      // Averages
      const workDays = dailyActivity.filter(d => d.dayOfWeek !== 0 && d.dayOfWeek !== 6);
      const avgHoursPerDay = workDays.length > 0 
        ? workDays.reduce((sum, d) => sum + d.hours, 0) / workDays.length 
        : 0;
      
      const avgHoursPerUser = byUser.length > 0 
        ? totalHoursYear / byUser.length 
        : 0;

      return {
        totalHoursWeek,
        totalHoursMonth,
        totalHoursYear,
        billableHours,
        nonBillableHours,
        billablePercent,
        byUser,
        topContributors,
        byProject,
        weeklyTrend,
        dailyActivity,
        avgHoursPerDay,
        avgHoursPerUser,
      };
    },
    enabled: !!workspaceId,
  });
}
