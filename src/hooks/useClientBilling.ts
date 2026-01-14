import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BillingProfile } from "./useBillingProfiles";

export interface ClientBillingInfo {
  // Company or department info
  company_id?: string;
  department_id?: string;
  
  // Billing address
  billing_name?: string;
  billing_address?: string;
  billing_postal_code?: string;
  billing_city?: string;
  billing_country?: string;
  billing_email?: string;
  billing_phone?: string;
  
  // Fiscal identification
  siret?: string;
  siren?: string;
  vat_number?: string;
  code_naf?: string;
  legal_form?: string;
  capital_social?: number;
  rcs_city?: string;
  
  // VAT settings
  vat_type?: string;
  vat_rate?: number;
  
  // Payment settings
  payment_terms?: string;
  payment_method?: string;
  default_discount_percent?: number;
  
  // Bank details
  iban?: string;
  bic?: string;
  bank_name?: string;
}

// Get VAT rate from vat_type
export function getVATRateFromType(vatType?: string): number {
  switch (vatType) {
    case 'standard':
    case 'normal':
      return 20;
    case 'reduced':
      return 10;
    case 'super_reduced':
      return 5.5;
    case 'exempt':
    case 'export':
    case 'intra':
    case 'intra_eu':
      return 0;
    default:
      return 20; // Default to standard rate
  }
}

// Get vat_type from rate
export function getVATTypeFromRate(rate?: number): string {
  if (rate === undefined || rate === null) return 'standard';
  if (rate === 0) return 'exempt';
  if (rate === 5.5) return 'super_reduced';
  if (rate === 10) return 'reduced';
  return 'standard';
}

export function useClientBilling(companyId?: string, departmentId?: string) {
  const { activeWorkspace } = useAuth();

  const { data: billingInfo, isLoading } = useQuery({
    queryKey: ["client-billing", companyId, departmentId],
    queryFn: async (): Promise<ClientBillingInfo | null> => {
      if (!activeWorkspace?.id) return null;

      // First try to get department billing profile if departmentId is provided
      if (departmentId) {
        const { data: deptProfile } = await supabase
          .from("billing_profiles")
          .select("*")
          .eq("workspace_id", activeWorkspace.id)
          .eq("department_id", departmentId)
          .maybeSingle();

        if (deptProfile) {
          return profileToBillingInfo(deptProfile, undefined, departmentId);
        }
      }

      // Then try company billing profile
      if (companyId) {
        const { data: companyProfile } = await supabase
          .from("billing_profiles")
          .select("*")
          .eq("workspace_id", activeWorkspace.id)
          .eq("company_id", companyId)
          .maybeSingle();

        if (companyProfile) {
          return profileToBillingInfo(companyProfile, companyId, undefined);
        }

        // Fall back to company data if no billing profile
        const { data: company } = await supabase
          .from("crm_companies")
          .select("*")
          .eq("id", companyId)
          .single();

        if (company) {
          return {
            company_id: company.id,
            billing_name: company.name,
            billing_address: company.address || undefined,
            billing_postal_code: company.postal_code || undefined,
            billing_city: company.city || undefined,
            billing_country: company.country || "France",
            billing_email: company.billing_email || company.email || undefined,
            billing_phone: company.phone || undefined,
            siret: company.siret || undefined,
            siren: company.siren || undefined,
            vat_number: company.vat_number || undefined,
            code_naf: company.code_naf || undefined,
            legal_form: company.forme_juridique || undefined,
            capital_social: company.capital_social || undefined,
            rcs_city: company.rcs_city || undefined,
            vat_type: company.vat_type || "standard",
            vat_rate: company.vat_rate ?? 20,
          };
        }
      }

      return null;
    },
    enabled: !!activeWorkspace?.id && !!(companyId || departmentId),
  });

  return {
    billingInfo,
    isLoading,
    vatRate: billingInfo?.vat_rate ?? 20,
    vatType: billingInfo?.vat_type ?? "standard",
  };
}

function profileToBillingInfo(
  profile: BillingProfile,
  companyId?: string,
  departmentId?: string
): ClientBillingInfo {
  return {
    company_id: companyId,
    department_id: departmentId,
    billing_name: profile.billing_name || undefined,
    billing_address: profile.billing_address || undefined,
    billing_postal_code: profile.billing_postal_code || undefined,
    billing_city: profile.billing_city || undefined,
    billing_country: profile.billing_country || "France",
    billing_email: profile.billing_email || undefined,
    billing_phone: profile.billing_phone || undefined,
    siret: profile.siret || undefined,
    siren: profile.siren || undefined,
    vat_number: profile.vat_number || undefined,
    code_naf: profile.code_naf || undefined,
    legal_form: profile.legal_form || undefined,
    capital_social: profile.capital_social || undefined,
    rcs_city: profile.rcs_city || undefined,
    vat_type: profile.vat_type || "standard",
    vat_rate: profile.vat_rate ?? 20,
    payment_terms: profile.payment_terms || undefined,
    payment_method: profile.payment_method || undefined,
    default_discount_percent: profile.default_discount_percent || undefined,
    iban: profile.iban || undefined,
    bic: profile.bic || undefined,
    bank_name: profile.bank_name || undefined,
  };
}

// Hook to get billing info and apply to document/invoice
export function useApplyClientBilling() {
  const { activeWorkspace } = useAuth();

  const fetchBillingInfo = async (companyId?: string, departmentId?: string): Promise<ClientBillingInfo | null> => {
    if (!activeWorkspace?.id) return null;

    // First try to get department billing profile if departmentId is provided
    if (departmentId) {
      const { data: deptProfile } = await supabase
        .from("billing_profiles")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("department_id", departmentId)
        .maybeSingle();

      if (deptProfile) {
        return profileToBillingInfo(deptProfile as BillingProfile, undefined, departmentId);
      }
    }

    // Then try company billing profile
    if (companyId) {
      const { data: companyProfile } = await supabase
        .from("billing_profiles")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("company_id", companyId)
        .maybeSingle();

      if (companyProfile) {
        return profileToBillingInfo(companyProfile as BillingProfile, companyId, undefined);
      }

      // Fall back to company data if no billing profile
      const { data: company } = await supabase
        .from("crm_companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (company) {
        return {
          company_id: company.id,
          billing_name: company.name,
          billing_address: company.address || undefined,
          billing_postal_code: company.postal_code || undefined,
          billing_city: company.city || undefined,
          billing_country: company.country || "France",
          billing_email: company.billing_email || company.email || undefined,
          billing_phone: company.phone || undefined,
          siret: company.siret || undefined,
          siren: company.siren || undefined,
          vat_number: company.vat_number || undefined,
          code_naf: company.code_naf || undefined,
          legal_form: company.forme_juridique || undefined,
          capital_social: company.capital_social || undefined,
          rcs_city: company.rcs_city || undefined,
          vat_type: company.vat_type || "standard",
          vat_rate: company.vat_rate ?? 20,
        };
      }
    }

    return null;
  };

  return { fetchBillingInfo };
}
