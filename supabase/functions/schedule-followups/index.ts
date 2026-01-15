import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('Starting follow-up scheduling job...');

    // Get all pipeline entries awaiting response with their stage config
    const { data: entries, error: entriesError } = await supabaseAdmin
      .from('contact_pipeline_entries')
      .select(`
        id,
        workspace_id,
        contact_id,
        company_id,
        last_email_sent_at,
        pipeline_id,
        stage:crm_pipeline_stages(
          id,
          name,
          auto_followup_enabled,
          auto_followup_days,
          auto_followup_action_title
        ),
        contact:contacts(id, name),
        company:crm_companies(id, name)
      `)
      .eq('awaiting_response', true)
      .not('last_email_sent_at', 'is', null);

    if (entriesError) {
      throw entriesError;
    }

    console.log(`Found ${entries?.length || 0} entries awaiting response`);

    let createdActions = 0;
    const errors: string[] = [];

    for (const entry of entries || []) {
      try {
        const stage = entry.stage as any;
        
        // Skip if auto-followup not enabled for this stage
        if (!stage?.auto_followup_enabled) {
          continue;
        }

        const lastEmailDate = new Date(entry.last_email_sent_at);
        const now = new Date();
        const daysSinceEmail = Math.floor(
          (now.getTime() - lastEmailDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if we've exceeded the followup delay
        if (daysSinceEmail < (stage.auto_followup_days || 3)) {
          continue;
        }

        // Check if there's already a pending followup action for this entry
        const { data: existingActions } = await supabaseAdmin
          .from('pipeline_actions')
          .select('id')
          .eq('entry_id', entry.id)
          .eq('action_type', 'followup')
          .eq('status', 'pending')
          .limit(1);

        if (existingActions && existingActions.length > 0) {
          console.log(`Entry ${entry.id} already has pending followup action`);
          continue;
        }

        // Create the followup action
        const entityName = (entry.contact as any)?.name || (entry.company as any)?.name || 'Contact';
        const actionTitle = stage.auto_followup_action_title || 
          `Relancer ${entityName} (${daysSinceEmail}j sans réponse)`;

        const { error: actionError } = await supabaseAdmin
          .from('pipeline_actions')
          .insert({
            workspace_id: entry.workspace_id,
            entry_id: entry.id,
            contact_id: entry.contact_id,
            company_id: entry.company_id,
            action_type: 'followup',
            title: actionTitle,
            description: `Rappel automatique : aucune réponse reçue depuis ${daysSinceEmail} jour(s). Email envoyé le ${lastEmailDate.toLocaleDateString('fr-FR')}.`,
            priority: daysSinceEmail > (stage.auto_followup_days || 3) * 2 ? 'urgent' : 'high',
            due_date: new Date().toISOString(),
            status: 'pending',
          });

        if (actionError) {
          console.error(`Error creating action for entry ${entry.id}:`, actionError);
          errors.push(`Entry ${entry.id}: ${actionError.message}`);
        } else {
          createdActions++;
          console.log(`Created followup action for entry ${entry.id}`);

          // Also create a notification for workspace members
          // Get the user who sent the original email
          const { data: originalEmail } = await supabaseAdmin
            .from('crm_emails')
            .select('created_by')
            .eq('contact_id', entry.contact_id)
            .eq('direction', 'outbound')
            .order('sent_at', { ascending: false })
            .limit(1)
            .single();

          if (originalEmail?.created_by) {
            await supabaseAdmin
              .from('notifications')
              .insert({
                workspace_id: entry.workspace_id,
                user_id: originalEmail.created_by,
                type: 'followup_reminder',
                title: 'Rappel de relance',
                message: `${entityName} n'a pas répondu depuis ${daysSinceEmail} jours`,
                related_entity_type: 'pipeline_entry',
                related_entity_id: entry.id,
                is_read: false,
              });
          }
        }
      } catch (entryError) {
        console.error(`Error processing entry ${entry.id}:`, entryError);
        errors.push(`Entry ${entry.id}: ${entryError instanceof Error ? entryError.message : 'Unknown error'}`);
      }
    }

    console.log(`Follow-up scheduling complete: ${createdActions} actions created, ${errors.length} errors`);

    return new Response(JSON.stringify({
      success: true,
      processed: entries?.length || 0,
      actionsCreated: createdActions,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in schedule-followups:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
