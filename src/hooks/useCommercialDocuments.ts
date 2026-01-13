import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { 
  CommercialDocument, 
  CommercialDocumentPhase, 
  CommercialDocumentItem,
  DocumentType,
  ProjectType,
  DocumentStatus,
  FeeMode
} from '@/lib/commercialTypes';

export interface CreateDocumentInput {
  document_type: DocumentType;
  title: string;
  description?: string;
  client_company_id?: string;
  client_contact_id?: string;
  project_type: ProjectType;
  project_address?: string;
  project_city?: string;
  project_surface?: number;
  project_budget?: number;
  construction_budget?: number;
  construction_budget_disclosed?: boolean;
  fee_mode?: FeeMode;
  fee_percentage?: number;
  hourly_rate?: number;
  validity_days?: number;
  payment_terms?: string;
  special_conditions?: string;
  general_conditions?: string;
  contract_type_id?: string;
  vat_rate?: number;
  vat_type?: string;
  header_text?: string;
  footer_text?: string;
  notes?: string;
}

export interface UpdateDocumentInput extends Partial<CreateDocumentInput> {
  id: string;
  status?: DocumentStatus;
  total_amount?: number;
  valid_until?: string;
  sent_at?: string;
  accepted_at?: string;
  signed_at?: string;
  project_id?: string;
}

export interface CreatePhaseInput {
  document_id: string;
  phase_code: string;
  phase_name: string;
  phase_description?: string;
  percentage_fee?: number;
  amount?: number;
  is_included?: boolean;
  deliverables?: string[];
  start_date?: string;
  end_date?: string;
  sort_order?: number;
}

export interface UpdatePhaseInput extends Partial<CreatePhaseInput> {
  id: string;
}

export interface CreateItemInput {
  document_id: string;
  phase_id?: string;
  item_type: 'mission' | 'option' | 'expense' | 'discount';
  description: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  amount?: number;
  is_optional?: boolean;
  sort_order?: number;
}

