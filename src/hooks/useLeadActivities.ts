import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface LeadActivity {
  id: string;
  workspace_id: string;
  lead_id: string | null;
  contact_id: string | null;
  activity_type: string;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  is_completed: boolean;
  completed_at: string | null;
  outcome: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateActivityInput {
  lead_id?: string;
  contact_id?: string;
  activity_type: string;
  title: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  is_completed?: boolean;
  outcome?: string;
}

export function useLeadActivities(options?: { leadId?: string; contactId?: string }) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["lead-activities", activeWorkspace?.id, options?.leadId, options?.contactId];

  const { data: activities, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("lead_activities")
        .select("*")
        .eq("workspace_id", activeWorkspace!.id)
        .order("created_at", { ascending: false });

      if (options?.leadId) {
        query = query.eq("lead_id", options.leadId);
      }
      if (options?.contactId) {
        query = query.eq("contact_id", options.contactId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LeadActivity[];
    },
    enabled: !!activeWorkspace?.id && !!(options?.leadId || options?.contactId),
  });

  const createActivity = useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const { data, error } = await supabase
        .from("lead_activities")
        .insert({
          workspace_id: activeWorkspace!.id,
          created_by: user!.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
      toast({ title: "Activité créée" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const completeActivity = useMutation({
    mutationFn: async ({ id, outcome }: { id: string; outcome?: string }) => {
      const { data, error } = await supabase
        .from("lead_activities")
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          outcome,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
      toast({ title: "Activité terminée" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-activities"] });
      toast({ title: "Activité supprimée" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Erreur", description: error.message });
    },
  });

  return {
    activities: activities || [],
    isLoading,
    error,
    createActivity,
    completeActivity,
    deleteActivity,
  };
}
