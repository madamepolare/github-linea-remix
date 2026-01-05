import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AgencyInfo {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  siret: string | null;
  siren: string | null;
  vat_number: string | null;
  capital_social: number | null;
  forme_juridique: string | null;
  rcs_city: string | null;
  code_naf: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  header_style: {
    layout: 'classic' | 'modern' | 'minimal';
    showLogo: boolean;
    showAddress: boolean;
    showContact: boolean;
  } | null;
  footer_text: string | null;
}

export interface UpdateAgencyInfoInput {
  name?: string;
  logo_url?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  siret?: string | null;
  siren?: string | null;
  vat_number?: string | null;
  capital_social?: number | null;
  forme_juridique?: string | null;
  rcs_city?: string | null;
  code_naf?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  header_style?: AgencyInfo['header_style'];
  footer_text?: string | null;
}

export function useAgencyInfo() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: agencyInfo, isLoading, error } = useQuery({
    queryKey: ["agency-info", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;

      const { data, error } = await supabase
        .from("workspaces")
        .select(`
          id,
          name,
          logo_url,
          address,
          city,
          postal_code,
          phone,
          email,
          website,
          siret,
          siren,
          vat_number,
          capital_social,
          forme_juridique,
          rcs_city,
          code_naf,
          primary_color,
          secondary_color,
          accent_color,
          header_style,
          footer_text
        `)
        .eq("id", activeWorkspace.id)
        .single();

      if (error) throw error;
      return data as AgencyInfo;
    },
    enabled: !!activeWorkspace?.id,
  });

  const updateAgencyInfo = useMutation({
    mutationFn: async (updates: UpdateAgencyInfoInput) => {
      if (!activeWorkspace?.id) throw new Error("No workspace selected");

      const { data, error } = await supabase
        .from("workspaces")
        .update(updates)
        .eq("id", activeWorkspace.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-info", activeWorkspace?.id] });
      toast.success("Informations mises à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la mise à jour", { description: error.message });
    },
  });

  // Get formatted full address
  const getFullAddress = () => {
    if (!agencyInfo) return '';
    const parts = [
      agencyInfo.address,
      [agencyInfo.postal_code, agencyInfo.city].filter(Boolean).join(' '),
    ].filter(Boolean);
    return parts.join('\n');
  };

  // Get formatted legal info
  const getLegalInfo = () => {
    if (!agencyInfo) return '';
    const parts = [];
    if (agencyInfo.forme_juridique) parts.push(agencyInfo.forme_juridique);
    if (agencyInfo.capital_social) parts.push(`Capital ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(agencyInfo.capital_social)}`);
    if (agencyInfo.siret) parts.push(`SIRET ${agencyInfo.siret}`);
    if (agencyInfo.rcs_city) parts.push(`RCS ${agencyInfo.rcs_city}`);
    if (agencyInfo.vat_number) parts.push(`TVA ${agencyInfo.vat_number}`);
    return parts.join(' • ');
  };

  return {
    agencyInfo,
    isLoading,
    error,
    updateAgencyInfo,
    getFullAddress,
    getLegalInfo,
  };
}
