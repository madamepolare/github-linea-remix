import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DeliverableStatus = "pending" | "in_progress" | "delivered" | "validated";

export interface ProjectDeliverable {
  id: string;
  project_id: string;
  workspace_id: string;
  phase_id: string | null;
  name: string;
  description: string | null;
  file_url: string | null;
  status: DeliverableStatus;
  due_date: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  // Email tracking fields
  email_template: string | null;
  email_link: string | null;
  email_sent_at: string | null;
  email_sent_to: string[] | null;
  phase?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

export type CreateDeliverableInput = {
  project_id: string;
  workspace_id: string;
  phase_id?: string | null;
  name: string;
  description?: string | null;
  file_url?: string | null;
  status?: DeliverableStatus;
  due_date?: string | null;
};

export function useProjectDeliverables(projectId: string | null) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: deliverables, isLoading, error } = useQuery({
    queryKey: ["project-deliverables", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_deliverables")
        .select(`
          *,
          phase:phase_id (id, name, color)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ProjectDeliverable[];
    },
    enabled: !!projectId,
  });

  const createDeliverable = useMutation({
    mutationFn: async (deliverable: Omit<CreateDeliverableInput, "project_id" | "workspace_id">) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }
      const { data, error } = await supabase
        .from("project_deliverables")
        .insert({
          ...deliverable,
          project_id: projectId,
          workspace_id: activeWorkspace.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-deliverables", projectId] });
      // Invalidate calendar events since deliverables sync to calendar
      queryClient.invalidateQueries({ queryKey: ["calendar-events", projectId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-events"] });
      toast.success("Livrable créé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du livrable");
      console.error(error);
    },
  });

  const updateDeliverable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectDeliverable> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_deliverables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-deliverables", projectId] });
      // Invalidate calendar events since deliverables sync to calendar
      queryClient.invalidateQueries({ queryKey: ["calendar-events", projectId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-events"] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  const deleteDeliverable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_deliverables")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-deliverables", projectId] });
      // Invalidate calendar events since deliverables sync to calendar
      queryClient.invalidateQueries({ queryKey: ["calendar-events", projectId] });
      queryClient.invalidateQueries({ queryKey: ["workspace-events"] });
      toast.success("Livrable supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  return {
    deliverables: deliverables || [],
    isLoading,
    error,
    createDeliverable,
    updateDeliverable,
    deleteDeliverable,
  };
}
