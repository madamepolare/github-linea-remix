import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type WorkspaceId = string;

export interface EmailTemplate {
  id: string;
  workspace_id: WorkspaceId;
  template_type: string;
  name: string;
  subject: string;
  body_html: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_TEMPLATES: Omit<EmailTemplate, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>[] = [
  {
    template_type: 'workspace_invite',
    name: 'Invitation au workspace',
    subject: "Vous êtes invité à rejoindre {{workspace_name}} sur ARCHIMIND",
    body_html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: linear-gradient(135deg, #c9a55c, #b8956f); border-radius: 12px; margin-bottom: 16px;">
        <span style="font-size: 28px; color: white;">⬡</span>
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">ARCHIMIND</h1>
    </div>
    
    <div style="background: #f8f8f6; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Vous êtes invité !</h2>
      <p style="margin: 0 0 16px 0; color: #666;">
        <strong>{{inviter_name}}</strong> vous a invité à rejoindre <strong>{{workspace_name}}</strong> en tant que <strong>{{role}}</strong>.
      </p>
      <p style="margin: 0 0 24px 0; color: #666;">
        ARCHIMIND aide les agences d'architecture à gérer leurs projets, équipes et clients en un seul endroit.
      </p>
      <a href="{{invite_url}}" style="display: inline-block; background: linear-gradient(135deg, #c9a55c, #b8956f); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Accepter l'invitation
      </a>
    </div>
    
    <p style="color: #999; font-size: 14px; text-align: center;">
      Cette invitation expire dans 7 jours. Si vous n'attendiez pas cet email, vous pouvez l'ignorer.
    </p>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
      <p>© {{year}} ARCHIMIND. Tous droits réservés.</p>
    </div>
  </body>
</html>`,
    variables: ['inviter_name', 'workspace_name', 'role', 'invite_url', 'year'],
    is_active: true,
  },
  {
    template_type: 'meeting_convocation',
    name: 'Convocation réunion de chantier',
    subject: "Convocation - Réunion de chantier n°{{meeting_number}} - {{project_name}}",
    body_html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">ARCHIMIND</h1>
    </div>
    
    <div style="background: #f8f8f6; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Convocation - Réunion de chantier</h2>
      <p style="margin: 0 0 16px 0; color: #666;">
        Vous êtes convoqué à la réunion de chantier n°<strong>{{meeting_number}}</strong> pour le projet <strong>{{project_name}}</strong>.
      </p>
      <p style="margin: 0 0 8px 0; color: #666;"><strong>Date :</strong> {{meeting_date}}</p>
      <p style="margin: 0 0 8px 0; color: #666;"><strong>Heure :</strong> {{meeting_time}}</p>
      <p style="margin: 0 0 24px 0; color: #666;"><strong>Lieu :</strong> {{meeting_location}}</p>
      {{#custom_message}}
      <div style="background: #fff; border-left: 4px solid #c9a55c; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #666;">{{custom_message}}</p>
      </div>
      {{/custom_message}}
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
      <p>© {{year}} ARCHIMIND. Tous droits réservés.</p>
    </div>
  </body>
</html>`,
    variables: ['meeting_number', 'project_name', 'meeting_date', 'meeting_time', 'meeting_location', 'custom_message', 'year'],
    is_active: true,
  },
  {
    template_type: 'partner_invitation',
    name: 'Invitation partenaire appel d\'offres',
    subject: "Invitation à collaborer sur l'appel d'offres: {{tender_name}}",
    body_html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">ARCHIMIND</h1>
    </div>
    
    <div style="background: #f8f8f6; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Invitation à collaborer</h2>
      <p style="margin: 0 0 16px 0; color: #666;">
        <strong>{{agency_name}}</strong> vous invite à rejoindre l'équipe pour l'appel d'offres <strong>{{tender_name}}</strong>.
      </p>
      <p style="margin: 0 0 8px 0; color: #666;"><strong>Spécialité :</strong> {{specialty}}</p>
      <p style="margin: 0 0 24px 0; color: #666;"><strong>Date limite :</strong> {{deadline}}</p>
      {{#custom_message}}
      <div style="background: #fff; border-left: 4px solid #c9a55c; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #666;">{{custom_message}}</p>
      </div>
      {{/custom_message}}
    </div>
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
      <p>© {{year}} ARCHIMIND. Tous droits réservés.</p>
    </div>
  </body>
</html>`,
    variables: ['agency_name', 'tender_name', 'specialty', 'deadline', 'custom_message', 'year'],
    is_active: true,
  },
];

export function useEmailTemplates() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const workspaceId = activeWorkspace?.id;

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      
      // Cast the data to our interface
      return (data || []).map(t => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables as string[] : []
      })) as EmailTemplate[];
    },
    enabled: !!activeWorkspace,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template créé');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la création: ' + error.message);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template mis à jour');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template supprimé');
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la suppression: ' + error.message);
    },
  });

  const initializeDefaultTemplates = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error('No workspace');

      const templatesWithWorkspace = DEFAULT_TEMPLATES.map(t => ({
        ...t,
        workspace_id: workspaceId,
      }));

      const { error } = await supabase
        .from('email_templates')
        .upsert(templatesWithWorkspace, { onConflict: 'workspace_id,template_type' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Templates par défaut initialisés');
    },
    onError: (error: Error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    initializeDefaultTemplates,
  };
}
