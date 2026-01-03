import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { TenderRequiredDocument, DocumentCategory } from "@/lib/tenderTypes";
import { REQUIRED_DOCUMENT_TYPES } from "@/lib/tenderTypes";

export function useTenderRequiredDocuments(tenderId: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["tender-required-documents", tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tender_required_documents")
        .select("*")
        .eq("tender_id", tenderId)
        .order("document_category")
        .order("sort_order");

      if (error) throw error;
      return data as TenderRequiredDocument[];
    },
    enabled: !!tenderId,
  });

  const candidatureDocuments = documents.filter(d => d.document_category === 'candidature');
  const offreDocuments = documents.filter(d => d.document_category === 'offre');

  const addDocument = useMutation({
    mutationFn: async (data: {
      document_category: DocumentCategory;
      document_type: string;
      name: string;
      description?: string;
      is_mandatory?: boolean;
    }) => {
      if (!profile?.active_workspace_id) throw new Error("No workspace");
      
      const { data: doc, error } = await supabase
        .from("tender_required_documents")
        .insert({
          tender_id: tenderId,
          workspace_id: profile.active_workspace_id,
          document_category: data.document_category,
          document_type: data.document_type,
          name: data.name,
          description: data.description || null,
          is_mandatory: data.is_mandatory ?? true,
          sort_order: documents.filter(d => d.document_category === data.document_category).length,
        })
        .select()
        .single();

      if (error) throw error;
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-required-documents", tenderId] });
    },
    onError: (error) => {
      console.error("Error adding required document:", error);
      toast.error("Erreur lors de l'ajout du document requis");
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<TenderRequiredDocument>) => {
      const { data, error } = await supabase
        .from("tender_required_documents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-required-documents", tenderId] });
    },
    onError: (error) => {
      console.error("Error updating required document:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const toggleComplete = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from("tender_required_documents")
        .update({ is_completed })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-required-documents", tenderId] });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tender_required_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-required-documents", tenderId] });
      toast.success("Document requis supprimé");
    },
    onError: (error) => {
      console.error("Error deleting required document:", error);
      toast.error("Erreur lors de la suppression");
    },
  });

  const loadDefaultDocuments = useMutation({
    mutationFn: async () => {
      if (!profile?.active_workspace_id) throw new Error("No workspace");
      
      const allDocs: Array<{
        tender_id: string;
        workspace_id: string;
        document_category: string;
        document_type: string;
        name: string;
        is_mandatory: boolean;
        sort_order: number;
      }> = [];

      // Add candidature documents
      REQUIRED_DOCUMENT_TYPES.candidature.forEach((doc, index) => {
        allDocs.push({
          tender_id: tenderId,
          workspace_id: profile.active_workspace_id!,
          document_category: 'candidature',
          document_type: doc.value,
          name: doc.label,
          is_mandatory: doc.mandatory,
          sort_order: index,
        });
      });

      // Add offre documents
      REQUIRED_DOCUMENT_TYPES.offre.forEach((doc, index) => {
        allDocs.push({
          tender_id: tenderId,
          workspace_id: profile.active_workspace_id!,
          document_category: 'offre',
          document_type: doc.value,
          name: doc.label,
          is_mandatory: doc.mandatory,
          sort_order: index,
        });
      });

      const { error } = await supabase
        .from("tender_required_documents")
        .insert(allDocs);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-required-documents", tenderId] });
      toast.success("Documents par défaut chargés");
    },
    onError: (error) => {
      console.error("Error loading default documents:", error);
      toast.error("Erreur lors du chargement");
    },
  });

  // Calculate progress
  const candidatureProgress = candidatureDocuments.length > 0
    ? Math.round((candidatureDocuments.filter(d => d.is_completed).length / candidatureDocuments.length) * 100)
    : 0;

  const offreProgress = offreDocuments.length > 0
    ? Math.round((offreDocuments.filter(d => d.is_completed).length / offreDocuments.length) * 100)
    : 0;

  const totalProgress = documents.length > 0
    ? Math.round((documents.filter(d => d.is_completed).length / documents.length) * 100)
    : 0;

  return {
    documents,
    candidatureDocuments,
    offreDocuments,
    isLoading,
    addDocument,
    updateDocument,
    toggleComplete,
    deleteDocument,
    loadDefaultDocuments,
    candidatureProgress,
    offreProgress,
    totalProgress,
  };
}
