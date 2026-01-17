import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export type SettingType = 
  | "tags"
  | "pipelines" 
  | "pipeline_stages"
  | "contact_types"
  | "bet_specialties"
  | "lead_sources"
  | "activity_types"
  | "company_types"
  | "company_categories"
  | "task_statuses"
  | "task_priorities"
  | "project_types"
  | "project_subtypes"
  | "project_categories"
  | "lot_categories";

export interface WorkspaceSetting {
  id: string;
  workspace_id: string;
  setting_type: SettingType;
  setting_key: string;
  setting_value: {
    label: string;
    color?: string;
    icon?: string;
    description?: string;
    probability?: number;
    category?: string;
    pipeline_id?: string;
    [key: string]: unknown;
  };
  sort_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateSettingInput {
  setting_type: SettingType;
  setting_key: string;
  setting_value: WorkspaceSetting["setting_value"];
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateSettingInput {
  id: string;
  setting_key?: string;
  setting_value?: WorkspaceSetting["setting_value"];
  sort_order?: number;
  is_active?: boolean;
}

export function useWorkspaceSettings(settingType?: SettingType) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading, error } = useQuery({
    queryKey: ["workspace-settings", activeWorkspace?.id, settingType],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("workspace_settings")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("sort_order", { ascending: true });

      if (settingType) {
        query = query.eq("setting_type", settingType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WorkspaceSetting[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createSetting = useMutation({
    mutationFn: async (input: CreateSettingInput) => {
      if (!activeWorkspace?.id) throw new Error("No workspace selected");

      const { data, error } = await supabase
        .from("workspace_settings")
        .insert([{
          workspace_id: activeWorkspace.id,
          setting_type: input.setting_type,
          setting_key: input.setting_key,
          setting_value: input.setting_value as Json,
          sort_order: input.sort_order ?? 0,
          is_active: input.is_active ?? true,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as WorkspaceSetting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-settings", activeWorkspace?.id] });
      toast.success("Paramètre créé");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la création", { description: error.message });
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateSettingInput) => {
      const updateData: Record<string, Json | string | number | boolean | null> = {};
      if (updates.setting_key !== undefined) updateData.setting_key = updates.setting_key;
      if (updates.setting_value !== undefined) updateData.setting_value = updates.setting_value as Json;
      if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

      const { data, error } = await supabase
        .from("workspace_settings")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as WorkspaceSetting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-settings", activeWorkspace?.id] });
      toast.success("Paramètre mis à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la mise à jour", { description: error.message });
    },
  });

  const deleteSetting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workspace_settings")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-settings", activeWorkspace?.id] });
      toast.success("Paramètre supprimé");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la suppression", { description: error.message });
    },
  });

  const reorderSettings = useMutation({
    mutationFn: async (reorderedSettings: { id: string; sort_order: number }[]) => {
      const updates = reorderedSettings.map(({ id, sort_order }) =>
        supabase
          .from("workspace_settings")
          .update({ sort_order })
          .eq("id", id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-settings", activeWorkspace?.id] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    createSetting,
    updateSetting,
    deleteSetting,
    reorderSettings,
  };
}
