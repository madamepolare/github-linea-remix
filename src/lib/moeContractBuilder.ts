// Builder to convert QuoteDocument data to MOEContractData for PDF generation

import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { 
  MOEContractData, 
  MOEMissionPhase,
  MOEPaymentSchedule,
  DEFAULT_MOE_MISSION_PHASES,
  DEFAULT_MOE_PAYMENT_SCHEDULE,
  DEFAULT_MOE_CLAUSES
} from './moeContractConfig';
import { parseDocumentMOEConfig, getDefaultMOEConfig } from './moeContractDefaults';
import { format } from 'date-fns';

interface AgencyInfoForPDF {
  name?: string;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  siret?: string | null;
  vat_number?: string | null;
  logo_url?: string | null;
  signature_url?: string | null;
}

/**
 * Extended document type for MOE builder with additional fields
 */
type MOEQuoteDocument = Partial<QuoteDocument> & {
  client_name?: string;
  client_company_name?: string;
  client_phone?: string;
  client_email?: string;
  project_constraints?: string;
  project_requirements?: string;
};

/**
 * Build MOEContractData from a QuoteDocument and its lines
 */
export function buildMOEContractDataFromDocument(
  document: MOEQuoteDocument,
  lines: QuoteLine[],
  agencyInfo?: AgencyInfoForPDF | null
): MOEContractData {
  // Parse MOE config from document
  const moeConfig = parseDocumentMOEConfig(document.general_conditions || null) 
    || getDefaultMOEConfig();
  
  // Calculate totals
  const includedLines = lines.filter(l => l.is_included !== false && !l.is_optional);
  const totalHT = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const tvaRate = (document.vat_rate || 20) / 100;
  const tvaAmount = totalHT * tvaRate;
  const totalTTC = totalHT + tvaAmount;
  
  // Build mission phases from lines
  const missionPhases: MOEMissionPhase[] = lines.map(line => ({
    code: line.phase_code || line.id?.slice(0, 3).toUpperCase() || 'PHA',
    name: line.phase_name || 'Phase',
    short_name: line.phase_code || 'PHA',
    description: line.phase_description || '',
    percentage: line.percentage_fee || (totalHT > 0 ? ((line.amount || 0) / totalHT * 100) : 0),
    is_included: line.is_included !== false,
    is_optional: line.is_optional || false,
    deliverables: line.deliverables || []
  }));
  
  // If no lines, use defaults
  if (missionPhases.length === 0 && moeConfig.mission_phases) {
    missionPhases.push(...moeConfig.mission_phases);
  }
  
  // Build honoraires from lines
  const honoraires = lines.map(line => ({
    name: line.phase_name || 'Prestation',
    quantity: line.quantity || 1,
    amount_ht: line.amount || 0,
    tva_rate: tvaRate,
    is_offered: false,
    is_optional: line.is_optional || false
  }));
  
  // Build payment schedule
  const paymentSchedule: MOEPaymentSchedule[] = moeConfig.payment_schedule?.length > 0
    ? moeConfig.payment_schedule
    : DEFAULT_MOE_PAYMENT_SCHEDULE;
  
  // Build clauses
  const clauses = {
    ...DEFAULT_MOE_CLAUSES,
    ...(moeConfig.clauses || {})
  };
  
  // Get client info from document - use nested objects or direct fields
  const clientName = document.client_name 
    || document.client_contact?.name 
    || document.client_company?.name 
    || 'Client';
  const clientCompanyName = document.client_company_name 
    || document.client_company?.name;
  const clientAddress = document.project_address || '';
  const clientCity = document.project_city || '';
  const clientPhone = document.client_phone;
  const clientEmail = document.client_email 
    || document.client_contact?.email;
  
  return {
    reference: document.document_number || generateReference(new Date(), clientName),
    date: document.created_at || new Date().toISOString(),
    moa: {
      type: 'moa',
      name: clientName,
      company_name: clientCompanyName,
      address: clientAddress,
      city: clientCity,
      phone: clientPhone,
      email: clientEmail
    },
    moe: {
      type: 'moe',
      name: agencyInfo?.name || '',
      company_name: agencyInfo?.name || undefined,
      address: agencyInfo?.address || '',
      postal_code: agencyInfo?.postal_code || undefined,
      city: agencyInfo?.city || undefined,
      phone: agencyInfo?.phone || undefined,
      email: agencyInfo?.email || undefined
    },
    project: {
      name: document.title || 'Projet',
      address: document.project_address || '',
      city: document.project_city,
      postal_code: '',
      existing_surface: undefined,
      project_surface: document.project_surface,
      project_type: mapProjectType(document.project_type),
      constraints: document.project_constraints,
      requirements: document.project_requirements,
      budget_global: document.construction_budget,
      budget_travaux: document.construction_budget,
      additional_notes: document.description
    },
    mission_phases: missionPhases,
    honoraires,
    total_ht: totalHT,
    tva_rate: tvaRate,
    tva_amount: tvaAmount,
    total_ttc: totalTTC,
    fee_calculation_method: mapFeeMode(document.fee_mode),
    payment_schedule: paymentSchedule,
    clauses,
    insurance_company: moeConfig.settings?.insurance_company,
    insurance_policy_number: moeConfig.settings?.insurance_policy_number
  };
}

/**
 * Generate a contract reference from date and client name
 */
function generateReference(date: Date, clientName: string): string {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const initials = clientName
    .split(' ')
    .map(word => word[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 3) || 'CLI';
  
  return `${year}${month}${day}_${initials}`;
}

/**
 * Map document project_type to MOE project type
 */
function mapProjectType(projectType?: string): 'renovation' | 'construction' | 'extension' | 'restructuration' {
  switch (projectType?.toLowerCase()) {
    case 'construction':
    case 'neuf':
      return 'construction';
    case 'extension':
      return 'extension';
    case 'restructuration':
      return 'restructuration';
    default:
      return 'renovation';
  }
}

/**
 * Map document fee_mode to MOE fee calculation method
 */
function mapFeeMode(feeMode?: string): 'forfait' | 'percentage' | 'hourly' {
  switch (feeMode?.toLowerCase()) {
    case 'percentage':
    case 'pourcentage':
      return 'percentage';
    case 'hourly':
    case 'regie':
      return 'hourly';
    default:
      return 'forfait';
  }
}

/**
 * Extended fields used by MOE contract builder
 * These are added to the document dynamically, not part of the base type
 */
export interface MOEDocumentExtensions {
  client_name?: string;
  client_company_name?: string;
  client_phone?: string;
  client_email?: string;
  project_constraints?: string;
  project_requirements?: string;
}
