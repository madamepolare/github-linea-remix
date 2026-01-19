import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMembers } from "./useTeamMembers";
import { useTeamAbsences } from "./useTeamAbsences";
import { useTeamTimeEntries } from "./useTeamTimeEntries";
import { useAllTeamBalances } from "./useLeaveManagement";
import { useMemberEmploymentInfo, useAllMemberEmploymentInfo } from "./useMemberEmploymentInfo";
import { startOfWeek, endOfWeek, format, addDays, isBefore, parseISO, isWithinInterval } from "date-fns";

export interface HRStats {
  totalMembers: number;
  absentToday: number;
  pendingValidations: number;
  hoursThisWeek: number;
  upcomingProbationEnds: { userId: string; name: string; date: string }[];
  negativeBalances: { userId: string; name: string; type: string; balance: number }[];
  expiringContracts: { userId: string; name: string; date: string }[];
  pendingAbsences: number;
  pendingTimeEntries: number;
}

export function useHRStats() {
  const { activeWorkspace, user } = useAuth();
  const { data: members } = useTeamMembers();
  const { data: absences } = useTeamAbsences();
  const { data: allBalances } = useAllTeamBalances();
  const { data: allEmployment } = useAllMemberEmploymentInfo();
  
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  const { data: timeEntries } = useTeamTimeEntries({
    startDate: format(weekStart, "yyyy-MM-dd"),
    endDate: format(weekEnd, "yyyy-MM-dd"),
  });

  return useQuery({
    queryKey: ["hr-stats", activeWorkspace?.id],
    queryFn: async (): Promise<HRStats> => {
      if (!activeWorkspace) {
        return {
          totalMembers: 0,
          absentToday: 0,
          pendingValidations: 0,
          hoursThisWeek: 0,
          upcomingProbationEnds: [],
          negativeBalances: [],
          expiringContracts: [],
          pendingAbsences: 0,
          pendingTimeEntries: 0,
        };
      }

      const memberMap = members?.reduce((acc, m) => {
        acc[m.user_id] = m.profile?.full_name || "Inconnu";
        return acc;
      }, {} as Record<string, string>) || {};

      // Count absent today
      const todayStr = format(today, "yyyy-MM-dd");
      const absentToday = absences?.filter((a) => {
        if (a.status !== "approved") return false;
        const start = parseISO(a.start_date);
        const end = parseISO(a.end_date);
        return isWithinInterval(today, { start, end });
      }).length || 0;

      // Pending validations (absences + time entries)
      const pendingAbsences = absences?.filter((a) => a.status === "pending").length || 0;
      const pendingTimeEntries = timeEntries?.filter((t) => t.status === "pending_validation").length || 0;

      // Hours this week
      const hoursThisWeek = timeEntries?.reduce((sum, e) => {
        if (e.status === "validated" || e.status === "pending_validation") {
          return sum + (e.duration_minutes / 60);
        }
        return sum;
      }, 0) || 0;

      // Upcoming probation ends (next 30 days)
      const thirtyDaysFromNow = addDays(today, 30);
      const upcomingProbationEnds: HRStats["upcomingProbationEnds"] = [];
      
      allEmployment?.forEach((emp) => {
        if (emp.trial_end_date) {
          const trialEnd = parseISO(emp.trial_end_date);
          if (trialEnd >= today && trialEnd <= thirtyDaysFromNow) {
            upcomingProbationEnds.push({
              userId: emp.user_id,
              name: memberMap[emp.user_id] || "Inconnu",
              date: emp.trial_end_date,
            });
          }
        }
      });

      // Negative leave balances
      const negativeBalances: HRStats["negativeBalances"] = [];
      allBalances?.forEach((balance) => {
        if (balance.remaining < 0) {
          negativeBalances.push({
            userId: balance.user_id,
            name: memberMap[balance.user_id] || "Inconnu",
            type: balance.leave_type,
            balance: balance.remaining,
          });
        }
      });

      // Expiring contracts (CDD ending in next 60 days)
      const sixtyDaysFromNow = addDays(today, 60);
      const expiringContracts: HRStats["expiringContracts"] = [];
      
      allEmployment?.forEach((emp) => {
        if (emp.end_date && (emp.contract_type === "cdd" || emp.contract_type === "alternance" || emp.contract_type === "stage")) {
          const endDate = parseISO(emp.end_date);
          if (endDate >= today && endDate <= sixtyDaysFromNow) {
            expiringContracts.push({
              userId: emp.user_id,
              name: memberMap[emp.user_id] || "Inconnu",
              date: emp.end_date,
            });
          }
        }
      });

      return {
        totalMembers: members?.length || 0,
        absentToday,
        pendingValidations: pendingAbsences + pendingTimeEntries,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        upcomingProbationEnds,
        negativeBalances,
        expiringContracts,
        pendingAbsences,
        pendingTimeEntries,
      };
    },
    enabled: !!activeWorkspace && !!members,
  });
}
