// Types for the new flexible quote system

import type { ContractType } from '@/hooks/useContractTypes';
import type { LineCategory, BillingType } from '@/hooks/useQuoteLineTemplates';

export type DocumentType = 'quote' | 'contract' | 'proposal';
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'signed';
export type FeeMode = 'fixed' | 'percentage' | 'hourly' | 'mixed';

export interface QuoteLineGroup {
  id: string;
  name: string;
  sort_order: number;
}

export interface QuoteLine {
  id: string;
  document_id?: string;
  
  // Identification
  phase_code?: string;
  phase_name: string;
  phase_description?: string;
  
  // Type and category
  line_type: 'phase' | 'service' | 'option' | 'expense' | 'discount' | 'group';
  
  // Group reference
  group_id?: string;
  
  // Reference (for BPU)
  pricing_ref?: string;
  
  // Pricing
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  percentage_fee?: number;
  
  // Assignment
  assigned_member_id?: string;
  assigned_skill?: string;
  
  // Temporality
  start_date?: string;
  end_date?: string;
  billing_type: BillingType;
  recurrence_months?: number;
  
  // Internal costs
  purchase_price?: number;
  margin_percentage?: number;
  
  // Status
  is_optional: boolean;
  is_included: boolean;
  
  // Deliverables (for phases)
  deliverables?: string[];
  
  sort_order: number;
}

export interface QuoteDocument {
  id?: string;
  workspace_id?: string;
  document_type: DocumentType;
  document_number?: string;
  title: string;
  description?: string;
  
  // Client
  client_company_id?: string;
  client_contact_id?: string;
  
  // Contract type (flexible)
  contract_type_id?: string;
  contract_type?: ContractType;
  
  // Legacy project_type for backward compatibility
  project_type?: string;
  
  // Project details (dynamic based on contract type)
  project_address?: string;
  project_city?: string;
  project_surface?: number;
  project_budget?: number;
  construction_budget?: number;
  construction_budget_disclosed?: boolean;
  
  // Fees
  fee_mode: FeeMode;
  fee_percentage?: number;
  hourly_rate?: number;
  total_amount: number;
  
  // VAT
  vat_type?: string;
  vat_rate?: number;
  
  // Terms
  currency: string;
  validity_days: number;
  valid_until?: string;
  payment_terms?: string;
  special_conditions?: string;
  general_conditions?: string;
  header_text?: string;
  footer_text?: string;
  
  // Status
  status: DocumentStatus;
  sent_at?: string;
  accepted_at?: string;
  signed_at?: string;
  pdf_url?: string;
  
  // Relations
  client_company?: { id: string; name: string; logo_url?: string };
  client_contact?: { id: string; name: string; email?: string };
  project?: { id: string; name: string };
  
  // Metadata
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  quote: 'Devis',
  contract: 'Contrat',
  proposal: 'Proposition'
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
  signed: 'Signé'
};

export const FEE_MODE_LABELS: Record<FeeMode, string> = {
  fixed: 'Forfait fixe',
  percentage: '% du budget travaux',
  hourly: 'Taux horaire',
  mixed: 'Mixte'
};

export const LINE_TYPE_LABELS: Record<QuoteLine['line_type'], string> = {
  phase: 'Phase',
  service: 'Prestation',
  option: 'Option',
  expense: 'Frais',
  discount: 'Remise',
  group: 'Groupe'
};

export const LINE_TYPE_COLORS: Record<QuoteLine['line_type'], string> = {
  phase: 'bg-primary/10 text-primary border-primary/20',
  service: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  option: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  expense: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  discount: 'bg-red-500/10 text-red-600 border-red-500/20',
  group: 'bg-slate-500/10 text-slate-600 border-slate-500/20'
};

// Helper to convert old phases to new QuoteLine format
export function phaseToQuoteLine(phase: any, index: number): QuoteLine {
  return {
    id: phase.id || `line-${Date.now()}-${index}`,
    document_id: phase.document_id,
    phase_code: phase.phase_code,
    phase_name: phase.phase_name,
    phase_description: phase.phase_description,
    line_type: phase.line_type || 'phase',
    group_id: phase.group_id,
    pricing_ref: phase.pricing_ref,
    quantity: phase.quantity || 1,
    unit: phase.unit || 'forfait',
    unit_price: phase.unit_price || phase.amount || 0,
    amount: phase.amount || 0,
    percentage_fee: phase.percentage_fee,
    assigned_member_id: phase.assigned_member_id,
    assigned_skill: phase.assigned_skill,
    start_date: phase.start_date,
    end_date: phase.end_date,
    billing_type: phase.billing_type || 'one_time',
    recurrence_months: phase.recurrence_months,
    purchase_price: phase.purchase_price,
    margin_percentage: phase.margin_percentage,
    is_optional: !phase.is_included,
    is_included: phase.is_included !== false,
    deliverables: phase.deliverables || [],
    sort_order: phase.sort_order ?? index
  };
}

// Helper to convert QuoteLine back to database format
export function quoteLineToPhase(line: QuoteLine): any {
  return {
    id: line.id,
    document_id: line.document_id,
    phase_code: line.phase_code || '',
    phase_name: line.phase_name,
    phase_description: line.phase_description,
    line_type: line.line_type,
    pricing_ref: line.pricing_ref,
    percentage_fee: line.percentage_fee,
    amount: line.amount,
    is_included: line.is_included,
    deliverables: line.deliverables || [],
    start_date: line.start_date,
    end_date: line.end_date,
    sort_order: line.sort_order,
    assigned_member_id: line.assigned_member_id,
    assigned_skill: line.assigned_skill,
    purchase_price: line.purchase_price,
    margin_percentage: line.margin_percentage,
    billing_type: line.billing_type,
    recurrence_months: line.recurrence_months,
    unit: line.unit,
    quantity: line.quantity,
    unit_price: line.unit_price
  };
}
