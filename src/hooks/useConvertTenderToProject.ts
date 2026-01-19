import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logEntityActivity } from '@/hooks/useEntityActivities';

export interface ConvertTenderInput {
  tenderId: string;
  projectName: string;
  projectType: string;
  description?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  surface?: number;
  budget?: number;
  expectedStartDate?: string;
  expectedEndDate?: string;
  transferTeam?: boolean;
  transferTasks?: boolean;
}

export function useConvertTenderToProject(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: ConvertTenderInput) => {
      if (!workspaceId) throw new Error('No workspace');

      // Get tender details first
      const { data: tender, error: tenderError } = await supabase
        .from('tenders')
        .select(`
          *,
          tender_team_members(
            id,
            company_id,
            contact_id,
            role,
            specialty,
            is_mandataire
          )
        `)
        .eq('id', input.tenderId)
        .single();

      if (tenderError) throw tenderError;

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          workspace_id: workspaceId,
          name: input.projectName,
          project_type: input.projectType,
          description: input.description || tender.description,
          address: input.address || tender.location,
          city: input.city,
          postal_code: input.postalCode,
          surface: input.surface || tender.surface_area,
          budget: input.budget || tender.estimated_budget,
          start_date: input.expectedStartDate,
          end_date: input.expectedEndDate,
          crm_company_id: tender.client_company_id,
          tender_id: input.tenderId,
          status: 'active',
          created_by: user?.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Update tender with project reference and status
      const { error: updateError } = await supabase
        .from('tenders')
        .update({
          project_id: project.id,
          pipeline_status: 'gagnes',
        })
        .eq('id', input.tenderId);

      if (updateError) throw updateError;

      // Transfer team members if requested
      if (input.transferTeam && tender.tender_team_members?.length > 0) {
        const teamMembersToInsert = tender.tender_team_members.map((member: any) => ({
          project_id: project.id,
          workspace_id: workspaceId,
          company_id: member.company_id,
          contact_id: member.contact_id,
          role: member.role || member.specialty,
          is_lead: member.is_mandataire,
          created_by: user?.id,
        }));

        // Insert into project_members (if table exists)
        try {
          await supabase
            .from('project_members')
            .insert(teamMembersToInsert);
        } catch (e) {
          console.warn('Could not transfer team members:', e);
        }
      }

      // Transfer pending tasks if requested
      if (input.transferTasks) {
        const { error: tasksError } = await supabase
          .from('tasks')
          .update({ project_id: project.id })
          .eq('tender_id', input.tenderId)
          .eq('status', 'todo');

        if (tasksError) {
          console.warn('Could not transfer tasks:', tasksError);
        }
      }

      // Log activity for the conversion
      if (workspaceId) {
        await logEntityActivity(workspaceId, user?.id, {
          entity_type: 'tender',
          entity_id: input.tenderId,
          related_entity_type: 'project',
          related_entity_id: project.id,
          activity_type: 'converted',
          title: 'AO converti en projet',
          description: `L'appel d'offres "${tender.title}" a été converti en projet "${project.name}"`,
          metadata: {
            tender_budget: tender.estimated_budget,
            project_type: input.projectType,
          }
        });

        await logEntityActivity(workspaceId, user?.id, {
          entity_type: 'project',
          entity_id: project.id,
          related_entity_type: 'tender',
          related_entity_id: input.tenderId,
          activity_type: 'created',
          title: 'Projet créé depuis un AO',
          description: `Projet créé à partir de l'appel d'offres "${tender.title}"`,
          metadata: {
            source: 'tender_conversion',
            tender_budget: tender.estimated_budget,
          }
        });
      }

      return project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['entity-activities'] });
      toast.success(`Projet "${project.name}" créé avec succès`);
    },
    onError: (error) => {
      console.error('Failed to convert tender:', error);
      toast.error('Erreur lors de la conversion de l\'appel d\'offres');
    },
  });
}
