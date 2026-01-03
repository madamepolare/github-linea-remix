import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KnowledgeEntry {
  id: string;
  workspace_id: string;
  category: string | null;
  title: string;
  content: string | null;
  tags: string[] | null;
  project_types: string[] | null;
  usage_count: number | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const KNOWLEDGE_CATEGORIES = [
  { value: "paragraph", label: "Paragraphe type" },
  { value: "reference", label: "Référence projet" },
  { value: "template", label: "Template complet" },
  { value: "section", label: "Section type" },
  { value: "competence", label: "Compétence / CV" },
];

export function useKnowledgeBase(category?: string) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["knowledge-base", activeWorkspace?.id, category],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      let query = supabase
        .from("knowledge_base_entries")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("usage_count", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as KnowledgeEntry[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const addEntry = useMutation({
    mutationFn: async (entry: {
      title: string;
      content: string;
      category: string;
      tags?: string[];
      project_types?: string[];
    }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("knowledge_base_entries")
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user?.id,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          tags: entry.tags || [],
          project_types: entry.project_types || [],
          usage_count: 0,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      toast.success("Entrée ajoutée");
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<KnowledgeEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("knowledge_base_entries")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from("knowledge_base_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
      toast.success("Entrée supprimée");
    },
  });

  const incrementUsage = useMutation({
    mutationFn: async (entryId: string) => {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;

      const { error } = await supabase
        .from("knowledge_base_entries")
        .update({ usage_count: (entry.usage_count || 0) + 1 })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
    },
  });

  const searchEntries = async (query: string) => {
    if (!activeWorkspace?.id) return [];

    const { data, error } = await supabase
      .from("knowledge_base_entries")
      .select("*")
      .eq("workspace_id", activeWorkspace.id)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("usage_count", { ascending: false })
      .limit(10);

    if (error) throw error;
    return data as KnowledgeEntry[];
  };

  return {
    entries,
    isLoading,
    addEntry,
    updateEntry,
    deleteEntry,
    incrementUsage,
    searchEntries,
  };
}
