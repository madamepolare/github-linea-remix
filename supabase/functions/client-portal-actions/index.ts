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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch and validate portal link
    const { data: portalLink, error: linkError } = await supabase
      .from('client_portal_links')
      .select('*, contact:contacts(id, name, email, crm_company_id)')
      .or(`token.eq.${token},custom_slug.eq.${token}`)
      .eq('is_active', true)
      .single();

    if (linkError || !portalLink) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired portal link' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (portalLink.expires_at && new Date(portalLink.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Portal link has expired' }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: any = null;

    switch (action) {
      case 'create_request': {
        if (!portalLink.can_add_tasks) {
          return new Response(
            JSON.stringify({ error: 'Permission denied: cannot create requests' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { title, description, project_id } = data;

        if (!title) {
          return new Response(
            JSON.stringify({ error: 'Title is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate project_id if provided
        if (project_id) {
          const projectIds = portalLink.project_ids;
          if (projectIds && projectIds.length > 0 && !projectIds.includes(project_id)) {
            return new Response(
              JSON.stringify({ error: 'Invalid project' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const { data: request, error: requestError } = await supabase
          .from('client_portal_requests')
          .insert({
            workspace_id: portalLink.workspace_id,
            portal_link_id: portalLink.id,
            contact_id: portalLink.contact_id,
            project_id: project_id || null,
            title,
            description: description || null,
            status: 'pending',
          })
          .select()
          .single();

        if (requestError) {
          console.error('Error creating request:', requestError);
          return new Response(
            JSON.stringify({ error: 'Failed to create request' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = { success: true, request };
        console.log(`Request created: ${request.id} by contact ${portalLink.contact?.name}`);
        break;
      }

      case 'get_quote_link': {
        if (!portalLink.can_view_quotes) {
          return new Response(
            JSON.stringify({ error: 'Permission denied' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { quote_id } = data;

        // Check if quote has a public link
        const { data: publicLink } = await supabase
          .from('quote_public_links')
          .select('token')
          .eq('document_id', quote_id)
          .eq('is_active', true)
          .single();

        if (publicLink) {
          result = { success: true, token: publicLink.token };
        } else {
          result = { success: false, message: 'No public link available for this quote' };
        }
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in client-portal-actions:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
