import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logEntityActivity } from './useEntityActivities';

interface ConvertLeadInput {
  leadId: string;
  projectName: string;
  projectType: string;
  description?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  surface?: number;
  budget?: number;
}

export function useConvertLead(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: ConvertLeadInput) => {
      if (!workspaceId) throw new Error('No workspace');

      // Get lead details first
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', input.leadId)
        .single();

      if (leadError) throw leadError;

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          workspace_id: workspaceId,
          name: input.projectName,
          project_type: input.projectType,
          description: input.description,
          address: input.address,
          city: input.city,
          postal_code: input.postalCode,
          surface: input.surface,
          budget: input.budget,
          crm_company_id: lead.crm_company_id,
          lead_id: input.leadId,
          status: 'active',
          created_by: user?.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Update lead with project reference and status
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          project_id: project.id,
          status: 'won',
        })
        .eq('id', input.leadId);

      if (updateError) throw updateError;

      // Log activity for the conversion
      if (workspaceId) {
        await logEntityActivity(workspaceId, user?.id, {
          entity_type: 'lead',
          entity_id: input.leadId,
          related_entity_type: 'project',
          related_entity_id: project.id,
          activity_type: 'converted',
          title: 'Lead converti en projet',
          description: `Le lead "${lead.title}" a été converti en projet "${project.name}"`,
          metadata: {
            lead_value: lead.estimated_value,
            project_type: input.projectType,
          }
        });

        await logEntityActivity(workspaceId, user?.id, {
          entity_type: 'project',
          entity_id: project.id,
          related_entity_type: 'lead',
          related_entity_id: input.leadId,
          activity_type: 'created',
          title: 'Projet créé depuis un lead',
          description: `Projet créé à partir du lead "${lead.title}"`,
          metadata: {
            source: 'lead_conversion',
            lead_value: lead.estimated_value,
          }
        });
      }

      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['entity-activities'] });
      queryClient.invalidateQueries({ queryKey: ['entity-relations'] });
      toast.success(`Projet "${project.name}" créé avec succès`);
    },
    onError: (error) => {
      console.error('Failed to convert lead:', error);
      toast.error('Erreur lors de la conversion du lead');
    },
  });
}
