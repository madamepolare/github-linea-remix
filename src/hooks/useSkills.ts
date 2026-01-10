import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface Skill {
  id: string;
  workspace_id: string;
  setting_key: string;
  setting_value: {
    label: string;
    daily_rate: number;      // Selling rate (€/day)
    cost_daily_rate: number; // Internal cost rate (€/day)
    color?: string;
    description?: string;
  };
  sort_order: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateSkillInput {
  label: string;
  daily_rate: number;
  cost_daily_rate: number;
  color?: string;
  description?: string;
}

export interface MemberSkill {
  id: string;
  workspace_id: string;
  user_id: string;
  skill_id: string;
  proficiency_level: 'junior' | 'intermediate' | 'senior' | 'expert';
  custom_daily_rate?: number;
  created_at: string;
  updated_at: string;
  skill?: Skill;
}

export function useSkills() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: skills = [], isLoading, error } = useQuery({
    queryKey: ["skills", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("workspace_settings")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("setting_type", "skills")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as unknown as Skill[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createSkill = useMutation({
    mutationFn: async (input: CreateSkillInput) => {
      if (!activeWorkspace?.id) throw new Error("No workspace selected");

      const { data, error } = await supabase
        .from("workspace_settings")
        .insert([{
          workspace_id: activeWorkspace.id,
          setting_type: "skills",
          setting_key: `skill_${Date.now()}`,
          setting_value: {
            label: input.label,
            daily_rate: input.daily_rate,
            cost_daily_rate: input.cost_daily_rate,
            color: input.color,
            description: input.description,
          } as Json,
          sort_order: skills.length,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Skill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", activeWorkspace?.id] });
      toast.success("Compétence créée");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la création", { description: error.message });
    },
  });

  const updateSkill = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateSkillInput>) => {
      // Fetch current value first
      const { data: current } = await supabase
        .from("workspace_settings")
        .select("setting_value")
        .eq("id", id)
        .single();

      const currentValue = current?.setting_value as Skill['setting_value'] || {};
      
      const newValue: Skill['setting_value'] = {
        ...currentValue,
        ...(updates.label !== undefined && { label: updates.label }),
        ...(updates.daily_rate !== undefined && { daily_rate: updates.daily_rate }),
        ...(updates.cost_daily_rate !== undefined && { cost_daily_rate: updates.cost_daily_rate }),
        ...(updates.color !== undefined && { color: updates.color }),
        ...(updates.description !== undefined && { description: updates.description }),
      };

      const { data, error } = await supabase
        .from("workspace_settings")
        .update({ setting_value: newValue as Json })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as Skill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", activeWorkspace?.id] });
      toast.success("Compétence mise à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la mise à jour", { description: error.message });
    },
  });

  const deleteSkill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workspace_settings")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", activeWorkspace?.id] });
      toast.success("Compétence supprimée");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la suppression", { description: error.message });
    },
  });

  return {
    skills,
    isLoading,
    error,
    createSkill,
    updateSkill,
    deleteSkill,
  };
}

export function useMemberSkills(userId?: string) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: memberSkills = [], isLoading } = useQuery({
    queryKey: ["member-skills", activeWorkspace?.id, userId],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("member_skills")
        .select("*")
        .eq("workspace_id", activeWorkspace.id);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MemberSkill[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const assignSkill = useMutation({
    mutationFn: async (input: { user_id: string; skill_id: string; proficiency_level?: string; custom_daily_rate?: number }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace selected");

      const { data, error } = await supabase
        .from("member_skills")
        .upsert({
          workspace_id: activeWorkspace.id,
          user_id: input.user_id,
          skill_id: input.skill_id,
          proficiency_level: input.proficiency_level || 'intermediate',
          custom_daily_rate: input.custom_daily_rate,
        }, { onConflict: 'workspace_id,user_id,skill_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-skills", activeWorkspace?.id] });
    },
  });

  const removeSkill = useMutation({
    mutationFn: async ({ user_id, skill_id }: { user_id: string; skill_id: string }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace selected");

      const { error } = await supabase
        .from("member_skills")
        .delete()
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", user_id)
        .eq("skill_id", skill_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-skills", activeWorkspace?.id] });
    },
  });

  return {
    memberSkills,
    isLoading,
    assignSkill,
    removeSkill,
  };
}
