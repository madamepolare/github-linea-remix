import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TeamAbsence {
  id: string;
  workspace_id: string;
  user_id: string;
  absence_type: "conge_paye" | "rtt" | "maladie" | "sans_solde" | "formation" | "teletravail" | "ecole" | "autre";
  start_date: string;
  end_date: string;
  start_half_day: boolean;
  end_half_day: boolean;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const absenceTypeLabels: Record<TeamAbsence["absence_type"], string> = {
  conge_paye: "Congé payé",
  rtt: "RTT",
  maladie: "Maladie",
  sans_solde: "Sans solde",
  formation: "Formation",
  teletravail: "Télétravail",
  ecole: "École",
  autre: "Autre",
};

export function useTeamAbsences(filters?: { userId?: string; status?: string; month?: string }) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["team-absences", activeWorkspace?.id, filters],
    queryFn: async (): Promise<TeamAbsence[]> => {
      if (!activeWorkspace) return [];

      let query = supabase
        .from("team_absences")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("start_date", { ascending: false });

      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TeamAbsence[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useMyAbsences() {
  const { user } = useAuth();
  return useTeamAbsences({ userId: user?.id });
}

export function useCreateAbsence() {
  const queryClient = useQueryClient();
  const { activeWorkspace, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (absence: Partial<TeamAbsence> & { user_id?: string; auto_approve?: boolean }) => {
      if (!activeWorkspace || !user) throw new Error("No workspace");

      const targetUserId = absence.user_id || user.id;
      const autoApprove = absence.auto_approve;

      const insertData: Record<string, unknown> = {
        absence_type: absence.absence_type,
        start_date: absence.start_date,
        end_date: absence.end_date,
        start_half_day: absence.start_half_day,
        end_half_day: absence.end_half_day,
        reason: absence.reason,
        workspace_id: activeWorkspace.id,
        user_id: targetUserId,
      };

      // If admin creates for someone else with auto-approve, mark as approved directly
      if (autoApprove) {
        insertData.status = "approved";
        insertData.approved_by = user.id;
        insertData.approved_at = new Date().toISOString();
      }

      const { data, error } = await (supabase
        .from("team_absences") as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-absences"] });
      const message = variables.auto_approve 
        ? "Absence créée et approuvée" 
        : "Demande d'absence envoyée";
      toast({ title: message });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer la demande", variant: "destructive" });
    },
  });
}

export function useUpdateAbsence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamAbsence> & { id: string }) => {
      const { data, error } = await supabase
        .from("team_absences")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-absences"] });
      toast({ title: "Demande mise à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

export function useDeleteAbsence() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_absences")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-absences"] });
      toast({ title: "Demande supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

export function useApproveAbsence() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: "approve" | "reject"; reason?: string }) => {
      const updates = action === "approve"
        ? { status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() }
        : { status: "rejected", approved_by: user?.id, approved_at: new Date().toISOString(), rejection_reason: reason };

      const { error } = await supabase
        .from("team_absences")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["team-absences"] });
      toast({ title: action === "approve" ? "Absence approuvée" : "Absence refusée" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}
