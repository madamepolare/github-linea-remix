import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      console.error('No token provided');
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Company portal view request for token:', token);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch company portal link with company info
    const { data: portalLink, error: linkError } = await supabase
      .from('company_portal_links')
      .select(`
        *,
        company:crm_companies(
          id, name, logo_url, industry, address, city, postal_code, phone, email, website
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
      console.error('Portal link expired');
      return new Response(
        JSON.stringify({ error: 'Portal link has expired' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last accessed
    await supabase
      .from('company_portal_links')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', portalLink.id);

    // Fetch workspace info
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, name, logo_url')
      .eq('id', portalLink.workspace_id)
      .single();

    // Build response object
    const response: any = {
      portal: {
        id: portalLink.id,
        permissions: {
          can_view_projects: portalLink.can_view_projects,
          can_view_tasks: portalLink.can_view_tasks,
          can_add_tasks: portalLink.can_add_tasks,
          can_view_quotes: portalLink.can_view_quotes,
          can_view_invoices: portalLink.can_view_invoices,
          can_view_time_entries: portalLink.can_view_time_entries,
          can_view_contacts: portalLink.can_view_contacts,
        },
      },
      workspace,
      company: portalLink.company,
      projects: [],
      tasks: [],
      requests: [],
      quotes: [],
      invoices: [],
      time_entries: [],
      contacts: [],
    };

    // Fetch projects if permitted
    if (portalLink.can_view_projects) {
      let projectsQuery = supabase
        .from('projects')
        .select(`
          id, name, description, status, color, 
          start_date, end_date, address, city,
          phases:project_phases(id, name, status, progress)
        `)
        .eq('workspace_id', portalLink.workspace_id)
        .eq('client_company_id', portalLink.company_id);

      if (portalLink.project_ids && portalLink.project_ids.length > 0) {
        projectsQuery = projectsQuery.in('id', portalLink.project_ids);
      }

      const { data: projects } = await projectsQuery;
      response.projects = projects || [];
    }

    // Get project IDs for further queries
    const projectIds = response.projects.map((p: any) => p.id);

    // Fetch tasks if permitted
    if (portalLink.can_view_tasks && projectIds.length > 0) {
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          id, title, description, status, priority,
          due_date, created_at,
          project:projects(id, name, color)
        `)
        .eq('workspace_id', portalLink.workspace_id)
        .in('project_id', projectIds)
        .order('due_date', { ascending: true });

      // Fetch communications for tasks
      if (tasks && tasks.length > 0) {
        const taskIds = tasks.map((t: any) => t.id);
        const { data: communications } = await supabase
          .from('communications')
          .select('*')
          .eq('entity_type', 'task')
          .in('entity_id', taskIds)
          .order('created_at', { ascending: true });

        const communicationsByTask: Record<string, any[]> = {};
        (communications || []).forEach((comm: any) => {
          if (!communicationsByTask[comm.entity_id]) {
            communicationsByTask[comm.entity_id] = [];
          }
          communicationsByTask[comm.entity_id].push(comm);
        });

        response.tasks = (tasks || []).map((task: any) => ({
          ...task,
          communications: communicationsByTask[task.id] || [],
        }));
      } else {
        response.tasks = [];
      }
    }

    // Fetch requests
    if (portalLink.can_add_tasks) {
      const { data: requests } = await supabase
        .from('company_portal_requests')
        .select(`
          id, title, description, status, created_at,
          project:projects(id, name, color)
        `)
        .eq('portal_link_id', portalLink.id)
        .order('created_at', { ascending: false });

      response.requests = requests || [];
    }

    // Fetch quotes if permitted
    if (portalLink.can_view_quotes) {
      const { data: quotes } = await supabase
        .from('commercial_documents')
        .select(`
          id, document_number, title, status, total_amount,
          vat_rate, created_at, valid_until, pdf_url,
          project:projects(id, name)
        `)
        .eq('workspace_id', portalLink.workspace_id)
        .eq('client_company_id', portalLink.company_id)
        .eq('document_type', 'quote')
        .order('created_at', { ascending: false });

      response.quotes = quotes || [];
    }

    // Fetch invoices if permitted
    if (portalLink.can_view_invoices) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          id, invoice_number, title, status, 
          total_amount, amount_paid, remaining_amount,
          issue_date, due_date, paid_at, pdf_url,
          project:projects(id, name)
        `)
        .eq('workspace_id', portalLink.workspace_id)
        .eq('client_company_id', portalLink.company_id)
        .order('issue_date', { ascending: false });

      response.invoices = invoices || [];
    }

    // Fetch time entries if permitted
    if (portalLink.can_view_time_entries && projectIds.length > 0) {
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select(`
          id, date, hours, description, is_billable,
          project:projects(id, name, color),
          task:tasks(id, title)
        `)
        .eq('workspace_id', portalLink.workspace_id)
        .in('project_id', projectIds)
        .order('date', { ascending: false })
        .limit(100);

      response.time_entries = timeEntries || [];

      // Calculate summary
      const totalHours = (timeEntries || []).reduce((sum: number, e: any) => sum + (e.hours || 0), 0);
      const billableHours = (timeEntries || []).filter((e: any) => e.is_billable).reduce((sum: number, e: any) => sum + (e.hours || 0), 0);
      
      response.time_entries_summary = {
        total_hours: totalHours,
        billable_hours: billableHours,
        total_entries: (timeEntries || []).length,
      };
    }

    // Fetch contacts if permitted
    if (portalLink.can_view_contacts) {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, email, phone, role, avatar_url')
        .eq('workspace_id', portalLink.workspace_id)
        .eq('crm_company_id', portalLink.company_id)
        .order('name', { ascending: true });

      response.contacts = contacts || [];
    }

    console.log('Company portal response prepared successfully');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
