import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PortalData {
  portal: {
    id: string;
    permissions: {
      can_view_projects: boolean;
      can_view_tasks: boolean;
      can_add_tasks: boolean;
      can_view_quotes: boolean;
      can_view_invoices: boolean;
      can_view_time_entries: boolean;
      can_view_contacts: boolean;
    };
  };
  workspace: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
  };
  projects?: Array<{
    id: string;
    name: string;
    description: string | null;
    status: string;
    color: string | null;
    start_date: string | null;
    end_date: string | null;
    address: string | null;
    city: string | null;
    phases?: Array<{
      id: string;
      name: string;
      status: string;
      progress: number;
    }>;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string | null;
    due_date: string | null;
    created_at: string;
    project?: {
      id: string;
      name: string;
      color: string | null;
    };
    communications?: Array<{
      id: string;
      communication_type: string;
      content: string;
      title: string | null;
      created_at: string;
      updated_at: string;
      parent_id: string | null;
      is_pinned: boolean;
    }>;
  }>;
  requests?: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    created_at: string;
    project?: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
  quotes?: Array<{
    id: string;
    document_number: string;
    title: string;
    status: string;
    total_amount: number | null;
    vat_rate: number | null;
    created_at: string;
    valid_until: string | null;
    pdf_url: string | null;
    project?: {
      id: string;
      name: string;
    };
  }>;
  invoices?: Array<{
    id: string;
    invoice_number: string;
    title: string;
    status: string;
    total_amount: number | null;
    amount_paid: number | null;
    remaining_amount: number | null;
    issue_date: string | null;
    due_date: string | null;
    paid_at: string | null;
    pdf_url: string | null;
    project?: {
      id: string;
      name: string;
    };
  }>;
  time_entries?: Array<{
    id: string;
    date: string;
    hours: number;
    description: string | null;
    is_billable: boolean;
    project?: {
      id: string;
      name: string;
      color: string | null;
    };
    task?: {
      id: string;
      title: string;
    };
  }>;
  time_entries_summary?: {
    total_hours: number;
    billable_hours: number;
    total_entries: number;
  };
  contacts?: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string | null;
    avatar_url: string | null;
  }>;
}

export function useCompanyPortal(token: string | undefined) {
  const [data, setData] = useState<PortalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortalData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      setError('No token provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: fetchError } = await supabase.functions.invoke(
        'company-portal-view',
        {
          body: null,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Use GET with query params
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/company-portal-view?token=${encodeURIComponent(token)}`;
      
      const res = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch portal data');
      }

      setData(result);
    } catch (err) {
      console.error('Error fetching company portal data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load portal');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  const createRequest = async (requestData: { title: string; description?: string; project_id?: string }) => {
    if (!token) {
      throw new Error('No token available');
    }

    const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/company-portal-actions`;

    const res = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        token,
        action: 'create_request',
        data: requestData,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || 'Failed to create request');
    }

    // Refresh data
    await fetchPortalData();

    return result;
  };

  const refresh = () => {
    fetchPortalData();
  };

  return { data, isLoading, error, createRequest, refresh };
}
