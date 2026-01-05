// Types de documents par catégorie
export type DocumentCategory = 'administrative' | 'project' | 'hr' | 'commercial';

export type AdministrativeDocumentType = 
  | 'power_of_attorney'
  | 'attestation_insurance'
  | 'attestation_fiscal'
  | 'attestation_urssaf'
  | 'attestation_capacity'
  | 'certificate';

export type ProjectDocumentType =
  | 'service_order'
  | 'invoice'
  | 'amendment'
  | 'formal_notice'
  | 'validation_letter'
  | 'refusal_letter'
  | 'site_visit_report';

export type HRDocumentType =
  | 'employer_certificate'
  | 'expense_report'
  | 'mission_order'
  | 'training_certificate';

export type DocumentType = AdministrativeDocumentType | ProjectDocumentType | HRDocumentType;

export type DocumentStatus = 'draft' | 'generated' | 'sent' | 'signed' | 'expired';

// Labels français
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  administrative: 'Administratif',
  project: 'Projet',
  hr: 'RH / Équipe',
  commercial: 'Commercial',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  // Administratif
  power_of_attorney: 'Pouvoir / Délégation',
  attestation_insurance: 'Attestation assurance',
  attestation_fiscal: 'Attestation fiscale',
  attestation_urssaf: 'Attestation URSSAF',
  attestation_capacity: 'Attestation de capacité',
  certificate: 'Certificat',
  // Projet
  service_order: 'Ordre de service',
  invoice: 'Note d\'honoraires',
  amendment: 'Avenant',
  formal_notice: 'Mise en demeure',
  validation_letter: 'Courrier de validation',
  refusal_letter: 'Courrier de refus',
  site_visit_report: 'Rapport de visite',
  // RH
  employer_certificate: 'Attestation employeur',
  expense_report: 'Note de frais',
  mission_order: 'Ordre de mission',
  training_certificate: 'Attestation de formation',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Brouillon',
  generated: 'Généré',
  sent: 'Envoyé',
  signed: 'Signé',
  expired: 'Expiré',
};

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  generated: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  sent: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  signed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

// Types par catégorie
export const DOCUMENT_TYPES_BY_CATEGORY: Record<DocumentCategory, DocumentType[]> = {
  administrative: [
    'power_of_attorney',
    'attestation_insurance',
    'attestation_fiscal',
    'attestation_urssaf',
    'attestation_capacity',
    'certificate',
  ],
  project: [
    'service_order',
    'invoice',
    'amendment',
    'formal_notice',
    'validation_letter',
    'refusal_letter',
    'site_visit_report',
  ],
  hr: [
    'employer_certificate',
    'expense_report',
    'mission_order',
    'training_certificate',
  ],
  commercial: [], // Pas de types ici, lien vers commercial_documents
};

// Icônes par type
export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  power_of_attorney: 'Scale',
  attestation_insurance: 'Shield',
  attestation_fiscal: 'Receipt',
  attestation_urssaf: 'FileCheck',
  attestation_capacity: 'BadgeCheck',
  certificate: 'Award',
  service_order: 'FileSignature',
  invoice: 'Receipt',
  amendment: 'FilePen',
  formal_notice: 'AlertTriangle',
  validation_letter: 'CheckCircle',
  refusal_letter: 'XCircle',
  site_visit_report: 'ClipboardList',
  employer_certificate: 'UserCheck',
  expense_report: 'Wallet',
  mission_order: 'Plane',
  training_certificate: 'GraduationCap',
};

// Interface pour les documents
export interface AgencyDocument {
  id: string;
  workspace_id: string;
  category: DocumentCategory;
  document_type: DocumentType;
  title: string;
  document_number: string | null;
  description: string | null;
  project_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  related_document_id: string | null;
  content: Record<string, unknown>;
  template_id: string | null;
  pdf_url: string | null;
  attachments: string[];
  status: DocumentStatus;
  valid_from: string | null;
  valid_until: string | null;
  sent_at: string | null;
  signed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  project?: { id: string; name: string } | null;
  contact?: { id: string; name: string } | null;
  company?: { id: string; name: string } | null;
}

export interface DocumentTemplate {
  id: string;
  workspace_id: string;
  category: DocumentCategory;
  document_type: DocumentType;
  name: string;
  description: string | null;
  content_schema: DocumentField[];
  pdf_template: Record<string, unknown>;
  default_content: Record<string, unknown>;
  is_system: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | number | boolean;
}

// Contenu spécifique par type de document
export interface PowerOfAttorneyContent {
  delegator_name: string;
  delegator_role: string;
  delegate_name: string;
  delegate_role: string;
  scope: string;
  start_date: string;
  end_date: string;
  specific_powers: string[];
}

export interface ServiceOrderContent {
  order_type: 'start' | 'suspend' | 'resume' | 'stop';
  project_name: string;
  project_address: string;
  client_name: string;
  effective_date: string;
  phase_code: string;
  phase_name: string;
  instructions: string;
}

export interface InvoiceContent {
  invoice_date: string;
  due_date: string;
  client_name: string;
  client_address: string;
  project_name: string;
  phases: {
    code: string;
    name: string;
    amount: number;
    percentage_invoiced: number;
  }[];
  subtotal: number;
  tva_rate: number;
  tva_amount: number;
  total: number;
  payment_terms: string;
  bank_details: {
    iban: string;
    bic: string;
    bank_name: string;
  };
}

export interface AmendmentContent {
  amendment_number: number;
  original_contract_number: string;
  original_contract_date: string;
  project_name: string;
  client_name: string;
  reason: string;
  modifications: {
    type: 'scope' | 'duration' | 'budget' | 'other';
    description: string;
    old_value: string;
    new_value: string;
  }[];
  new_total: number;
  effective_date: string;
}

export interface MissionOrderContent {
  employee_name: string;
  employee_role: string;
  destination: string;
  departure_date: string;
  return_date: string;
  mission_purpose: string;
  transport_mode: string;
  accommodation: string;
  budget_estimate: number;
  advance_requested: number;
}

export interface ExpenseReportContent {
  employee_name: string;
  period_start: string;
  period_end: string;
  expenses: {
    date: string;
    description: string;
    category: string;
    amount: number;
    receipt_url: string;
  }[];
  total: number;
  advance_received: number;
  amount_due: number;
}
