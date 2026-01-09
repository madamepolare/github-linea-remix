import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface MemberEmploymentInfo {
  id: string;
  workspace_id: string;
  user_id: string;
  salary_monthly: number | null;
  contract_type: string | null;
  start_date: string | null;
  end_date: string | null;
  trial_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useMemberEmploymentInfo(userId?: string) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["member-employment-info", activeWorkspace?.id, userId],
    queryFn: async (): Promise<MemberEmploymentInfo | null> => {
      if (!activeWorkspace || !userId) return null;

      const { data, error } = await supabase
        .from("member_employment_info")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching employment info:", error);
        return null;
      }

      return data;
    },
    enabled: !!activeWorkspace && !!userId,
  });
}

export function useAllMemberEmploymentInfo() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["all-member-employment-info", activeWorkspace?.id],
    queryFn: async (): Promise<MemberEmploymentInfo[]> => {
      if (!activeWorkspace) return [];

      const { data, error } = await supabase
        .from("member_employment_info")
        .select("*")
        .eq("workspace_id", activeWorkspace.id);

      if (error) {
        console.error("Error fetching all employment info:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!activeWorkspace,
  });
}

export function useUpsertMemberEmploymentInfo() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();

  return useMutation({
    mutationFn: async (data: Partial<MemberEmploymentInfo> & { user_id: string }) => {
      if (!activeWorkspace) throw new Error("No workspace");

      // Check if record exists
      const { data: existing } = await supabase
        .from("member_employment_info")
        .select("id")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", data.user_id)
        .maybeSingle();

      if (existing) {
        // Update
        const { data: updated, error } = await supabase
          .from("member_employment_info")
          .update({
            salary_monthly: data.salary_monthly,
            contract_type: data.contract_type,
            start_date: data.start_date,
            end_date: data.end_date,
            trial_end_date: data.trial_end_date,
            notes: data.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return updated;
      } else {
        // Insert
        const { data: inserted, error } = await supabase
          .from("member_employment_info")
          .insert({
            workspace_id: activeWorkspace.id,
            user_id: data.user_id,
            salary_monthly: data.salary_monthly,
            contract_type: data.contract_type,
            start_date: data.start_date,
            end_date: data.end_date,
            trial_end_date: data.trial_end_date,
            notes: data.notes,
          })
          .select()
          .single();

        if (error) throw error;
        return inserted;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["member-employment-info", activeWorkspace?.id, variables.user_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-member-employment-info", activeWorkspace?.id],
      });
      toast.success("Informations mises à jour");
    },
    onError: (error) => {
      console.error("Error saving employment info:", error);
      toast.error("Erreur lors de la sauvegarde");
    },
  });
}
