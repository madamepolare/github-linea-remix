import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ProjectReference {
  id: string;
  workspace_id: string;
  project_id: string | null;
  title: string;
  slug: string | null;
  description: string | null;
  client_name: string | null;
  client_type: "prive" | "public" | "promoteur" | "association" | null;
  project_type: "architecture" | "interior" | "scenography" | "urban" | "landscape" | null;
  building_type: string | null;
  surface_m2: number | null;
  budget_range: string | null;
  completion_date: string | null;
  location: string | null;
  country: string | null;
  awards: string[];
  press_mentions: string[];
  collaborators: string[];
  is_featured: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  images?: ReferenceImage[];
  team_members?: ReferenceTeamMember[];
}

export interface ReferenceImage {
  id: string;
  reference_id: string;
  storage_path: string | null;
  url: string | null;
  caption: string | null;
  credits: string | null;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
}

export interface ReferenceTeamMember {
  id: string;
  reference_id: string;
  role: string;
  company_name: string | null;
  crm_company_id: string | null;
  contact_name: string | null;
  sort_order: number;
  created_at: string;
}

export type CreateReferenceInput = Omit<ProjectReference, "id" | "workspace_id" | "created_at" | "updated_at" | "images" | "team_members">;
export type UpdateReferenceInput = Partial<CreateReferenceInput> & { id: string };

export function useReferences(filters?: { type?: string; featured?: boolean }) {
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const referencesQuery = useQuery({
    queryKey: ["references", activeWorkspace?.id, filters],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("project_references")
        .select("*, images:reference_images(*), team_members:reference_team_members(*)")
        .eq("workspace_id", activeWorkspace.id)
        .order("sort_order", { ascending: true });

      if (filters?.type) {
        query = query.eq("project_type", filters.type);
      }
      if (filters?.featured) {
        query = query.eq("is_featured", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ProjectReference[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createReference = useMutation({
    mutationFn: async (input: CreateReferenceInput) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");
      const { data, error } = await supabase
        .from("project_references")
        .insert({ ...input, workspace_id: activeWorkspace.id })
        .select()
        .single();
      if (error) throw error;
      return data as ProjectReference;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["references"] });
      toast({ title: "Référence créée" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateReference = useMutation({
    mutationFn: async ({ id, ...input }: UpdateReferenceInput) => {
      const { data, error } = await supabase
        .from("project_references")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ProjectReference;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["references"] });
      toast({ title: "Référence mise à jour" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteReference = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_references").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["references"] });
      toast({ title: "Référence supprimée" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Image mutations
  const addImage = useMutation({
    mutationFn: async (input: Omit<ReferenceImage, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("reference_images")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["references"] }),
  });

  const deleteImage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reference_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["references"] }),
  });

  // Team mutations
  const addTeamMember = useMutation({
    mutationFn: async (input: Omit<ReferenceTeamMember, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("reference_team_members")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["references"] }),
  });

  const deleteTeamMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reference_team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["references"] }),
  });

  return {
    references: referencesQuery.data || [],
    isLoading: referencesQuery.isLoading,
    createReference,
    updateReference,
    deleteReference,
    addImage,
    deleteImage,
    addTeamMember,
    deleteTeamMember,
  };
}
