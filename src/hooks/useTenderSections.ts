import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface TenderSection {
  id: string;
  tender_id: string;
  section_type: string;
  sort_order: number;
  title: string;
  content: string | null;
  ai_generated: boolean;
  ai_source_documents: string[] | null;
  last_edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
}

export const SECTION_TYPES = [
  { value: "presentation", label: "Présentation de l'équipe" },
  { value: "references", label: "Références et expériences" },
  { value: "methodologie", label: "Note méthodologique" },
  { value: "equipe", label: "Moyens humains" },
  { value: "planning", label: "Planning prévisionnel" },
  { value: "qualite", label: "Démarche qualité" },
  { value: "environnement", label: "Approche environnementale" },
  { value: "autre", label: "Autre section" },
];

export function useTenderSections(tenderId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["tender-sections", tenderId],
    queryFn: async () => {
      if (!tenderId) return [];
      
      const { data, error } = await supabase
        .from("tender_technical_sections")
        .select("*")
        .eq("tender_id", tenderId)
        .order("sort_order");
      
      if (error) throw error;
      return data as TenderSection[];
    },
    enabled: !!tenderId,
  });

  const addSection = useMutation({
    mutationFn: async (section: {
      section_type: string;
      title: string;
      content?: string;
    }) => {
      if (!tenderId) throw new Error("No tender ID");

      const { data, error } = await supabase
        .from("tender_technical_sections")
        .insert({
          tender_id: tenderId,
          section_type: section.section_type,
          title: section.title,
          content: section.content || "",
          sort_order: sections.length,
          ai_generated: false,
          last_edited_by: user?.id,
          last_edited_at: new Date().toISOString(),
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-sections", tenderId] });
      toast.success("Section ajoutée");
    },
  });

  const updateSection = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TenderSection> & { id: string }) => {
      const { data, error } = await supabase
        .from("tender_technical_sections")
        .update({
          ...updates,
          last_edited_by: user?.id,
          last_edited_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-sections", tenderId] });
    },
  });

  const deleteSection = useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await supabase
        .from("tender_technical_sections")
        .delete()
        .eq("id", sectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-sections", tenderId] });
      toast.success("Section supprimée");
    },
  });

  const reorderSections = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("tender_technical_sections")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-sections", tenderId] });
    },
  });

  const generateWithAI = useMutation({
    mutationFn: async ({ 
      sectionId, 
      sectionType,
      prompt,
    }: { 
      sectionId: string;
      sectionType: string;
      prompt?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("generate-tender-section", {
        body: {
          tenderId,
          sectionType,
          prompt,
        },
      });

      if (error) throw error;

      // Update section with generated content
      await supabase
        .from("tender_technical_sections")
        .update({
          content: data.content,
          ai_generated: true,
          last_edited_by: user?.id,
          last_edited_at: new Date().toISOString(),
        })
        .eq("id", sectionId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-sections", tenderId] });
      toast.success("Contenu généré avec l'IA");
    },
    onError: (error) => {
      toast.error("Erreur lors de la génération");
      console.error(error);
    },
  });

  return {
    sections,
    isLoading,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    generateWithAI,
  };
}
