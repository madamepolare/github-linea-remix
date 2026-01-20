// ============================================================
// CRM Types - Clean TypeScript interfaces only
// All constants are now managed dynamically via workspace_settings
// Use useCRMSettings() hook to access company types, categories, etc.
// ============================================================

// Company type key (stored in database)
export type CompanyType = string;

// Company category key (stored in database)
export type CompanyCategory = string;

// Lead status types
export type LeadStatus = 'new' | 'contacted' | 'meeting' | 'proposal' | 'negotiation' | 'won' | 'lost';

// Activity type keys
export type ActivityType = string;

// Contact types
export type ContactGender = 'male' | 'female' | 'other';
export type EntityStatus = 'lead' | 'confirmed';

// Helper to safely cast status from DB
export function asEntityStatus(status: string | null | undefined): EntityStatus {
  if (status === 'lead') return 'lead';
  return 'confirmed'; // default to confirmed if null/undefined
}

// ============================================================
// Core CRM Interfaces
// ============================================================

export interface CRMCompany {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  billing_email: string | null;
  notes: string | null;
  logo_url: string | null;
  bet_specialties: string[] | null;
  status: string | null; // 'lead' = prospect, 'confirmed' = validated company
  // Fiscal fields from crm_companies table
  siret: string | null;
  siren: string | null;
  vat_number: string | null;
  code_naf: string | null;
  forme_juridique: string | null;
  capital_social: number | null;
  rcs_city: string | null;
  vat_type: string | null;
  vat_rate: number | null;
  billing_contact_id: string | null;
  created_by: string | null;
  workspace_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CRMCompanyEnriched extends CRMCompany {
  contacts_count: number;
  leads_count: number;
  leads_value: number;
  primary_contact: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface Contact {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  gender: ContactGender | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  contact_type: string | null;
  location: string | null;
  notes: string | null;
  avatar_url: string | null;
  crm_company_id: string | null;
  department_id: string | null;
  department_role: string | null;
  status: string | null;
  created_by: string | null;
  workspace_id: string;
  created_at: string | null;
  updated_at: string | null;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    country?: string | null;
    city?: string | null;
  } | null;
}

export interface CRMFilters {
  search: string;
  category: string;
  companyType: string;
  letterFilter: string | null;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  pageSize?: number;
}
