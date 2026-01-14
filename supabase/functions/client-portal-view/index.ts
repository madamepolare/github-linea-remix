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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch portal link by token or custom_slug
    const { data: portalLink, error: linkError } = await supabase
      .from('client_portal_links')
      .select(`
        *,
        contact:contacts(
          id, name, email, phone, role, avatar_url,
          crm_company:crm_companies(id, name, logo_url)
        )
      `)
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
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last_accessed_at
    await supabase
      .from('client_portal_links')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', portalLink.id);

    // Fetch workspace info
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, logo_url')
      .eq('id', portalLink.workspace_id)
      .single();

    const contact = portalLink.contact;
    const companyId = contact?.crm_company_id;
    const projectIds = portalLink.project_ids;

    const response: any = {
      portal: {
        id: portalLink.id,
        permissions: {
          can_view_projects: portalLink.can_view_projects,
          can_view_tasks: portalLink.can_view_tasks,
          can_add_tasks: portalLink.can_add_tasks,
          can_view_invoices: portalLink.can_view_invoices,
          can_view_quotes: portalLink.can_view_quotes,
          can_view_time_entries: portalLink.can_view_time_entries,
        },
      },
      workspace,
      contact,
    };

    // Fetch projects if permission granted
    if (portalLink.can_view_projects) {
      let projectsQuery = supabase
        .from('projects')
        .select(`
          id, name, status, color, description,
          start_date, end_date, address, city,
          phases:project_phases(id, name, status, sort_order)
        `)
        .eq('workspace_id', portalLink.workspace_id);

      if (projectIds && projectIds.length > 0) {
        projectsQuery = projectsQuery.in('id', projectIds);
      } else if (companyId) {
        projectsQuery = projectsQuery.eq('client_company_id', companyId);
      }

      const { data: projects } = await projectsQuery.order('created_at', { ascending: false });
      response.projects = projects || [];
    }

    // Fetch tasks if permission granted
    if (portalLink.can_view_tasks) {
      let tasksQuery = supabase
        .from('tasks')
        .select(`
          id, title, description, status, priority, due_date,
          project:projects(id, name, color)
        `)
        .eq('workspace_id', portalLink.workspace_id);

      if (projectIds && projectIds.length > 0) {
        tasksQuery = tasksQuery.in('project_id', projectIds);
      } else if (response.projects && response.projects.length > 0) {
        tasksQuery = tasksQuery.in('project_id', response.projects.map((p: any) => p.id));
      }

      const { data: tasks } = await tasksQuery.order('created_at', { ascending: false }).limit(50);
      response.tasks = tasks || [];

      // Also fetch client requests
      const { data: requests } = await supabase
        .from('client_portal_requests')
        .select(`
          id, title, description, status, created_at,
          project:projects(id, name, color)
        `)
        .eq('portal_link_id', portalLink.id)
        .order('created_at', { ascending: false });

      response.requests = requests || [];
    }

    // Fetch quotes (commercial_documents) if permission granted
    if (portalLink.can_view_quotes) {
      let quotesQuery = supabase
        .from('commercial_documents')
        .select(`
          id, document_number, title, status, total_amount, 
          valid_until, created_at, signed_at, pdf_url,
          project:projects(id, name)
        `)
        .eq('workspace_id', portalLink.workspace_id)
        .in('document_type', ['quote', 'proposal']);

      if (companyId) {
        quotesQuery = quotesQuery.eq('client_company_id', companyId);
      }
      if (contact?.id) {
        quotesQuery = quotesQuery.or(`client_contact_id.eq.${contact.id}`);
      }

      const { data: quotes } = await quotesQuery.order('created_at', { ascending: false });
      response.quotes = quotes || [];
    }

    // Fetch invoices if permission granted
    if (portalLink.can_view_invoices) {
      let invoicesQuery = supabase
        .from('invoices')
        .select(`
          id, invoice_number, title, status, total_amount, amount_paid,
          issue_date, due_date, paid_at, pdf_url,
          project:projects(id, name)
        `)
        .eq('workspace_id', portalLink.workspace_id);

      if (companyId) {
        invoicesQuery = invoicesQuery.eq('client_company_id', companyId);
      }
      if (contact?.id) {
        invoicesQuery = invoicesQuery.or(`client_contact_id.eq.${contact.id}`);
      }

      const { data: invoices } = await invoicesQuery.order('issue_date', { ascending: false });
      response.invoices = invoices || [];
    }

    // Fetch time entries if permission granted
    if (portalLink.can_view_time_entries && response.projects) {
      const projectIdsForTime = response.projects.map((p: any) => p.id);
      
      if (projectIdsForTime.length > 0) {
        const { data: timeEntries } = await supabase
          .from('team_time_entries')
          .select(`
            id, date, hours, description, is_billable,
            project:projects(id, name, color),
            task:tasks(id, title)
          `)
          .eq('workspace_id', portalLink.workspace_id)
          .in('project_id', projectIdsForTime)
          .order('date', { ascending: false })
          .limit(100);

        response.time_entries = timeEntries || [];

        // Calculate summary
        const summary = (timeEntries || []).reduce((acc: any, entry: any) => {
          acc.total_hours += entry.hours || 0;
          if (entry.is_billable) {
            acc.billable_hours += entry.hours || 0;
          }
          return acc;
        }, { total_hours: 0, billable_hours: 0 });

        response.time_summary = summary;
      }
    }

    console.log(`Portal accessed: ${portalLink.id} for contact ${contact?.name}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in client-portal-view:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
