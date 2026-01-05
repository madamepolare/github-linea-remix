import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ObjectCategory {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface DesignObject {
  id: string;
  workspace_id: string;
  category_id: string | null;
  name: string;
  brand: string | null;
  designer: string | null;
  description: string | null;
  dimensions: string | null;
  materials: string | null;
  colors: string[] | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  source_url: string | null;
  source_name: string | null;
  image_url: string | null;
  images: string[] | null;
  tags: string[] | null;
  is_favorite: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: ObjectCategory;
}

export interface ProjectObject {
  id: string;
  project_id: string;
  object_id: string;
  room: string | null;
  quantity: number;
  status: string;
  notes: string | null;
  added_by: string | null;
  created_at: string;
  object?: DesignObject;
}

export type CreateObjectInput = Omit<DesignObject, "id" | "workspace_id" | "created_at" | "updated_at" | "category">;
export type UpdateObjectInput = Partial<CreateObjectInput>;

export function useObjectCategories() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["object-categories", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from("object_categories")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("sort_order");

      if (error) throw error;
      return data as ObjectCategory[];
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useDesignObjects(filters?: { categoryId?: string; favorite?: boolean; search?: string }) {
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const objectsQuery = useQuery({
    queryKey: ["design-objects", activeWorkspace?.id, filters],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("design_objects")
        .select("*, category:object_categories(*)")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      if (filters?.favorite) {
        query = query.eq("is_favorite", true);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,designer.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DesignObject[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createObject = useMutation({
    mutationFn: async (input: CreateObjectInput) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("design_objects")
        .insert({ ...input, workspace_id: activeWorkspace.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-objects"] });
      toast({ title: "Objet créé" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateObject = useMutation({
    mutationFn: async ({ id, ...input }: UpdateObjectInput & { id: string }) => {
      const { data, error } = await supabase
        .from("design_objects")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-objects"] });
      toast({ title: "Objet mis à jour" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteObject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("design_objects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-objects"] });
      toast({ title: "Objet supprimé" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("design_objects")
        .update({ is_favorite: isFavorite })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["design-objects"] });
    },
  });

  return {
    objects: objectsQuery.data || [],
    isLoading: objectsQuery.isLoading,
    createObject,
    updateObject,
    deleteObject,
    toggleFavorite,
  };
}

export function useProjectObjects(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const projectObjectsQuery = useQuery({
    queryKey: ["project-objects", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_objects")
        .select("*, object:design_objects(*, category:object_categories(*))")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectObject[];
    },
    enabled: !!projectId,
  });

  const addObjectToProject = useMutation({
    mutationFn: async (input: { objectId: string; room?: string; quantity?: number; notes?: string }) => {
      const { data, error } = await supabase
        .from("project_objects")
        .insert({
          project_id: projectId,
          object_id: input.objectId,
          room: input.room,
          quantity: input.quantity || 1,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-objects", projectId] });
      toast({ title: "Objet ajouté au projet" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const removeObjectFromProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_objects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-objects", projectId] });
      toast({ title: "Objet retiré du projet" });
    },
  });

  const updateProjectObject = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; room?: string; quantity?: number; status?: string; notes?: string }) => {
      const { error } = await supabase
        .from("project_objects")
        .update(input)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-objects", projectId] });
    },
  });

  return {
    projectObjects: projectObjectsQuery.data || [],
    isLoading: projectObjectsQuery.isLoading,
    addObjectToProject,
    removeObjectFromProject,
    updateProjectObject,
  };
}

export function useCategoryMutations() {
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCategory = useMutation({
    mutationFn: async (input: { name: string; slug: string; description?: string; icon?: string; color?: string }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("object_categories")
        .insert({ ...input, workspace_id: activeWorkspace.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-categories"] });
      toast({ title: "Catégorie créée" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("object_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["object-categories"] });
      toast({ title: "Catégorie supprimée" });
    },
  });

  return { createCategory, deleteCategory };
}
