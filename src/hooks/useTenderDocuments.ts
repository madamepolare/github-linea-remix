import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TenderDocument } from "@/lib/tenderTypes";

export function useTenderDocuments(tenderId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, refetch } = useQuery({
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

  // Helper function to upload a single file
  const uploadSingleFile = async (file: File, documentType: string): Promise<TenderDocument | null> => {
    if (!tenderId) throw new Error("No tender ID");

    try {
      // Upload to storage with unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${tenderId}/${timestamp}_${randomSuffix}_${safeName}`;
      
      console.log(`[Upload] Starting upload: ${file.name}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("tender-documents")
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error(`[Upload] Storage error for ${file.name}:`, uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("tender-documents")
        .getPublicUrl(fileName);

      console.log(`[Upload] Stored at: ${publicUrl}`);

      // Create record in database
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

      if (error) {
        console.error(`[Upload] Database error for ${file.name}:`, error);
        throw error;
      }

      console.log(`[Upload] Successfully saved: ${file.name}`);
      return data as TenderDocument;
    } catch (err) {
      console.error(`[Upload] Failed for ${file.name}:`, err);
      throw err;
    }
  };

  const uploadDocument = useMutation({
    mutationFn: async ({ 
      file, 
      documentType 
    }: { 
      file: File; 
      documentType: string;
    }) => {
      return uploadSingleFile(file, documentType);
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

  // Upload multiple files at once
  const uploadMultipleDocuments = useMutation({
    mutationFn: async (files: Array<{ file: File; documentType: string }>) => {
      const results: TenderDocument[] = [];
      const errors: string[] = [];

      // Upload files sequentially to avoid conflicts
      for (const { file, documentType } of files) {
        try {
          const result = await uploadSingleFile(file, documentType);
          if (result) results.push(result);
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          errors.push(file.name);
        }
      }

      if (errors.length > 0) {
        throw new Error(`Échec pour: ${errors.join(', ')}`);
      }

      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tender-documents", tenderId] });
      toast.success(`${data.length} document(s) uploadé(s)`);
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["tender-documents", tenderId] });
      toast.error(error.message || "Erreur lors de l'upload");
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

  // Full DCE reanalysis - re-triggers analysis on ALL documents
  const reanalyzeAllDocuments = useMutation({
    mutationFn: async () => {
      if (!tenderId || documents.length === 0) {
        throw new Error("No documents to analyze");
      }

      // Get all document URLs and types
      const documentData = documents.map(doc => ({
        id: doc.id,
        url: doc.file_url,
        type: doc.document_type,
        name: doc.file_name,
      }));

      // Call the analysis edge function with all documents
      const { data, error } = await supabase.functions.invoke("analyze-dce-before-creation", {
        body: { 
          files: documentData.map(d => ({
            name: d.name,
            type: d.type,
            url: d.url,
          })),
          tenderId,
          forceReanalyze: true,
        },
      });

      if (error) throw error;

      // Mark all documents as analyzed
      for (const doc of documents) {
        await supabase
          .from("tender_documents")
          .update({
            is_analyzed: true,
            analyzed_at: new Date().toISOString(),
          })
          .eq("id", doc.id);
      }

      // Update tender with extracted analysis if available
      if (data?.analysis) {
        await supabase
          .from("tenders")
          .update({
            description: data.analysis.description || undefined,
          } as any)
          .eq("id", tenderId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-documents", tenderId] });
      queryClient.invalidateQueries({ queryKey: ["tender", tenderId] });
      queryClient.invalidateQueries({ queryKey: ["tender-criteria", tenderId] });
      toast.success("Analyse DCE terminée");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'analyse DCE");
      console.error(error);
    },
  });

  return {
    documents,
    isLoading,
    refetch,
    uploadDocument,
    uploadMultipleDocuments,
    deleteDocument,
    analyzeDocument,
    reanalyzeAllDocuments,
  };
}
