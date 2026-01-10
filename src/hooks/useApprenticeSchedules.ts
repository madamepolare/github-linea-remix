import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { addDays, eachDayOfInterval, isWeekend, format } from "date-fns";

export interface ApprenticeSchedule {
  id: string;
  workspace_id: string;
  user_id: string;
  schedule_name: string;
  start_date: string;
  end_date: string;
  pattern_type: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  company_days_per_week: number;
  school_days_per_week: number;
  custom_pattern: any;
  pdf_url: string | null;
  pdf_filename: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CreateApprenticeScheduleInput {
  user_id: string;
  schedule_name?: string;
  start_date: string;
  end_date: string;
  pattern_type?: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  company_days_per_week?: number;
  school_days_per_week?: number;
  custom_pattern?: any;
  pdf_url?: string;
  pdf_filename?: string;
}

// Generate school absence dates from schedule
export function generateSchoolDates(schedule: ApprenticeSchedule): Date[] {
  const startDate = new Date(schedule.start_date);
  const endDate = new Date(schedule.end_date);
  const schoolDates: Date[] = [];
  
  if (schedule.pattern_type === 'weekly') {
    // Simple pattern: first X days of week are school
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    allDays.forEach(day => {
      if (isWeekend(day)) return;
      const dayOfWeek = day.getDay(); // 1 = Monday, 5 = Friday
      // Assume school days are at the end of the week
      if (dayOfWeek > (5 - schedule.school_days_per_week)) {
        schoolDates.push(day);
      }
    });
  } else if (schedule.pattern_type === 'custom' && schedule.custom_pattern) {
    // Custom pattern from parsed PDF
    const customDates = schedule.custom_pattern.school_dates || [];
    customDates.forEach((dateStr: string) => {
      schoolDates.push(new Date(dateStr));
    });
  }
  
  return schoolDates;
}

export function useApprenticeSchedules(userId?: string) {
  const { activeWorkspace } = useAuth();
  
  return useQuery({
    queryKey: ["apprentice-schedules", activeWorkspace?.id, userId],
    queryFn: async (): Promise<ApprenticeSchedule[]> => {
      if (!activeWorkspace) return [];
      
      let query = supabase
        .from("apprentice_schedules")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("start_date", { ascending: false });
      
      if (userId) {
        query = query.eq("user_id", userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ApprenticeSchedule[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useCreateApprenticeSchedule() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateApprenticeScheduleInput) => {
      if (!activeWorkspace) throw new Error("No active workspace");
      
      const { data, error } = await supabase
        .from("apprentice_schedules")
        .insert({
          ...input,
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apprentice-schedules"] });
      toast.success("Planning alternance créé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du planning");
      console.error(error);
    },
  });
}

export function useUpdateApprenticeSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ApprenticeSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from("apprentice_schedules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apprentice-schedules"] });
      toast.success("Planning mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });
}

export function useDeleteApprenticeSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("apprentice_schedules")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apprentice-schedules"] });
      toast.success("Planning supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });
}

// Generate absences from schedule and save to team_absences
export function useGenerateAbsencesFromSchedule() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (schedule: ApprenticeSchedule) => {
      if (!activeWorkspace) throw new Error("No active workspace");
      
      const schoolDates = generateSchoolDates(schedule);
      
      // Group consecutive dates into absence periods
      const absences: { start_date: string; end_date: string }[] = [];
      let currentStart: Date | null = null;
      let currentEnd: Date | null = null;
      
      schoolDates.forEach((date, index) => {
        if (!currentStart) {
          currentStart = date;
          currentEnd = date;
        } else if (currentEnd && (date.getTime() - currentEnd.getTime()) <= 86400000 * 3) {
          // If within 3 days (accounting for weekends), extend the period
          currentEnd = date;
        } else {
          // Save current period and start new
          absences.push({
            start_date: format(currentStart, 'yyyy-MM-dd'),
            end_date: format(currentEnd!, 'yyyy-MM-dd'),
          });
          currentStart = date;
          currentEnd = date;
        }
        
        // Handle last date
        if (index === schoolDates.length - 1 && currentStart) {
          absences.push({
            start_date: format(currentStart, 'yyyy-MM-dd'),
            end_date: format(currentEnd!, 'yyyy-MM-dd'),
          });
        }
      });
      
      // Insert all absences
      for (const absence of absences) {
        await supabase
          .from("team_absences")
          .insert({
            workspace_id: activeWorkspace.id,
            user_id: schedule.user_id,
            absence_type: 'school',
            start_date: absence.start_date,
            end_date: absence.end_date,
            status: 'approved',
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
            notes: `Auto-généré depuis ${schedule.schedule_name}`,
          });
      }
      
      return absences.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["team-absences"] });
      toast.success(`${count} périodes d'absence créées`);
    },
    onError: (error) => {
      toast.error("Erreur lors de la génération des absences");
      console.error(error);
    },
  });
}
