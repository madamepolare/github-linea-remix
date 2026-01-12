import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface PlanningSettings {
  default_start_hour: number;
  default_task_duration: number;
  // Agency working hours
  agency_open_hour: number;
  agency_close_hour: number;
  // Lunch break
  lunch_start_hour: number;
  lunch_end_hour: number;
  // Workable hours per day (excluding lunch)
  workable_hours_per_day: number;
}

const DEFAULT_PLANNING_SETTINGS: PlanningSettings = {
  default_start_hour: 10, // 10h by default as requested
  default_task_duration: 2,
  agency_open_hour: 10,   // Opens at 10h
  agency_close_hour: 18,  // Closes at 18h (7h of work with 1h lunch)
  lunch_start_hour: 13,
  lunch_end_hour: 14,
  workable_hours_per_day: 7, // 7h by default (8h - 1h lunch)
};

export function usePlanningSettings() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: settingRecord, isLoading } = useQuery({
    queryKey: ["planning-settings", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;

      const { data, error } = await supabase
        .from("workspace_settings")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("setting_type", "planning_config")
        .eq("setting_key", "planning_defaults")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id,
  });

  const rawValue = settingRecord?.setting_value as Record<string, unknown> | null;
  
  const planningSettings: PlanningSettings = rawValue 
    ? {
        default_start_hour: (rawValue.default_start_hour as number) ?? DEFAULT_PLANNING_SETTINGS.default_start_hour,
        default_task_duration: (rawValue.default_task_duration as number) ?? DEFAULT_PLANNING_SETTINGS.default_task_duration,
        agency_open_hour: (rawValue.agency_open_hour as number) ?? DEFAULT_PLANNING_SETTINGS.agency_open_hour,
        agency_close_hour: (rawValue.agency_close_hour as number) ?? DEFAULT_PLANNING_SETTINGS.agency_close_hour,
        lunch_start_hour: (rawValue.lunch_start_hour as number) ?? DEFAULT_PLANNING_SETTINGS.lunch_start_hour,
        lunch_end_hour: (rawValue.lunch_end_hour as number) ?? DEFAULT_PLANNING_SETTINGS.lunch_end_hour,
        workable_hours_per_day: (rawValue.workable_hours_per_day as number) ?? DEFAULT_PLANNING_SETTINGS.workable_hours_per_day,
      }
    : DEFAULT_PLANNING_SETTINGS;

  const updatePlanningSettings = useMutation({
    mutationFn: async (updates: Partial<PlanningSettings>) => {
      if (!activeWorkspace?.id) throw new Error("No workspace selected");

      const newValue = { ...planningSettings, ...updates };

      if (settingRecord?.id) {
        // Update existing
        const { error } = await supabase
          .from("workspace_settings")
          .update({ setting_value: newValue as unknown as Json })
          .eq("id", settingRecord.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("workspace_settings")
          .insert([{
            workspace_id: activeWorkspace.id,
            setting_type: "planning_config",
            setting_key: "planning_defaults",
            setting_value: newValue as unknown as Json,
            sort_order: 0,
            is_active: true,
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning-settings", activeWorkspace?.id] });
      toast.success("Paramètres de planning mis à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur", { description: error.message });
    },
  });

  return {
    planningSettings,
    isLoading,
    updatePlanningSettings,
  };
}
