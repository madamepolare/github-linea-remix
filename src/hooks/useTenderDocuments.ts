import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TenderDocument } from "@/lib/tenderTypes";

export function useTenderDocuments(tenderId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["tender-documents", tenderId],
    queryFn: async () => {
      if (!tenderId) return [];
      
      const { data, error } = await supabase
        .from("tender_documents")
        .select("*")
        .eq("tender_id", tenderId)
        .order("uploaded_at", { ascending: false });
      
      if (error) throw error;
      return data as TenderDocument[];
    },
    enabled: !!tenderId,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({ 
      file, 
      documentType 
    }: { 
      file: File; 
      documentType: string;
    }) => {
      if (!tenderId) throw new Error("No tender ID");

      // Upload to storage
      const fileName = `${tenderId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("tender-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("tender-documents")
        .getPublicUrl(fileName);

      // Create record
      const { data, error } = await supabase
        .from("tender_documents")
        .insert({
          tender_id: tenderId,
          document_type: documentType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-documents", tenderId] });
      toast.success("Document uploadé");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'upload");
      console.error(error);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase
        .from("tender_documents")
        .delete()
        .eq("id", documentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-documents", tenderId] });
      toast.success("Document supprimé");
    },
  });

  const analyzeDocument = useMutation({
    mutationFn: async (documentId: string) => {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) throw new Error("Document not found");

      const { data, error } = await supabase.functions.invoke("analyze-tender-documents", {
        body: { 
          documentUrl: doc.file_url,
          documentType: doc.document_type,
          tenderId,
        },
      });

      if (error) throw error;

      // Update document with extracted data
      await supabase
        .from("tender_documents")
        .update({
          is_analyzed: true,
          analyzed_at: new Date().toISOString(),
          extracted_data: data.extractedData,
        })
        .eq("id", documentId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-documents", tenderId] });
      queryClient.invalidateQueries({ queryKey: ["tender", tenderId] });
      toast.success("Document analysé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'analyse");
      console.error(error);
    },
  });

  return {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    analyzeDocument,
  };
}
