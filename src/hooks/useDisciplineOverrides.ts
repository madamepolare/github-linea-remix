import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";
import type { DisciplineSlug } from "@/lib/disciplines";

// ============= TYPES =============

export interface TeamSpecialtyOverride {
  value: string;
  label: string;
  category?: string;
}

export interface DocumentTypeOverride {
  value: string;
  label: string;
  mandatory?: boolean;
}

export interface CriterionTypeOverride {
  value: string;
  label: string;
}

export interface MemoireSectionOverride {
  value: string;
  label: string;
  description?: string;
}

export interface DisciplineOverrides {
  // Hidden base items
  hidden_team_specialties?: string[];
  hidden_document_types?: string[];
  hidden_criterion_types?: string[];
  hidden_memoire_sections?: string[];
  
  // Custom added items
  custom_team_specialties?: TeamSpecialtyOverride[];
  custom_document_types?: {
    candidature?: DocumentTypeOverride[];
    offre?: DocumentTypeOverride[];
  };
  custom_criterion_types?: CriterionTypeOverride[];
  custom_memoire_sections?: MemoireSectionOverride[];
  
  // Custom AI prompts
  custom_ai_prompts?: {
    dceAnalysis?: string;
    memoireGeneration?: string;
  };
  
  // Default field values
  default_field_values?: Record<string, unknown>;
}

// ============= HOOK =============

export function useDisciplineOverrides(disciplineSlug: DisciplineSlug) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["discipline-overrides", activeWorkspace?.id, disciplineSlug];

  const { data: settingRecord, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;

      const { data, error } = await supabase
        .from("workspace_settings")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("setting_type", "tender_discipline_config")
        .eq("setting_key", disciplineSlug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id,
  });

  const overrides: DisciplineOverrides | null = settingRecord?.setting_value 
    ? (settingRecord.setting_value as unknown as DisciplineOverrides)
    : null;

  const updateOverridesMutation = useMutation({
    mutationFn: async (updates: Partial<DisciplineOverrides>) => {
      if (!activeWorkspace?.id) throw new Error("No workspace selected");

      const newValue: DisciplineOverrides = {
        ...(overrides || {}),
        ...updates,
      };

      if (settingRecord?.id) {
        const { error } = await supabase
          .from("workspace_settings")
          .update({ 
            setting_value: newValue as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("workspace_settings")
          .insert([{
            workspace_id: activeWorkspace.id,
            setting_type: "tender_discipline_config",
            setting_key: disciplineSlug,
            setting_value: newValue as unknown as Json,
            sort_order: 0,
            is_active: true,
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Configuration mise à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur", { description: error.message });
    },
  });

  const resetOverrides = useMutation({
    mutationFn: async () => {
      if (!settingRecord?.id) return;

      const { error } = await supabase
        .from("workspace_settings")
        .delete()
        .eq("id", settingRecord.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Configuration réinitialisée");
    },
    onError: (error: Error) => {
      toast.error("Erreur", { description: error.message });
    },
  });

  return {
    overrides,
    isLoading,
    hasOverrides: !!settingRecord,
    updateOverrides: updateOverridesMutation.mutate,
    updateOverridesAsync: updateOverridesMutation.mutateAsync,
    isUpdating: updateOverridesMutation.isPending,
    resetOverrides: resetOverrides.mutate,
    isResetting: resetOverrides.isPending,
  };
}