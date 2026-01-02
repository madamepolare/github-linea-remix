import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProjectMOEMember {
  id: string;
  project_id: string;
  workspace_id: string;
  crm_company_id: string | null;
  contact_id: string | null;
  role: string;
  is_lead: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  crm_company?: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  contact?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
}

export type CreateMOEMemberInput = Omit<ProjectMOEMember, "id" | "created_at" | "updated_at" | "crm_company" | "contact"> & {
  crm_company_id?: string | null;
  contact_id?: string | null;
  is_lead?: boolean;
  notes?: string | null;
};

export function useProjectMOE(projectId: string | null) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: moeTeam, isLoading, error } = useQuery({
    queryKey: ["project-moe", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_moe_team")
        .select(`
          *,
          crm_company:crm_company_id (id, name, logo_url, industry, email, phone),
          contact:contact_id (id, name, email, phone, avatar_url)
        `)
        .eq("project_id", projectId)
        .order("is_lead", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as ProjectMOEMember[];
    },
    enabled: !!projectId,
  });

  const addMember = useMutation({
    mutationFn: async (member: Omit<CreateMOEMemberInput, "project_id" | "workspace_id">) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }
      const { data, error } = await supabase
        .from("project_moe_team")
        .insert({
          ...member,
          project_id: projectId,
          workspace_id: activeWorkspace.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-moe", projectId] });
      toast.success("Membre ajouté à l'équipe MOE");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout du membre");
      console.error(error);
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectMOEMember> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_moe_team")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-moe", projectId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_moe_team")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-moe", projectId] });
      toast.success("Membre retiré de l'équipe");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  return {
    moeTeam: moeTeam || [],
    isLoading,
    error,
    addMember,
    updateMember,
    removeMember,
  };
}
