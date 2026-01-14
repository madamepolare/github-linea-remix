import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PortalData {
  portal: {
    id: string;
    permissions: {
      can_view_projects: boolean;
      can_view_tasks: boolean;
      can_add_tasks: boolean;
      can_view_invoices: boolean;
      can_view_quotes: boolean;
      can_view_time_entries: boolean;
    };
  };
  workspace: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  contact: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string | null;
    avatar_url: string | null;
    crm_company: {
      id: string;
      name: string;
      logo_url: string | null;
    } | null;
  };
  projects?: Array<{
    id: string;
    name: string;
    status: string;
    color: string | null;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    phases: Array<{
      id: string;
      name: string;
      status: string;
      sort_order: number;
    }>;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string | null;
    due_date: string | null;
    project: { id: string; name: string; color: string | null } | null;
  }>;
  requests?: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    created_at: string;
    project: { id: string; name: string; color: string | null } | null;
  }>;
  quotes?: Array<{
    id: string;
    document_number: string;
    title: string;
    status: string;
    total_amount: number | null;
    valid_until: string | null;
    created_at: string;
    signed_at: string | null;
    pdf_url: string | null;
    project: { id: string; name: string } | null;
  }>;
  invoices?: Array<{
    id: string;
    invoice_number: string;
    title: string | null;
    status: string;
    total_amount: number | null;
    amount_paid: number | null;
    issue_date: string | null;
    due_date: string | null;
    paid_at: string | null;
    pdf_url: string | null;
    project: { id: string; name: string } | null;
  }>;
  time_entries?: Array<{
    id: string;
    date: string;
    hours: number;
    description: string | null;
    is_billable: boolean;
    project: { id: string; name: string; color: string | null } | null;
    task: { id: string; title: string } | null;
  }>;
  time_summary?: {
    total_hours: number;
    billable_hours: number;
  };
}

export function useClientPortal(token: string | undefined) {
  const [data, setData] = useState<PortalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError('Token manquant');
      return;
    }

    const fetchPortalData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: responseData, error: fnError } = await supabase.functions.invoke(
          'client-portal-view',
          {
            body: null,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        // Use GET with query param instead
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-portal-view?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors du chargement du portail');
        }

        const portalData = await response.json();
        setData(portalData);
      } catch (err) {
        console.error('Error fetching portal data:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortalData();
  }, [token]);

  const createRequest = async (title: string, description: string, projectId?: string) => {
    if (!token) return { success: false, error: 'Token manquant' };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-portal-actions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            action: 'create_request',
            data: { title, description, project_id: projectId },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création de la demande');
      }

      // Refresh data
      const refreshResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-portal-view?token=${encodeURIComponent(token)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (refreshResponse.ok) {
        const portalData = await refreshResponse.json();
        setData(portalData);
      }

      return { success: true, request: result.request };
    } catch (err) {
      console.error('Error creating request:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
    }
  };

  const refresh = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-portal-view?token=${encodeURIComponent(token)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        const portalData = await response.json();
        setData(portalData);
      }
    } catch (err) {
      console.error('Error refreshing portal data:', err);
    }
  };

  return { data, isLoading, error, createRequest, refresh };
}
