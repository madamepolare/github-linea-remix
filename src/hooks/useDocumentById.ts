import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CommercialDocument } from '@/lib/commercialTypes';

/**
 * Fetches a single commercial document by ID.
 * This is a standalone hook that doesn't depend on the documents list.
 * Use this for robust document loading in QuoteBuilder.
 */
export function useDocumentById(id: string | undefined) {
  return useQuery({
    queryKey: ['commercial-document', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('commercial_documents')
        .select(`
          *,
          client_company:crm_companies(id, name, logo_url),
          client_contact:contacts(id, name, email),
          project:projects(id, name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('[useDocumentById] Error fetching document:', error);
        throw error;
      }
      
      return data as CommercialDocument | null;
    },
    enabled: !!id && id !== 'new',
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
}
