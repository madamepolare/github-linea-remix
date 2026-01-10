// Types and configuration for PDF block system

import { CommercialDocument, CommercialDocumentPhase } from './commercialTypes';
import { QuoteLine, QuoteDocument } from '@/types/quoteTypes';
import { AgencyPDFInfo } from './pdfUtils';

// ============= Block Type Definitions =============

export type PDFBlockType = 
  | 'cover'
  | 'header'
  | 'client'
  | 'project'
  | 'lines'
  | 'phases' // For architecture/MOP
  | 'totals'
  | 'payment'
  | 'conditions'
  | 'signatures';

export interface PDFBlockConfig {
  block_type: PDFBlockType;
  sort_order: number;
  is_required: boolean;
  custom_title?: string;
  options?: Record<string, any>;
}

export interface PDFDocumentConfig {
  quote: PDFBlockConfig[];
  contract: PDFBlockConfig[];
  proposal: PDFBlockConfig[];
}

// ============= Render Context =============

export interface PDFRenderContext {
  document: Partial<QuoteDocument> | Partial<CommercialDocument>;
  lines: QuoteLine[];
  phases?: CommercialDocumentPhase[];
  agencyInfo?: AgencyPDFInfo;
  logoBase64: string | null;
  signatureBase64: string | null;
  total: number;
  formatCurrency: (amount: number) => string;
}

// ============= Default Configurations =============

export const DEFAULT_QUOTE_BLOCKS: PDFBlockConfig[] = [
  { block_type: 'header', sort_order: 1, is_required: true },
  { block_type: 'client', sort_order: 2, is_required: true },
  { block_type: 'project', sort_order: 3, is_required: true },
  { block_type: 'lines', sort_order: 4, is_required: true },
  { block_type: 'totals', sort_order: 5, is_required: true },
  { block_type: 'payment', sort_order: 6, is_required: false },
  { block_type: 'conditions', sort_order: 7, is_required: false },
  { block_type: 'signatures', sort_order: 8, is_required: true },
];

export const DEFAULT_CONTRACT_BLOCKS: PDFBlockConfig[] = [
  { block_type: 'cover', sort_order: 1, is_required: false },
  { block_type: 'header', sort_order: 2, is_required: true },
  { block_type: 'client', sort_order: 3, is_required: true },
  { block_type: 'project', sort_order: 4, is_required: true },
  { block_type: 'lines', sort_order: 5, is_required: true },
  { block_type: 'totals', sort_order: 6, is_required: true },
  { block_type: 'payment', sort_order: 7, is_required: true },
  { block_type: 'conditions', sort_order: 8, is_required: true },
  { block_type: 'signatures', sort_order: 9, is_required: true },
];

export const DEFAULT_PROPOSAL_BLOCKS: PDFBlockConfig[] = [
  { block_type: 'cover', sort_order: 1, is_required: true },
  { block_type: 'project', sort_order: 2, is_required: true },
  { block_type: 'lines', sort_order: 3, is_required: true },
  { block_type: 'totals', sort_order: 4, is_required: true },
  { block_type: 'signatures', sort_order: 5, is_required: false },
];

export const DEFAULT_PDF_CONFIG: PDFDocumentConfig = {
  quote: DEFAULT_QUOTE_BLOCKS,
  contract: DEFAULT_CONTRACT_BLOCKS,
  proposal: DEFAULT_PROPOSAL_BLOCKS,
};

// ============= Block Labels =============

export const BLOCK_TYPE_LABELS: Record<PDFBlockType, string> = {
  cover: 'Page de couverture',
  header: 'En-tête',
  client: 'Informations client',
  project: 'Détails du projet',
  lines: 'Tableau des prestations',
  phases: 'Phases de mission (MOP)',
  totals: 'Récapitulatif des montants',
  payment: 'Conditions de paiement',
  conditions: 'Conditions générales',
  signatures: 'Signatures',
};

export const BLOCK_TYPE_DESCRIPTIONS: Record<PDFBlockType, string> = {
  cover: 'Page de garde avec titre et visuels',
  header: 'Logo, coordonnées et numéro de document',
  client: 'Nom et coordonnées du client',
  project: 'Localisation, surface, type de projet',
  lines: 'Lignes de prestation avec montants',
  phases: 'Phases de mission loi MOP avec %',
  totals: 'Total HT, TVA, TTC',
  payment: 'Échéancier et modalités de règlement',
  conditions: 'CGV et conditions particulières',
  signatures: 'Zone de signature client et agence',
};

// ============= Helper Functions =============

export function getBlocksForDocumentType(
  config: PDFDocumentConfig | null | undefined,
  documentType: 'quote' | 'contract' | 'proposal'
): PDFBlockConfig[] {
  if (!config || !config[documentType] || !Array.isArray(config[documentType])) {
    return DEFAULT_PDF_CONFIG[documentType];
  }
  return config[documentType].sort((a, b) => a.sort_order - b.sort_order);
}

export function isValidPDFConfig(config: any): config is PDFDocumentConfig {
  if (!config || typeof config !== 'object') return false;
  
  const hasQuote = Array.isArray(config.quote);
  const hasContract = Array.isArray(config.contract);
  const hasProposal = Array.isArray(config.proposal);
  
  return hasQuote || hasContract || hasProposal;
}
