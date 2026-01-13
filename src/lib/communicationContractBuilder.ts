// Builder to convert QuoteDocument data to CommunicationContractData for PDF generation

import { QuoteDocument, QuoteLine } from '@/types/quoteTypes';
import { 
  CommunicationContractData,
} from './generateCommunicationContractPDF';
import {
  CommunicationPhase,
  DEFAULT_COMMUNICATION_PHASES,
  DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE,
  DEFAULT_COMMUNICATION_CLAUSES,
  parseCommunicationConfig
} from './communicationContractDefaults';
import { MOEPaymentSchedule } from './moeContractConfig';

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
 * Extended document type for Communication builder with additional fields
 */
type CommunicationQuoteDocument = Partial<QuoteDocument> & {
  client_name?: string;
  client_company_name?: string;
  client_phone?: string;
  client_email?: string;
};

/**
 * Build CommunicationContractData from a QuoteDocument and its lines
 */
export function buildCommunicationContractDataFromDocument(
  document: CommunicationQuoteDocument,
  lines: QuoteLine[],
  agencyInfo?: AgencyInfoForPDF | null
): CommunicationContractData {
  // Parse communication config from document's general_conditions
  const parsedConfig = parseCommunicationConfig(document.general_conditions || null);
  
  // Get TVA rate
  const tvaRate = (document.vat_rate || 20) / 100;
  
  // Build phases - prioritize parsed config, then defaults
  let phases: CommunicationPhase[] = [];
  let prestations: CommunicationContractData['prestations'] = [];
  let totalHT = 0;
  
  if (lines && lines.length > 0) {
    // Use lines from the document
    const includedLines = lines.filter(l => l.is_included !== false && l.line_type !== 'group');
    totalHT = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
    
    phases = lines
      .filter(l => l.line_type !== 'group')
      .map(line => ({
        code: line.phase_code || line.id?.slice(0, 4).toUpperCase() || 'PHASE',
        name: line.phase_name || 'Phase',
        short_name: line.phase_code || 'PHA',
        description: line.phase_description || '',
        percentage: line.percentage_fee || (totalHT > 0 ? ((line.amount || 0) / totalHT * 100) : 0),
        is_included: line.is_included !== false,
        is_optional: line.is_optional || false,
        deliverables: line.deliverables || []
      }));
    
    prestations = lines
      .filter(l => l.is_included !== false && l.line_type !== 'group')
      .map(line => ({
        name: line.phase_name || 'Prestation',
        quantity: line.quantity || 1,
        amount_ht: line.amount || 0,
        tva_rate: tvaRate,
        is_optional: line.is_optional || false
      }));
  } else if (parsedConfig?.phases && parsedConfig.phases.length > 0) {
    // Use phases from config
    phases = parsedConfig.phases;
    totalHT = document.total_amount || 5000;
    
    prestations = phases
      .filter(phase => phase.is_included)
      .map(phase => ({
        name: phase.name,
        quantity: 1,
        amount_ht: (phase.percentage / 100) * totalHT,
        tva_rate: tvaRate,
        is_optional: phase.is_optional || false
      }));
  } else {
    // Use absolute defaults
    phases = DEFAULT_COMMUNICATION_PHASES;
    totalHT = document.total_amount || 5000;
    
    prestations = phases
      .filter(phase => phase.is_included)
      .map(phase => ({
        name: phase.name,
        quantity: 1,
        amount_ht: (phase.percentage / 100) * totalHT,
        tva_rate: tvaRate,
        is_optional: phase.is_optional || false
      }));
  }
  
  // Calculate totals
  const tvaAmount = totalHT * tvaRate;
  const totalTTC = totalHT + tvaAmount;
  
  // Build payment schedule from config or defaults
  const paymentSchedule: MOEPaymentSchedule[] = 
    (parsedConfig?.payment_schedule && parsedConfig.payment_schedule.length > 0)
      ? parsedConfig.payment_schedule
      : DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE;
  
  // Build clauses - merge defaults with config
  const clauses = {
    ...DEFAULT_COMMUNICATION_CLAUSES,
    ...(parsedConfig?.clauses || {})
  };
  
  // Get client info from document
  const clientName = document.client_name 
    || document.client_contact?.name 
    || document.client_company?.name 
    || 'Client';
  const clientCompanyName = document.client_company_name 
    || document.client_company?.name;
  const clientAddress = document.project_address || '';
  const clientCity = document.project_city || '';
  const clientPostalCode = '';
  const clientPhone = document.client_phone;
  const clientEmail = document.client_email 
    || document.client_contact?.email;
  
  return {
    reference: document.document_number || generateReference(new Date(), clientName),
    date: document.created_at || new Date().toISOString(),
    client: {
      name: clientName,
      company_name: clientCompanyName,
      address: clientAddress,
      city: clientCity,
      postal_code: clientPostalCode,
      phone: clientPhone,
      email: clientEmail
    },
    agency: {
      name: agencyInfo?.name || '',
      address: agencyInfo?.address || undefined,
      postal_code: agencyInfo?.postal_code || undefined,
      city: agencyInfo?.city || undefined,
      phone: agencyInfo?.phone || undefined,
      email: agencyInfo?.email || undefined,
      siret: agencyInfo?.siret || undefined,
      vat_number: agencyInfo?.vat_number || undefined
    },
    project: {
      name: document.title || 'Projet',
      description: document.description,
      budget: document.project_budget || document.construction_budget
    },
    phases,
    prestations,
    total_ht: totalHT,
    tva_rate: tvaRate,
    tva_amount: tvaAmount,
    total_ttc: totalTTC,
    payment_schedule: paymentSchedule,
    clauses,
    daily_rate: parsedConfig?.settings?.daily_rate || 800
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
  
  return `COM-${year}${month}${day}-${initials}`;
}