export const useCommercialDocuments = () => {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['commercial-documents', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from('commercial_documents')
        .select(`
          *,
          client_company:crm_companies(id, name, logo_url),
          client_contact:contacts(id, name, email),
          project:projects(id, name)
        `)
        .eq('workspace_id', activeWorkspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CommercialDocument[];
    },
    enabled: !!activeWorkspace?.id
  });

  const getDocument = (id: string) => {
    return useQuery({
      queryKey: ['commercial-document', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('commercial_documents')
          .select(`
            *,
            client_company:crm_companies(id, name, logo_url),
            client_contact:contacts(id, name, email),
            project:projects(id, name)
          `)
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Document introuvable');
        return data as CommercialDocument;
      },
      enabled: !!id
    });
  };

  const getDocumentPhases = (documentId: string) => {
    return useQuery({
      queryKey: ['commercial-document-phases', documentId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('commercial_document_phases')
          .select('*')
          .eq('document_id', documentId)
          .order('sort_order');

        if (error) throw error;
        return data as CommercialDocumentPhase[];
      },
      enabled: !!documentId
    });
  };

  const getDocumentItems = (documentId: string) => {
    return useQuery({
      queryKey: ['commercial-document-items', documentId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('commercial_document_items')
          .select('*')
          .eq('document_id', documentId)
          .order('sort_order');

        if (error) throw error;
        return data as CommercialDocumentItem[];
      },
      enabled: !!documentId
    });
  };

  const createDocument = useMutation({
    mutationFn: async (input: CreateDocumentInput) => {
      if (!activeWorkspace?.id) throw new Error('Aucun workspace actif');

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error('Session expirée — reconnectez-vous');

      console.info('[createDocument] Inserting into workspace', activeWorkspace.id);

      const { data, error } = await supabase
        .from('commercial_documents')
        .insert({
          ...input,
          workspace_id: activeWorkspace.id,
          created_by: userData.user.id,
          document_number: '' // Will be auto-generated by trigger
        })
        .select()
        .single();

      if (error) {
        console.error('[createDocument] Insert error', error);
        throw error;
      }

      console.info('[createDocument] Created document', data.id, data.document_number);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commercial-documents', activeWorkspace?.id] });
      toast.success(`Devis ${data.document_number || data.id.slice(0, 8)} créé`);
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Erreur lors de la création';
      toast.error(msg);
      console.error('[createDocument] onError', error);
    }
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, ...input }: UpdateDocumentInput) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error('Session expirée — reconnectez-vous');

      const { data, error } = await supabase
        .from('commercial_documents')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commercial-documents', activeWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['commercial-document', data.id] });
      toast.success('Document mis à jour');
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : 'Erreur lors de la mise à jour';
      toast.error(msg);
      console.error(error);
    }
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commercial_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial-documents', activeWorkspace?.id] });
      toast.success('Document supprimé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  });

  // Phases mutations
  const createPhase = useMutation({
    mutationFn: async (input: CreatePhaseInput) => {
      const { data, error } = await supabase
        .from('commercial_document_phases')
        .insert({
          ...input,
          deliverables: input.deliverables || []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commercial-document-phases', data.document_id] });
    }
  });

  const updatePhase = useMutation({
    mutationFn: async ({ id, ...input }: UpdatePhaseInput) => {
      const { data, error } = await supabase
        .from('commercial_document_phases')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commercial-document-phases', data.document_id] });
    }
  });

  const deletePhase = useMutation({
    mutationFn: async ({ id, documentId }: { id: string; documentId: string }) => {
      const { error } = await supabase
        .from('commercial_document_phases')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { documentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commercial-document-phases', data.documentId] });
    }
  });

  const updatePhasesOrder = useMutation({
    mutationFn: async ({ phases, documentId }: { phases: { id: string; sort_order: number }[]; documentId: string }) => {
      const updates = phases.map(p => 
        supabase
          .from('commercial_document_phases')
          .update({ sort_order: p.sort_order })
          .eq('id', p.id)
      );

      await Promise.all(updates);
      return { documentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commercial-document-phases', data.documentId] });
    }
  });

  // Items mutations
  const createItem = useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const { data, error } = await supabase
        .from('commercial_document_items')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commercial-document-items', data.document_id] });
    }
  });

  const deleteItem = useMutation({
    mutationFn: async ({ id, documentId }: { id: string; documentId: string }) => {
      const { error } = await supabase
        .from('commercial_document_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { documentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commercial-document-items', data.documentId] });
    }
  });

  // Accept document and create project
  const acceptAndCreateProject = useMutation({
    mutationFn: async ({ 
      documentId, 
      phases,
      useAIPlanning = true,
      projectStartDate,
      projectEndDate
    }: { 
      documentId: string; 
      phases: CommercialDocumentPhase[];
      useAIPlanning?: boolean;
      projectStartDate?: string;
      projectEndDate?: string;
    }) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Get full document data
      const { data: doc, error: docError } = await supabase
        .from('commercial_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;

      // Prepare phases for planning
      const includedPhases = phases.filter(p => p.is_included);
      let plannedPhases: Array<{
        name: string;
        start_date: string | null;
        end_date: string | null;
      }> = includedPhases.map(p => ({
        name: p.phase_name,
        start_date: p.start_date || null,
        end_date: p.end_date || null
      }));

      // Use AI to suggest phase planning if enabled and we have dates
      const startDate = projectStartDate || new Date().toISOString().split('T')[0];
      if (useAIPlanning && includedPhases.length > 0) {
        try {
          const { data: planningData, error: planningError } = await supabase.functions.invoke(
            'suggest-phase-planning',
            {
              body: {
                phases: includedPhases.map(p => ({
                  name: p.phase_name,
                  percentage_fee: p.percentage_fee || 15
                })),
                projectType: doc.project_type,
                projectStartDate: startDate,
                projectEndDate: projectEndDate,
                projectDescription: doc.description,
                projectBudget: doc.construction_budget || doc.project_budget,
                projectSurface: doc.project_surface
              }
            }
          );

          if (!planningError && planningData?.planned_phases) {
            console.log('AI planning result:', planningData);
            // Map AI suggestions back to phases
            plannedPhases = includedPhases.map(phase => {
              const aiPhase = planningData.planned_phases.find(
                (p: any) => p.name.toLowerCase().includes(phase.phase_name.toLowerCase()) ||
                           phase.phase_name.toLowerCase().includes(p.name.toLowerCase())
              );
              return {
                name: phase.phase_name,
                start_date: aiPhase?.start_date || null,
                end_date: aiPhase?.end_date || null
              };
            });
          }
        } catch (err) {
          console.error('AI planning failed, using default:', err);
        }
      }

      // Create project from document
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user.id,
          name: doc.title || 'Projet sans nom',
          description: doc.description,
          project_type: doc.project_type,
          crm_company_id: doc.client_company_id,
          address: doc.project_address,
          city: doc.project_city,
          surface_area: doc.project_surface,
          budget: doc.project_budget,
          start_date: startDate,
          end_date: projectEndDate,
          color: '#3B82F6',
          phase: 'planning',
          status: 'active'
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Create project phases from document phases with AI planning
      if (includedPhases.length > 0) {
        const projectPhases = includedPhases.map((phase, index) => {
          const planned = plannedPhases.find(p => p.name === phase.phase_name);
          const deliverables = Array.isArray(phase.deliverables) ? phase.deliverables : [];
          return {
            workspace_id: activeWorkspace.id,
            project_id: project.id,
            name: phase.phase_name,
            description: phase.phase_description,
            sort_order: index,
            status: 'pending' as const,
            start_date: planned?.start_date || phase.start_date,
            end_date: planned?.end_date || phase.end_date,
            color: null,
            // Include new fields for full data transfer
            phase_code: phase.phase_code,
            percentage_fee: phase.percentage_fee,
            deliverables: deliverables
          };
        });

        const { error: phasesError } = await supabase
          .from('project_phases')
          .insert(projectPhases);

        if (phasesError) {
          console.error('Error creating project phases:', phasesError);
        }
      }

      // Update document with project link and accepted status
      const { error: updateError } = await supabase
        .from('commercial_documents')
        .update({
          project_id: project.id,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      return { document: doc, project };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['commercial-documents'] });
      queryClient.invalidateQueries({ queryKey: ['commercial-document', data.document.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Document accepté et projet créé avec planning IA');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création du projet');
      console.error(error);
    }
  });

  // Duplicate document
  const duplicateDocument = useMutation({
    mutationFn: async (documentId: string) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      // Get original document
      const { data: originalDoc, error: docError } = await supabase
        .from('commercial_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;

      // Get original phases
      const { data: originalPhases, error: phasesError } = await supabase
        .from('commercial_document_phases')
        .select('*')
        .eq('document_id', documentId)
        .order('sort_order');

      if (phasesError) throw phasesError;

      // Create new document (copy without id, dates, status)
      const { id, document_number, created_at, updated_at, sent_at, accepted_at, signed_at, project_id, status, ...docData } = originalDoc;
      
      const { data: newDoc, error: createError } = await supabase
        .from('commercial_documents')
        .insert({
          ...docData,
          title: `${docData.title} (copie)`,
          workspace_id: activeWorkspace.id,
          created_by: user.id,
          document_number: '', // Auto-generated
          status: 'draft'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Duplicate phases
      if (originalPhases && originalPhases.length > 0) {
        const newPhases = originalPhases.map(({ id, document_id, created_at, updated_at, ...phaseData }) => ({
          ...phaseData,
          document_id: newDoc.id
        }));

        const { error: phasesCreateError } = await supabase
          .from('commercial_document_phases')
          .insert(newPhases);

        if (phasesCreateError) {
          console.error('Error duplicating phases:', phasesCreateError);
        }
      }

      return newDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial-documents', activeWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['commercial-documents'] });
      toast.success('Document dupliqué');
    },
    onError: (error) => {
      toast.error('Erreur lors de la duplication');
      console.error(error);
    }
  });

  return {
    documents: documentsQuery.data || [],
    isLoading: documentsQuery.isLoading,
    getDocument,
    getDocumentPhases,
    getDocumentItems,
    createDocument,
    updateDocument,
    deleteDocument,
    createPhase,
    updatePhase,
    deletePhase,
    updatePhasesOrder,
    createItem,
    deleteItem,
    acceptAndCreateProject,
    duplicateDocument
  };
};
