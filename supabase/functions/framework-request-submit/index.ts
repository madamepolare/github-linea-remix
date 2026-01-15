import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, title, description, priority, desired_deadline, attachments } = await req.json();

    console.log(`[framework-request-submit] Received request with token: ${token?.substring(0, 8)}...`);

    if (!token || !title) {
      console.error('[framework-request-submit] Missing token or title');
      return new Response(
        JSON.stringify({ error: 'Token and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch and validate portal link with framework project
    const { data: portalLink, error: linkError } = await supabase
      .from('client_portal_links')
      .select(`
        *,
        contact:contacts(id, name, email, crm_company_id),
        framework_project:projects!client_portal_links_framework_project_id_fkey(
          id, name, contract_type, crm_company_id, project_type, color, workspace_id
        )
      `)
      .or(`token.eq.${token},custom_slug.eq.${token}`)
      .eq('is_active', true)
      .single();

    if (linkError || !portalLink) {
      console.error('[framework-request-submit] Invalid portal link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired portal link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (portalLink.expires_at && new Date(portalLink.expires_at) < new Date()) {
      console.error('[framework-request-submit] Portal link expired');
      return new Response(
        JSON.stringify({ error: 'Portal link has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify this portal has a framework project linked
    if (!portalLink.framework_project) {
      console.error('[framework-request-submit] No framework project linked to this portal');
      return new Response(
        JSON.stringify({ error: 'This portal is not configured for framework requests' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const frameworkProject = portalLink.framework_project;

    // Verify it's a framework type project
    if (frameworkProject.contract_type !== 'framework') {
      console.error('[framework-request-submit] Project is not a framework type:', frameworkProject.contract_type);
      return new Response(
        JSON.stringify({ error: 'The linked project is not a framework agreement' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check permission
    if (!portalLink.can_add_tasks) {
      console.error('[framework-request-submit] Portal does not have permission to add requests');
      return new Response(
        JSON.stringify({ error: 'Permission denied: cannot create requests' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[framework-request-submit] Creating request for framework: ${frameworkProject.name}`);

    // 1. Create the client portal request
    const { data: portalRequest, error: requestError } = await supabase
      .from('client_portal_requests')
      .insert({
        workspace_id: portalLink.workspace_id,
        portal_link_id: portalLink.id,
        contact_id: portalLink.contact_id,
        project_id: frameworkProject.id,
        title,
        description: description || null,
        priority: priority || 'medium',
        desired_deadline: desired_deadline || null,
        attachments: attachments || [],
        status: 'pending',
      })
      .select()
      .single();

    if (requestError) {
      console.error('[framework-request-submit] Error creating portal request:', requestError);
      return new Response(
        JSON.stringify({ error: 'Failed to create request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[framework-request-submit] Portal request created: ${portalRequest.id}`);

    // 2. Create the sub-project automatically
    const { data: subProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: title,
        description: description || null,
        parent_id: frameworkProject.id,
        workspace_id: frameworkProject.workspace_id,
        crm_company_id: frameworkProject.crm_company_id,
        project_type: frameworkProject.project_type,
        color: frameworkProject.color,
        status: 'pending_review',
        billing_type: 'included', // Default to included, team will qualify
        client_request_id: portalRequest.id,
        end_date: desired_deadline || null,
        contract_type: 'standard',
      })
      .select()
      .single();

    if (projectError) {
      console.error('[framework-request-submit] Error creating sub-project:', projectError);
      // Still return success for the request, just log the project error
      return new Response(
        JSON.stringify({ 
          success: true, 
          request: portalRequest,
          warning: 'Request created but sub-project creation failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[framework-request-submit] Sub-project created: ${subProject.id}`);

    // 3. Create a notification for the team (optional - if notifications table exists)
    try {
      await supabase
        .from('notifications')
        .insert({
          workspace_id: frameworkProject.workspace_id,
          title: 'Nouvelle demande client',
          message: `${portalLink.contact?.name || 'Un client'} a soumis une nouvelle demande : "${title}"`,
          type: 'client_request',
          entity_type: 'project',
          entity_id: subProject.id,
          is_read: false,
        });
      console.log('[framework-request-submit] Notification created');
    } catch (notifError) {
      // Notifications table might not exist, just log and continue
      console.log('[framework-request-submit] Could not create notification:', notifError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        request: portalRequest,
        sub_project: subProject,
        message: 'Votre demande a été soumise avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[framework-request-submit] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
