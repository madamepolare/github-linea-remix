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
    const { token, action, data } = await req.json();

    if (!token || !action) {
      return new Response(
        JSON.stringify({ error: 'Token and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Company portal action:', action, 'for token:', token);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch and validate portal link
    const { data: portalLink, error: linkError } = await supabase
      .from('company_portal_links')
      .select('*')
      .or(`token.eq.${token},custom_slug.eq.${token}`)
      .eq('is_active', true)
      .single();

    if (linkError || !portalLink) {
      console.error('Portal link error:', linkError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired portal link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (portalLink.expires_at && new Date(portalLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Portal link has expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (action) {
      case 'create_request': {
        if (!portalLink.can_add_tasks) {
          return new Response(
            JSON.stringify({ error: 'Not authorized to create requests' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { title, description, project_id } = data || {};

        if (!title) {
          return new Response(
            JSON.stringify({ error: 'Title is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate project_id if provided
        if (project_id) {
          const { data: project } = await supabase
            .from('projects')
            .select('id')
            .eq('id', project_id)
            .eq('client_company_id', portalLink.company_id)
            .single();

          if (!project) {
            return new Response(
              JSON.stringify({ error: 'Invalid project' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const { data: request, error: requestError } = await supabase
          .from('company_portal_requests')
          .insert({
            workspace_id: portalLink.workspace_id,
            portal_link_id: portalLink.id,
            company_id: portalLink.company_id,
            project_id: project_id || null,
            title,
            description: description || null,
            status: 'pending',
          })
          .select()
          .single();

        if (requestError) {
          console.error('Request creation error:', requestError);
          return new Response(
            JSON.stringify({ error: 'Failed to create request' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, request }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_quote_link': {
        if (!portalLink.can_view_quotes) {
          return new Response(
            JSON.stringify({ error: 'Not authorized to view quotes' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { quote_id } = data || {};

        if (!quote_id) {
          return new Response(
            JSON.stringify({ error: 'Quote ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: quoteLink } = await supabase
          .from('quote_public_links')
          .select('token')
          .eq('document_id', quote_id)
          .eq('is_active', true)
          .single();

        return new Response(
          JSON.stringify({ success: true, token: quoteLink?.token || null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add_task_comment': {
        if (!portalLink.can_view_tasks) {
          return new Response(
            JSON.stringify({ error: 'Not authorized to comment on tasks' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { task_id, content, parent_id } = data || {};

        if (!task_id || !content) {
          return new Response(
            JSON.stringify({ error: 'Task ID and content are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verify task belongs to company's projects
        const { data: task } = await supabase
          .from('tasks')
          .select('id, project:projects!inner(id, client_company_id)')
          .eq('id', task_id)
          .single();

        if (!task || (task as any).project?.client_company_id !== portalLink.company_id) {
          return new Response(
            JSON.stringify({ error: 'Task not found or not accessible' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Fetch company name for the comment
        const { data: company } = await supabase
          .from('crm_companies')
          .select('name')
          .eq('id', portalLink.company_id)
          .single();

        const { data: comment, error: commentError } = await supabase
          .from('communications')
          .insert({
            workspace_id: portalLink.workspace_id,
            entity_type: 'task',
            entity_id: task_id,
            communication_type: 'comment',
            content,
            title: `Commentaire de ${company?.name || 'Portail Société'}`,
            parent_id: parent_id || null,
            thread_id: parent_id || null,
          })
          .select()
          .single();

        if (commentError) {
          console.error('Comment creation error:', commentError);
          return new Response(
            JSON.stringify({ error: 'Failed to add comment' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, comment }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_task_communications': {
        if (!portalLink.can_view_tasks) {
          return new Response(
            JSON.stringify({ error: 'Not authorized to view task communications' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { task_id } = data || {};

        if (!task_id) {
          return new Response(
            JSON.stringify({ error: 'Task ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: communications, error: commError } = await supabase
          .from('communications')
          .select('*')
          .eq('entity_type', 'task')
          .eq('entity_id', task_id)
          .order('created_at', { ascending: true });

        if (commError) {
          console.error('Fetch communications error:', commError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch communications' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, communications }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
