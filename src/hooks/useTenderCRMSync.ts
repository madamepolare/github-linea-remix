import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWorkspaceContext } from '@/hooks/useWorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SyncTenderClientInput {
  tenderId: string;
  clientName: string;
  clientType?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface SyncTenderPartnerInput {
  tenderId: string;
  companyName: string;
  specialty: string;
  contactName?: string;
  contactEmail?: string;
}

export function useTenderCRMSync() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspaceContext();
  const { user } = useAuth();

  // Sync client (MOA) to CRM
  const syncClientToCRM = useMutation({
    mutationFn: async (input: SyncTenderClientInput) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      // Check if company already exists
      const { data: existingCompany } = await supabase
        .from('crm_companies')
        .select('id')
        .eq('workspace_id', activeWorkspace.id)
        .ilike('name', input.clientName)
        .maybeSingle();

      let companyId = existingCompany?.id;

      if (!companyId) {
        // Create company
        const { data: newCompany, error: companyError } = await supabase
          .from('crm_companies')
          .insert({
            workspace_id: activeWorkspace.id,
            name: input.clientName,
            company_type: input.clientType || 'client',
            category: 'maitrise_ouvrage',
            is_client: true,
            created_by: user?.id,
          })
          .select('id')
          .single();

        if (companyError) throw companyError;
        companyId = newCompany.id;

        toast.success(`Client "${input.clientName}" ajouté au CRM`);
      }

      // Create contact if provided
      if (input.contactName && companyId) {
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('workspace_id', activeWorkspace.id)
          .eq('crm_company_id', companyId)
          .ilike('name', input.contactName)
          .maybeSingle();

        if (!existingContact) {
          await supabase
            .from('contacts')
            .insert({
              workspace_id: activeWorkspace.id,
              crm_company_id: companyId,
              name: input.contactName,
              email: input.contactEmail,
              phone: input.contactPhone,
              role: 'MOA',
              created_by: user?.id,
            });
        }
      }

      // Link company to tender
      await supabase
        .from('tenders')
        .update({ client_company_id: companyId })
        .eq('id', input.tenderId);

      return { companyId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-companies'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
    },
    onError: (error) => {
      console.error('Failed to sync client to CRM:', error);
      toast.error('Erreur lors de la synchronisation avec le CRM');
    },
  });

  // Sync partner (BET, cotraitant) to CRM
  const syncPartnerToCRM = useMutation({
    mutationFn: async (input: SyncTenderPartnerInput) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      // Check if company already exists
      const { data: existingCompany } = await supabase
        .from('crm_companies')
        .select('id')
        .eq('workspace_id', activeWorkspace.id)
        .ilike('name', input.companyName)
        .maybeSingle();

      let companyId = existingCompany?.id;

      if (!companyId) {
        // Create company as partner
        const { data: newCompany, error: companyError } = await supabase
          .from('crm_companies')
          .insert({
            workspace_id: activeWorkspace.id,
            name: input.companyName,
            company_type: 'partner',
            category: 'bureau_etudes',
            bet_specialties: [input.specialty],
            is_partner: true,
            created_by: user?.id,
          })
          .select('id')
          .single();

        if (companyError) throw companyError;
        companyId = newCompany.id;

        toast.success(`Partenaire "${input.companyName}" ajouté au CRM`);
      } else {
        // Update BET specialties if company exists
        const { data: company } = await supabase
          .from('crm_companies')
          .select('bet_specialties')
          .eq('id', companyId)
          .single();

        const currentSpecialties = company?.bet_specialties || [];
        if (!currentSpecialties.includes(input.specialty)) {
          await supabase
            .from('crm_companies')
            .update({
              bet_specialties: [...currentSpecialties, input.specialty],
              is_partner: true,
            })
            .eq('id', companyId);
        }
      }

      // Create contact if provided
      if (input.contactName && companyId) {
        const { data: existingContact } = await supabase
          .from('contacts')
          .select('id')
          .eq('workspace_id', activeWorkspace.id)
          .eq('crm_company_id', companyId)
          .ilike('name', input.contactName)
          .maybeSingle();

        if (!existingContact) {
          await supabase
            .from('contacts')
            .insert({
              workspace_id: activeWorkspace.id,
              crm_company_id: companyId,
              name: input.contactName,
              email: input.contactEmail,
              created_by: user?.id,
            });
        }
      }

      return { companyId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-companies'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error) => {
      console.error('Failed to sync partner to CRM:', error);
      toast.error('Erreur lors de la synchronisation du partenaire');
    },
  });

  // Auto-sync all tender team members to CRM
  const syncAllTeamMembersToCRM = useMutation({
    mutationFn: async (tenderId: string) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      const { data: teamMembers, error } = await supabase
        .from('tender_team_members')
        .select(`
          *,
          company:crm_companies(id, name),
          contact:contacts(id, name)
        `)
        .eq('tender_id', tenderId);

      if (error) throw error;

      const results = {
        synced: 0,
        skipped: 0,
      };

      for (const member of teamMembers || []) {
        // Skip if already linked to CRM
        if (member.company_id) {
          results.skipped++;
          continue;
        }

        // If we have company name but no link, sync it
        if (member.company_name) {
          try {
            await syncPartnerToCRM.mutateAsync({
              tenderId,
              companyName: member.company_name,
              specialty: member.specialty || 'other',
              contactName: member.contact_name,
              contactEmail: member.contact_email,
            });
            results.synced++;
          } catch (e) {
            console.warn('Failed to sync member:', member.company_name, e);
          }
        }
      }

      return results;
    },
    onSuccess: (results) => {
      if (results.synced > 0) {
        toast.success(`${results.synced} partenaire(s) synchronisé(s) avec le CRM`);
      }
    },
  });

  return {
    syncClientToCRM,
    syncPartnerToCRM,
    syncAllTeamMembersToCRM,
  };
}
