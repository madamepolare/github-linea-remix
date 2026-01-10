import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DocumentationCategory {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number | null;
  parent_id: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DocumentationPage {
  id: string;
  workspace_id: string;
  category_id: string | null;
  parent_page_id: string | null;
  title: string;
  slug: string;
  emoji: string | null;
  objective: string | null;
  context: string | null;
  content: string | null;
  steps: { id: string; title: string; description: string; completed?: boolean }[];
  checklist: { id: string; label: string; checked: boolean }[];
  tips: string | null;
  tags: string[] | null;
  page_type: string | null;
  is_template: boolean | null;
  is_published: boolean | null;
  sort_order: number | null;
  view_count: number | null;
  created_by: string | null;
  last_edited_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  category?: DocumentationCategory;
}

export const DOCUMENTATION_PAGE_TYPES = [
  { value: "standard", label: "Page standard", icon: "📄" },
  { value: "workflow", label: "Workflow / Processus", icon: "🔄" },
  { value: "checklist", label: "Checklist", icon: "✅" },
  { value: "role", label: "Fiche de rôle", icon: "👤" },
  { value: "tool", label: "Outil / Ressource", icon: "🔧" },
  { value: "template", label: "Template", icon: "📋" },
];

export const DOCUMENTATION_TAGS = [
  { value: "onboarding", label: "Onboarding", color: "bg-success/10 text-success" },
  { value: "internal", label: "Interne", color: "bg-primary/10 text-primary" },
  { value: "client", label: "Client", color: "bg-info/10 text-info" },
  { value: "urgent", label: "Urgent", color: "bg-destructive/10 text-destructive" },
  { value: "mandatory", label: "Obligatoire", color: "bg-warning/10 text-warning" },
  { value: "best-practice", label: "Bonne pratique", color: "bg-accent/10 text-accent" },
];

export function useDocumentationCategories() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["documentation-categories", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("documentation_categories")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as DocumentationCategory[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createCategory = useMutation({
    mutationFn: async (category: {
      name: string;
      slug: string;
      description?: string;
      icon?: string;
      color?: string;
      parent_id?: string;
      sort_order?: number;
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("documentation_categories")
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
          ...category,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentation-categories"] });
      toast.success("Catégorie créée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de la catégorie");
      console.error(error);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DocumentationCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("documentation_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentation-categories"] });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("documentation_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentation-categories"] });
      toast.success("Catégorie supprimée");
    },
  });

  return {
    categories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

export function useDocumentationPages(categoryId?: string) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["documentation-pages", activeWorkspace?.id, categoryId],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from("documentation_pages")
        .select("*, category:documentation_categories(*)")
        .eq("workspace_id", activeWorkspace.id)
        .order("sort_order", { ascending: true });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DocumentationPage[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createPage = useMutation({
    mutationFn: async (page: {
      title: string;
      slug: string;
      category_id?: string;
      parent_page_id?: string;
      emoji?: string;
      objective?: string;
      context?: string;
      content?: string;
      steps?: any[];
      checklist?: any[];
      tips?: string;
      tags?: string[];
      page_type?: string;
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("documentation_pages")
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
          last_edited_by: user?.id,
          ...page,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentation-pages"] });
      toast.success("Page créée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de la page");
      console.error(error);
    },
  });

  const updatePage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DocumentationPage> & { id: string }) => {
      const { data, error } = await supabase
        .from("documentation_pages")
        .update({
          ...updates,
          last_edited_by: user?.id,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentation-pages"] });
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("documentation_pages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentation-pages"] });
      toast.success("Page supprimée");
    },
  });

  const incrementViewCount = useMutation({
    mutationFn: async (id: string) => {
      const page = pages.find(p => p.id === id);
      if (!page) return;

      const { error } = await supabase
        .from("documentation_pages")
        .update({ view_count: (page.view_count || 0) + 1 })
        .eq("id", id);

      if (error) throw error;
    },
  });

  return {
    pages,
    isLoading,
    createPage,
    updatePage,
    deletePage,
    incrementViewCount,
  };
}

export function useDocumentationPage(pageId: string | undefined) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: page, isLoading } = useQuery({
    queryKey: ["documentation-page", pageId],
    queryFn: async () => {
      if (!pageId) return null;

      const { data, error } = await supabase
        .from("documentation_pages")
        .select("*, category:documentation_categories(*)")
        .eq("id", pageId)
        .single();

      if (error) throw error;
      return data as DocumentationPage;
    },
    enabled: !!pageId,
  });

  const updatePage = useMutation({
    mutationFn: async (updates: Partial<DocumentationPage>) => {
      if (!pageId) throw new Error("No page ID");

      const { data, error } = await supabase
        .from("documentation_pages")
        .update({
          ...updates,
          last_edited_by: user?.id,
        })
        .eq("id", pageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentation-page", pageId] });
      queryClient.invalidateQueries({ queryKey: ["documentation-pages"] });
    },
  });

  return {
    page,
    isLoading,
    updatePage,
  };
}

export function useDocumentationSearch() {
  const { activeWorkspace } = useAuth();

  const searchPages = async (query: string) => {
    if (!activeWorkspace?.id || !query.trim()) return [];

    const { data, error } = await supabase
      .from("documentation_pages")
      .select("*, category:documentation_categories(*)")
      .eq("workspace_id", activeWorkspace.id)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,objective.ilike.%${query}%`)
      .order("view_count", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data as DocumentationPage[];
  };

  const searchByTag = async (tag: string) => {
    if (!activeWorkspace?.id) return [];

    const { data, error } = await supabase
      .from("documentation_pages")
      .select("*, category:documentation_categories(*)")
      .eq("workspace_id", activeWorkspace.id)
      .contains("tags", [tag])
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data as DocumentationPage[];
  };

  return {
    searchPages,
    searchByTag,
  };
}
