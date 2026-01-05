import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type InsuranceType = "decennale" | "do" | "rc_pro" | "trc" | "cns" | "puc" | "other";
export type InsuranceStatus = "pending" | "active" | "expired" | "cancelled";

export const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
  decennale: "Responsabilité décennale",
  do: "Dommages-ouvrage",
  rc_pro: "RC Professionnelle",
  trc: "Tous Risques Chantier",
  cns: "Constructeur Non Réalisateur",
  puc: "Perte d'Usage et Chômage",
  other: "Autre",
};

export const INSURANCE_STATUS_LABELS: Record<InsuranceStatus, string> = {
  pending: "En attente",
  active: "Active",
  expired: "Expirée",
  cancelled: "Annulée",
};

export const INSURANCE_STATUS_COLORS: Record<InsuranceStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  active: "bg-emerald-500/10 text-emerald-600",
  expired: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export interface ProjectInsurance {
  id: string;
  project_id: string;
  workspace_id: string;
  insurance_type: InsuranceType;
  custom_type: string | null;
  insurer_name: string;
  insurer_contact: string | null;
  insurer_email: string | null;
  insurer_phone: string | null;
  broker_name: string | null;
  broker_contact: string | null;
  policy_number: string | null;
  start_date: string | null;
  end_date: string | null;
  coverage_amount: number | null;
  deductible: number | null;
  premium: number | null;
  premium_frequency: "annual" | "monthly" | "quarterly";
  status: InsuranceStatus;
  attestation_url: string | null;
  documents: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateInsuranceInput = Omit<ProjectInsurance, "id" | "workspace_id" | "created_at" | "updated_at">;
export type UpdateInsuranceInput = Partial<CreateInsuranceInput> & { id: string };

export function useProjectInsurances(projectId: string) {
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const insurancesQuery = useQuery({
    queryKey: ["project-insurances", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_insurances")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectInsurance[];
    },
    enabled: !!projectId,
  });

  const createInsurance = useMutation({
    mutationFn: async (input: CreateInsuranceInput) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");
      const { data, error } = await supabase
        .from("project_insurances")
        .insert({ ...input, workspace_id: activeWorkspace.id })
        .select()
        .single();
      if (error) throw error;
      return data as ProjectInsurance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-insurances", projectId] });
      toast({ title: "Assurance créée" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateInsurance = useMutation({
    mutationFn: async ({ id, ...input }: UpdateInsuranceInput) => {
      const { data, error } = await supabase
        .from("project_insurances")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ProjectInsurance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-insurances", projectId] });
      toast({ title: "Assurance mise à jour" });
    },
  });

  const deleteInsurance = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_insurances").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-insurances", projectId] });
      toast({ title: "Assurance supprimée" });
    },
  });

  return {
    insurances: insurancesQuery.data || [],
    isLoading: insurancesQuery.isLoading,
    createInsurance,
    updateInsurance,
    deleteInsurance,
  };
}

// Hook for dashboard - all insurances expiring soon
export function useExpiringInsurances() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["expiring-insurances", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data, error } = await supabase
        .from("project_insurances")
        .select("*, project:projects(id, name, color)")
        .eq("workspace_id", activeWorkspace.id)
        .eq("status", "active")
        .lte("end_date", thirtyDaysFromNow.toISOString())
        .order("end_date", { ascending: true });
      if (error) throw error;
      return data as (ProjectInsurance & { project: { id: string; name: string; color: string } })[];
    },
    enabled: !!activeWorkspace?.id,
  });
}
