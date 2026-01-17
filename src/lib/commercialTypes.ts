// Types for Commercial Module

export type DocumentType = 'quote' | 'contract';
export type ProjectType = 'interior' | 'architecture' | 'scenography';
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'signed';
export type FeeMode = 'fixed' | 'percentage' | 'hourly' | 'mixed';
export type ItemType = 'mission' | 'option' | 'expense' | 'discount';

export type PhaseCategory = 'base' | 'complementary';

export interface PhaseTemplate {
  code: string;
  name: string;
  description: string;
  defaultPercentage: number;
  deliverables: string[];
  category: PhaseCategory;
}

export interface CommercialDocument {
  id: string;
  workspace_id: string;
  project_id?: string;
  document_type: DocumentType;
  document_number: string;
  title: string;
  description?: string;
  client_company_id?: string;
  client_contact_id?: string;
  billing_contact_id?: string;
  project_type: ProjectType;
  project_address?: string;
  project_city?: string;
  postal_code?: string;
  project_surface?: number;
  project_budget?: number;
  construction_budget?: number;
  construction_budget_disclosed?: boolean;
  status: DocumentStatus;
  fee_mode: FeeMode;
  fee_percentage?: number;
  hourly_rate?: number;
  total_amount: number;
  currency: string;
  validity_days: number;
  valid_until?: string;
  payment_terms?: string;
  special_conditions?: string;
  general_conditions?: string;
  header_text?: string;
  footer_text?: string;
  // VAT settings
  vat_type?: string;
  vat_rate?: number;
  // Contract type
  contract_type_id?: string;
  quote_theme_id?: string;
  notes?: string;
  // New fields for enhanced quote builder
  reference_client?: string;
  expected_start_date?: string;
  expected_end_date?: string;
  expected_signature_date?: string;
  internal_owner_id?: string;
  invoice_schedule?: unknown; // Stored as JSONB in DB
  // Timestamps and tracking
  sent_at?: string;
  accepted_at?: string;
  signed_at?: string;
  pdf_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relations
  client_company?: { id: string; name: string; logo_url?: string };
  client_contact?: { id: string; name: string; email?: string };
  billing_contact?: { id: string; name: string; email?: string };
  project?: { id: string; name: string };
  phases?: CommercialDocumentPhase[];
  items?: CommercialDocumentItem[];
}

// Planned invoice for quote invoice schedule
export interface PlannedInvoice {
  id: string;
  schedule_number: number;
  title: string;
  description?: string;
  percentage?: number;
  amount_ht: number;
  amount_ttc?: number;
  vat_rate: number;
  planned_date?: string;
  milestone?: string;
  phase_ids?: string[];
}

export interface CommercialDocumentPhase {
  id: string;
  document_id: string;
  phase_code: string;
  phase_name: string;
  phase_description?: string;
  percentage_fee: number;
  amount: number;
  is_included: boolean;
  deliverables: string[];
  start_date?: string;
  end_date?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CommercialDocumentItem {
  id: string;
  document_id: string;
  phase_id?: string;
  item_type: ItemType;
  description: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  amount: number;
  is_optional: boolean;
  sort_order: number;
  created_at: string;
}

export interface CommercialTemplate {
  id: string;
  workspace_id: string;
  name: string;
  document_type: DocumentType;
  project_type: ProjectType;
  default_phases: PhaseTemplate[];
  default_clauses: Record<string, string>;
  header_text?: string;
  footer_text?: string;
  terms_conditions?: string;
  is_default: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Legacy phase templates - now loaded from database via usePhaseTemplates hook
// These are kept for backward compatibility and AI defaults generation

export const PHASES_BY_PROJECT_TYPE: Record<ProjectType, PhaseTemplate[]> = {
  architecture: [],
  interior: [],
  scenography: []
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  quote: 'Devis',
  contract: 'Contrat'
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  interior: 'Architecture d\'Intérieur',
  architecture: 'Architecture',
  scenography: 'Scénographie'
};

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
  signed: 'Signé'
};

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  signed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
};

export const FEE_MODE_LABELS: Record<FeeMode, string> = {
  fixed: 'Forfait',
  percentage: 'Pourcentage',
  hourly: 'Régie',
  mixed: 'Mixte'
};

export const PHASE_CATEGORY_LABELS: Record<PhaseCategory, string> = {
  base: 'Mission de base',
  complementary: 'Mission complémentaire'
};
