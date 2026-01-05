import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MaterialCategory {
  id: string;
  workspace_id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  children?: MaterialCategory[];
}

export interface Material {
  id: string;
  workspace_id: string;
  category_id: string | null;
  name: string;
  reference: string | null;
  manufacturer: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  description: string | null;
  specifications: Record<string, any>;
  dimensions: { length?: number; width?: number; height?: number; unit?: string } | null;
  weight: number | null;
  weight_unit: string;
  price_unit: number | null;
  price_currency: string;
  unit: string;
  lead_time_days: number | null;
  min_order_quantity: number | null;
  images: string[];
  documents: string[];
  certifications: string[];
  sustainability_score: number | null;
  tags: string[];
  is_favorite: boolean;
  is_archived: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  category?: MaterialCategory;
}

export interface ProjectMaterial {
  id: string;
  project_id: string;
  material_id: string;
  quantity: number | null;
  unit: string | null;
  location_notes: string | null;
  status: "specified" | "ordered" | "delivered" | "installed";
  supplier_quote: number | null;
  notes: string | null;
  created_at: string;
  material?: Material;
}

export type CreateMaterialInput = Omit<Material, "id" | "workspace_id" | "created_at" | "updated_at" | "category">;
export type UpdateMaterialInput = Partial<CreateMaterialInput> & { id: string };

export function useMaterialCategories() {
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ["material-categories", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const { data, error } = await supabase
        .from("material_categories")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("sort_order");
      if (error) throw error;
      
      // Build tree structure
      const categories = data as MaterialCategory[];
      const categoryMap = new Map<string, MaterialCategory>();
      const roots: MaterialCategory[] = [];
      
      categories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });
      
      categories.forEach(cat => {
        const current = categoryMap.get(cat.id)!;
        if (cat.parent_id) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) parent.children!.push(current);
        } else {
          roots.push(current);
        }
      });
      
      return roots;
    },
    enabled: !!activeWorkspace?.id,
  });

  const createCategory = useMutation({
    mutationFn: async (input: { name: string; parent_id?: string; icon?: string; color?: string }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");
      const { data, error } = await supabase
        .from("material_categories")
        .insert({ ...input, workspace_id: activeWorkspace.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      toast({ title: "Catégorie créée" });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("material_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["material-categories"] });
      toast({ title: "Catégorie supprimée" });
    },
  });

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    createCategory,
    deleteCategory,
  };
}

export function useMaterials(filters?: { categoryId?: string; favorite?: boolean; search?: string }) {
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const materialsQuery = useQuery({
    queryKey: ["materials", activeWorkspace?.id, filters],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("materials")
        .select("*, category:material_categories(*)")
        .eq("workspace_id", activeWorkspace.id)
        .eq("is_archived", false)
        .order("name");

      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }
      if (filters?.favorite) {
        query = query.eq("is_favorite", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let materials = data as Material[];
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        materials = materials.filter(m => 
          m.name.toLowerCase().includes(s) || 
          m.reference?.toLowerCase().includes(s) ||
          m.manufacturer?.toLowerCase().includes(s)
        );
      }
      return materials;
    },
    enabled: !!activeWorkspace?.id,
  });

  const createMaterial = useMutation({
    mutationFn: async (input: CreateMaterialInput) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");
      const { data, error } = await supabase
        .from("materials")
        .insert({ ...input, workspace_id: activeWorkspace.id })
        .select()
        .single();
      if (error) throw error;
      return data as Material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast({ title: "Matériau créé" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const updateMaterial = useMutation({
    mutationFn: async ({ id, ...input }: UpdateMaterialInput) => {
      const { data, error } = await supabase
        .from("materials")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Material;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast({ title: "Matériau mis à jour" });
    },
  });

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("materials")
        .update({ is_archived: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast({ title: "Matériau archivé" });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const { error } = await supabase
        .from("materials")
        .update({ is_favorite })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });

  return {
    materials: materialsQuery.data || [],
    isLoading: materialsQuery.isLoading,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    toggleFavorite,
  };
}

export function useProjectMaterials(projectId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const projectMaterialsQuery = useQuery({
    queryKey: ["project-materials", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_materials")
        .select("*, material:materials(*, category:material_categories(*))")
        .eq("project_id", projectId)
        .order("created_at");
      if (error) throw error;
      return data as ProjectMaterial[];
    },
    enabled: !!projectId,
  });

  const addMaterialToProject = useMutation({
    mutationFn: async (input: Omit<ProjectMaterial, "id" | "created_at" | "material">) => {
      const { data, error } = await supabase
        .from("project_materials")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-materials", projectId] });
      toast({ title: "Matériau ajouté au projet" });
    },
  });

  const updateProjectMaterial = useMutation({
    mutationFn: async ({ id, ...input }: Partial<ProjectMaterial> & { id: string }) => {
      const { error } = await supabase
        .from("project_materials")
        .update(input)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-materials", projectId] });
    },
  });

  const removeFromProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-materials", projectId] });
      toast({ title: "Matériau retiré" });
    },
  });

  return {
    projectMaterials: projectMaterialsQuery.data || [],
    isLoading: projectMaterialsQuery.isLoading,
    addMaterialToProject,
    updateProjectMaterial,
    removeFromProject,
  };
}
