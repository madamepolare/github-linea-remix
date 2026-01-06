import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type PermitType = "pc" | "dp" | "pa" | "pd" | "at" | "erp" | "abf" | "icpe" | "other";
export type PermitStatus = "draft" | "preparing" | "submitted" | "pending" | "additional_info_requested" | "granted" | "rejected" | "expired" | "withdrawn";

export const PERMIT_TYPE_LABELS: Record<PermitType, string> = {
  pc: "Permis de construire",
  dp: "Déclaration préalable",
  pa: "Permis d'aménager",
  pd: "Permis de démolir",
  at: "Autorisation de travaux ERP",
  erp: "Commission sécurité ERP",
  abf: "ABF (Bâtiments de France)",
  icpe: "ICPE",
  other: "Autre",
};

export const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  draft: "Brouillon",
  preparing: "En préparation",
  submitted: "Déposé",
  pending: "En instruction",
  additional_info_requested: "Pièces demandées",
  granted: "Accordé",
  rejected: "Refusé",
  expired: "Expiré",
  withdrawn: "Retiré",
};

export const PERMIT_STATUS_COLORS: Record<PermitStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  preparing: "bg-amber-500/10 text-amber-600",
  submitted: "bg-blue-500/10 text-blue-600",
  pending: "bg-purple-500/10 text-purple-600",
  additional_info_requested: "bg-orange-500/10 text-orange-600",
  granted: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
  withdrawn: "bg-muted text-muted-foreground",
};

// Official response delays in months by permit type
export const PERMIT_RESPONSE_DELAYS: Record<PermitType, number> = {
  pc: 3,       // Permis de construire: 3 mois
  dp: 1,       // Déclaration préalable: 1 mois
  pa: 3,       // Permis d'aménager: 3 mois
  pd: 2,       // Permis de démolir: 2 mois
  at: 4,       // Autorisation travaux ERP: 4 mois
  erp: 5,      // Commission sécurité ERP: 5 mois
  abf: 2,      // ABF: 2 mois
  icpe: 3,     // ICPE: 3 mois
  other: 2,    // Autre: 2 mois par défaut
};

export interface ProjectPermit {
  id: string;
  project_id: string;
  workspace_id: string;
  permit_type: PermitType;
  custom_type: string | null;
  reference_number: string | null;
  status: PermitStatus;
  preparation_start_date: string | null;
  submission_date: string | null;
  acknowledgment_date: string | null;
  expected_response_date: string | null;
  actual_response_date: string | null;
  granted_date: string | null;
  validity_end_date: string | null;
  work_start_deadline: string | null;
  authority_name: string | null;
  authority_address: string | null;
  authority_contact: string | null;
  authority_email: string | null;
  authority_phone: string | null;
  contact_name: string | null;
  contact_email: string | null;
  surface_plancher: number | null;
  no_surface: boolean;
  construction_type: string | null;
  conditions: string | null;
  prescriptions: string[];
  reserves: string[];
  documents: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  milestones?: PermitMilestone[];
}

export interface PermitMilestone {
  id: string;
  permit_id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completed_date: string | null;
  status: "pending" | "in_progress" | "completed" | "skipped";
  documents: string[];
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export type CreatePermitInput = Omit<ProjectPermit, "id" | "workspace_id" | "created_at" | "updated_at" | "milestones">;
export type UpdatePermitInput = Partial<CreatePermitInput> & { id: string };

export function useProjectPermits(projectId: string) {
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const permitsQuery = useQuery({
    queryKey: ["project-permits", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_permits")
        .select("*, milestones:permit_milestones(*)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectPermit[];
    },
    enabled: !!projectId,
  });

  const createPermit = useMutation({
    mutationFn: async (input: CreatePermitInput) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");
      const { data, error } = await supabase
        .from("project_permits")
        .insert({ ...input, workspace_id: activeWorkspace.id })
        .select()
        .single();
      if (error) throw error;
      return data as ProjectPermit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-permits", projectId] });
      toast({ title: "Permis créé" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updatePermit = useMutation({
    mutationFn: async ({ id, ...input }: UpdatePermitInput) => {
      const { data, error } = await supabase
        .from("project_permits")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ProjectPermit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-permits", projectId] });
      toast({ title: "Permis mis à jour" });
    },
  });

  const deletePermit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_permits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-permits", projectId] });
      toast({ title: "Permis supprimé" });
    },
  });

  // Milestones
  const addMilestone = useMutation({
    mutationFn: async (input: Omit<PermitMilestone, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("permit_milestones")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-permits", projectId] }),
  });

  const updateMilestone = useMutation({
    mutationFn: async ({ id, ...input }: Partial<PermitMilestone> & { id: string }) => {
      const { error } = await supabase
        .from("permit_milestones")
        .update(input)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-permits", projectId] }),
  });

  const deleteMilestone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("permit_milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project-permits", projectId] }),
  });

  return {
    permits: permitsQuery.data || [],
    isLoading: permitsQuery.isLoading,
    createPermit,
    updatePermit,
    deletePermit,
    addMilestone,
    updateMilestone,
    deleteMilestone,
  };
}

// Hook for dashboard - all permits across workspace
export function useAllPermits() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["all-permits", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const { data, error } = await supabase
        .from("project_permits")
        .select("*, project:projects(id, name, color)")
        .eq("workspace_id", activeWorkspace.id)
        .order("expected_response_date", { ascending: true });
      if (error) throw error;
      return data as (ProjectPermit & { project: { id: string; name: string; color: string } })[];
    },
    enabled: !!activeWorkspace?.id,
  });
}
