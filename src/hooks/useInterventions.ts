import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Intervention {
  id: string;
  project_id: string;
  workspace_id: string;
  lot_id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  color: string | null;
  status: "planned" | "in_progress" | "completed" | "delayed" | "cancelled";
  team_size: number;
  notes: string | null;
  sub_row: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lot?: {
    id: string;
    name: string;
    color: string | null;
    crm_company_id: string | null;
  } | null;
}

export interface CreateInterventionInput {
  lot_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  color?: string;
  status?: "planned" | "in_progress" | "completed" | "delayed" | "cancelled";
  team_size?: number;
  notes?: string;
  sub_row?: number;
}

export function useInterventions(projectId: string | null) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: interventions, isLoading } = useQuery({
    queryKey: ["project-interventions", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_lot_interventions")
        .select(`
          *,
          lot:lot_id (id, name, color, crm_company_id)
        `)
        .eq("project_id", projectId)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data as Intervention[];
    },
    enabled: !!projectId,
  });

  const createIntervention = useMutation({
    mutationFn: async (input: CreateInterventionInput) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }

      const { data, error } = await supabase
        .from("project_lot_interventions")
        .insert({
          ...input,
          project_id: projectId,
          workspace_id: activeWorkspace.id,
        })
        .select(`
          *,
          lot:lot_id (id, name, color, crm_company_id)
        `)
        .single();

      if (error) throw error;
      return data as Intervention;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-interventions", projectId] });
      toast.success("Intervention ajoutée");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    },
  });

  const createMultipleInterventions = useMutation({
    mutationFn: async (inputs: CreateInterventionInput[]) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }

      const rows = inputs.map(input => ({
        ...input,
        project_id: projectId,
        workspace_id: activeWorkspace.id,
      }));

      const { data, error } = await supabase
        .from("project_lot_interventions")
        .insert(rows)
        .select(`
          *,
          lot:lot_id (id, name, color, crm_company_id)
        `);

      if (error) throw error;
      return data as Intervention[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-interventions", projectId] });
      toast.success(`${data.length} intervention(s) ajoutée(s)`);
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    },
  });

  const updateIntervention = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Intervention> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_lot_interventions")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          lot:lot_id (id, name, color, crm_company_id)
        `)
        .single();

      if (error) throw error;
      return data as Intervention;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-interventions", projectId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  const deleteIntervention = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_lot_interventions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-interventions", projectId] });
      toast.success("Intervention supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  const deleteMultipleInterventions = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("project_lot_interventions")
        .delete()
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-interventions", projectId] });
      toast.success("Interventions supprimées");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  return {
    interventions: interventions || [],
    isLoading,
    createIntervention,
    createMultipleInterventions,
    updateIntervention,
    deleteIntervention,
    deleteMultipleInterventions,
  };
}
