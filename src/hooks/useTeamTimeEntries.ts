import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TeamTimeEntry {
  id: string;
  workspace_id: string;
  user_id: string;
  project_id: string | null;
  task_id: string | null;
  description: string | null;
  duration_minutes: number;
  date: string;
  started_at: string | null;
  ended_at: string | null;
  is_billable: boolean;
  status: "draft" | "pending_validation" | "validated" | "rejected";
  validated_by: string | null;
  validated_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  project?: { name: string } | null;
  task?: { title: string } | null;
}

interface TimeEntryFilters {
  userId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export function useTeamTimeEntries(filters?: TimeEntryFilters) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["team-time-entries", activeWorkspace?.id, filters],
    queryFn: async (): Promise<TeamTimeEntry[]> => {
      if (!activeWorkspace) return [];

      let query = supabase
        .from("team_time_entries")
        .select(`
          *,
          project:projects(name),
          task:tasks(title)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .order("date", { ascending: false });

      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }
      if (filters?.projectId) {
        query = query.eq("project_id", filters.projectId);
      }
      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TeamTimeEntry[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useMyTimeEntries(startDate?: string, endDate?: string) {
  const { user } = useAuth();
  return useTeamTimeEntries({
    userId: user?.id,
    startDate,
    endDate,
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  const { activeWorkspace, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: Partial<TeamTimeEntry>) => {
      if (!activeWorkspace || !user) throw new Error("No workspace");

      const { data, error } = await (supabase
        .from("team_time_entries") as any)
        .insert({
          ...entry,
          workspace_id: activeWorkspace.id,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-time-entries"], refetchType: "all" });
      toast({ title: "Temps enregistré" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'enregistrer le temps", variant: "destructive" });
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamTimeEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("team_time_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-time-entries"] });
      toast({ title: "Temps mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour", variant: "destructive" });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_time_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-time-entries"] });
      toast({ title: "Temps supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" });
    },
  });
}

export function useValidateTimeEntry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: "validate" | "reject"; reason?: string }) => {
      const updates = action === "validate"
        ? { status: "validated", validated_by: user?.id, validated_at: new Date().toISOString() }
        : { status: "rejected", validated_by: user?.id, validated_at: new Date().toISOString(), rejection_reason: reason };

      const { error } = await supabase
        .from("team_time_entries")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["team-time-entries"] });
      toast({ title: action === "validate" ? "Temps validé" : "Temps refusé" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}
