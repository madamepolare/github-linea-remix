import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { AgencyDocument, DocumentCategory, DocumentType, DocumentStatus } from '@/lib/documentTypes';
import type { Json } from '@/integrations/supabase/types';

interface CreateDocumentInput {
  category: DocumentCategory;
  document_type: DocumentType;
  title: string;
  description?: string;
  project_id?: string;
  contact_id?: string;
  company_id?: string;
  content?: Record<string, unknown>;
  template_id?: string;
  valid_from?: string;
  valid_until?: string;
}

interface UpdateDocumentInput {
  id: string;
  title?: string;
  description?: string;
  project_id?: string | null;
  contact_id?: string | null;
  company_id?: string | null;
  content?: Record<string, unknown>;
  status?: DocumentStatus;
  pdf_url?: string;
  valid_from?: string | null;
  valid_until?: string | null;
  sent_at?: string | null;
  signed_at?: string | null;
}

export function useAgencyDocuments() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all documents
  const documentsQuery = useQuery({
    queryKey: ['agency-documents', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from('agency_documents')
        .select(`
          *,
          project:projects!agency_documents_project_id_fkey(id, name),
          contact:contacts!agency_documents_contact_id_fkey(id, name),
          company:crm_companies!agency_documents_company_id_fkey(id, name)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AgencyDocument[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Fetch documents by category
  const getDocumentsByCategory = (category: DocumentCategory) => {
    return useQuery({
      queryKey: ['agency-documents', activeWorkspace?.id, category],
      queryFn: async () => {
        if (!activeWorkspace?.id) return [];

        const { data, error } = await supabase
          .from('agency_documents')
          .select(`
            *,
            project:projects!agency_documents_project_id_fkey(id, name),
            contact:contacts!agency_documents_contact_id_fkey(id, name),
            company:crm_companies!agency_documents_company_id_fkey(id, name)
          `)
          .eq('workspace_id', activeWorkspace.id)
          .eq('category', category)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as AgencyDocument[];
      },
      enabled: !!activeWorkspace?.id,
    });
  };

  // Create document
  const createDocument = useMutation({
    mutationFn: async (input: CreateDocumentInput) => {
      if (!activeWorkspace?.id || !user?.id) {
        throw new Error('Workspace ou utilisateur non défini');
      }

      // Generate document number
      const { data: docNumber } = await supabase.rpc('generate_agency_document_number', {
        doc_type: input.document_type,
        ws_id: activeWorkspace.id,
      });

      const { data, error } = await supabase
        .from('agency_documents')
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user.id,
          document_number: docNumber as string,
          category: input.category,
          document_type: input.document_type,
          title: input.title,
          description: input.description,
          project_id: input.project_id,
          contact_id: input.contact_id,
          company_id: input.company_id,
          content: (input.content || {}) as Json,
          template_id: input.template_id,
          valid_from: input.valid_from,
          valid_until: input.valid_until,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-documents'] });
      toast.success('Document créé avec succès');
    },
    onError: (error) => {
      console.error('Error creating document:', error);
      toast.error('Erreur lors de la création du document');
    },
  });

  // Update document
  const updateDocument = useMutation({
    mutationFn: async ({ id, ...input }: UpdateDocumentInput) => {
      const updateData: Record<string, unknown> = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.project_id !== undefined) updateData.project_id = input.project_id;
      if (input.contact_id !== undefined) updateData.contact_id = input.contact_id;
      if (input.company_id !== undefined) updateData.company_id = input.company_id;
      if (input.content !== undefined) updateData.content = input.content as Json;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.pdf_url !== undefined) updateData.pdf_url = input.pdf_url;
      if (input.valid_from !== undefined) updateData.valid_from = input.valid_from;
      if (input.valid_until !== undefined) updateData.valid_until = input.valid_until;
      if (input.sent_at !== undefined) updateData.sent_at = input.sent_at;
      if (input.signed_at !== undefined) updateData.signed_at = input.signed_at;

      const { data, error } = await supabase
        .from('agency_documents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-documents'] });
      toast.success('Document mis à jour');
    },
    onError: (error) => {
      console.error('Error updating document:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Delete document
  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agency_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-documents'] });
      toast.success('Document supprimé');
    },
    onError: (error) => {
      console.error('Error deleting document:', error);
      toast.error('Erreur lors de la suppression');
    },
  });

  // Get single document
  const getDocument = (id: string) => {
    return useQuery({
      queryKey: ['agency-document', id, activeWorkspace?.id],
      queryFn: async () => {
        if (!activeWorkspace?.id) throw new Error('Aucun workspace actif');
        
        const { data, error } = await supabase
          .from('agency_documents')
          .select(`
            *,
            project:projects!agency_documents_project_id_fkey(id, name),
            contact:contacts!agency_documents_contact_id_fkey(id, name),
            company:crm_companies!agency_documents_company_id_fkey(id, name)
          `)
          .eq('id', id)
          .eq('workspace_id', activeWorkspace.id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Document introuvable dans ce workspace');
        return data as AgencyDocument;
      },
      enabled: !!id && !!activeWorkspace?.id,
    });
  };

  // Get stats
  const statsQuery = useQuery({
    queryKey: ['agency-documents-stats', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: documents } = await supabase
        .from('agency_documents')
        .select('id, status, category, created_at')
        .eq('workspace_id', activeWorkspace.id);

      if (!documents) return null;

      const thisMonth = documents.filter(d => d.created_at >= startOfMonth);
      const pending = documents.filter(d => d.status === 'sent');
      const invoices = documents.filter(d => d.category === 'project' && d.status !== 'signed');

      return {
        total: documents.length,
        thisMonth: thisMonth.length,
        pending: pending.length,
        invoicesInProgress: invoices.length,
      };
    },
    enabled: !!activeWorkspace?.id,
  });

  return {
    documents: documentsQuery.data ?? [],
    isLoading: documentsQuery.isLoading,
    stats: statsQuery.data,
    getDocumentsByCategory,
    getDocument,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}
