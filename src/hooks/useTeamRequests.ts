import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TeamRequest {
  id: string;
  workspace_id: string;
  user_id: string;
  request_type: "resource" | "training" | "equipment" | "other";
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "approved" | "rejected" | "completed";
  assigned_to: string | null;
  response: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const requestTypeLabels: Record<TeamRequest["request_type"], string> = {
  resource: "Ressource",
  training: "Formation",
  equipment: "Équipement",
  other: "Autre",
};

export const priorityLabels: Record<TeamRequest["priority"], string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

export function useTeamRequests(filters?: { userId?: string; status?: string; type?: string }) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["team-requests", activeWorkspace?.id, filters],
    queryFn: async (): Promise<TeamRequest[]> => {
      if (!activeWorkspace) return [];

      let query = supabase
        .from("team_requests")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.type) {
        query = query.eq("request_type", filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TeamRequest[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useCreateTeamRequest() {
  const queryClient = useQueryClient();
  const { activeWorkspace, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: Partial<TeamRequest>) => {
      if (!activeWorkspace || !user) throw new Error("No workspace");

      const { data, error } = await (supabase
        .from("team_requests") as any)
        .insert({
          ...request,
          workspace_id: activeWorkspace.id,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-requests"] });
      toast({ title: "Demande créée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer la demande", variant: "destructive" });
    },
  });
}

export function useUpdateTeamRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from("team_requests")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-requests"] });
      toast({ title: "Demande mise à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

export function useDeleteTeamRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-requests"] });
      toast({ title: "Demande supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}
