/**
 * QUOTE TEMPLATE VARIABLES - SINGLE SOURCE OF TRUTH
 * 
 * Ce fichier définit TOUTES les variables disponibles pour les templates HTML de devis.
 * Toute modification ici sera automatiquement reflétée dans:
 * - L'éditeur HTML (QuoteHtmlEditor)
 * - L'aperçu des devis (QuotePreviewPanel)
 * - La génération PDF
 * - L'edge function generate-quote-html
 * 
 * Format Mustache utilisé:
 * - {{variable}} pour les valeurs simples
 * - {{#array}}...{{/array}} pour les boucles
 * - {{#condition}}...{{/condition}} pour les conditionnels
 */

import { QuoteDocument, QuoteLine, LINE_TYPE_LABELS } from '@/types/quoteTypes';
import { QuoteTheme } from '@/hooks/useQuoteThemes';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ===============================
// VARIABLE DEFINITIONS (pour documentation et génération IA)
// ===============================

export interface TemplateVariableDefinition {
  key: string;
  label: string;
  description: string;
  category: 'agency' | 'client' | 'project' | 'document' | 'financial' | 'conditions' | 'dates' | 'meta';
  example: string;
}

export interface TemplateArrayDefinition {
  key: string;
  label: string;
  description: string;
  innerVariables: TemplateVariableDefinition[];
}

// Toutes les variables simples disponibles
export const TEMPLATE_VARIABLES: TemplateVariableDefinition[] = [
  // ===== DOCUMENT =====
  { key: 'document_number', label: 'Numéro du document', description: 'Numéro unique du devis/contrat', category: 'document', example: 'DEV-2025-001' },
  { key: 'document_type', label: 'Type de document', description: 'Devis ou Contrat', category: 'document', example: 'Devis' },
  { key: 'document_title', label: 'Titre du document', description: 'Titre personnalisé du devis', category: 'document', example: 'Mission d\'architecture d\'intérieur' },
  { key: 'document_description', label: 'Description', description: 'Description détaillée du document', category: 'document', example: 'Rénovation complète appartement 120m²' },
  { key: 'document_status', label: 'Statut', description: 'État du document', category: 'document', example: 'Brouillon' },
  { key: 'reference_client', label: 'Référence client', description: 'Référence fournie par le client', category: 'document', example: 'REF-CLIENT-123' },
  { key: 'market_reference', label: 'Référence marché', description: 'Référence du marché public', category: 'document', example: 'MP-2025-001' },
  { key: 'is_public_market', label: 'Marché public', description: 'Indicateur marché public (Oui/Non)', category: 'document', example: 'Oui' },
  { key: 'is_amendment', label: 'Avenant', description: 'Indicateur avenant (Oui/Non)', category: 'document', example: 'Non' },
  
  // ===== AGENCE =====
  { key: 'agency_name', label: 'Nom de l\'agence', description: 'Raison sociale', category: 'agency', example: 'Studio Architecture' },
  { key: 'agency_address', label: 'Adresse agence', description: 'Adresse complète', category: 'agency', example: '123 Rue de l\'Exemple' },
  { key: 'agency_city', label: 'Ville agence', description: 'Ville et code postal', category: 'agency', example: '75001 Paris' },
  { key: 'agency_postal_code', label: 'Code postal agence', description: 'Code postal seul', category: 'agency', example: '75001' },
  { key: 'agency_phone', label: 'Téléphone agence', description: 'Numéro de téléphone', category: 'agency', example: '01 23 45 67 89' },
  { key: 'agency_email', label: 'Email agence', description: 'Adresse email', category: 'agency', example: 'contact@studio.fr' },
  { key: 'agency_website', label: 'Site web agence', description: 'URL du site web', category: 'agency', example: 'www.studio-architecture.fr' },
  { key: 'agency_logo_url', label: 'Logo agence', description: 'URL du logo', category: 'agency', example: 'https://...' },
  { key: 'agency_siret', label: 'SIRET', description: 'Numéro SIRET', category: 'agency', example: '123 456 789 00012' },
  { key: 'agency_siren', label: 'SIREN', description: 'Numéro SIREN', category: 'agency', example: '123 456 789' },
  { key: 'agency_vat_number', label: 'N° TVA', description: 'Numéro de TVA intracommunautaire', category: 'agency', example: 'FR12345678901' },
  { key: 'agency_capital', label: 'Capital social', description: 'Capital social', category: 'agency', example: '10 000 €' },
  { key: 'agency_legal_form', label: 'Forme juridique', description: 'Forme juridique de l\'entreprise', category: 'agency', example: 'SARL' },
  { key: 'agency_rcs_city', label: 'Ville RCS', description: 'Ville d\'immatriculation RCS', category: 'agency', example: 'Paris' },
  { key: 'agency_naf_code', label: 'Code NAF', description: 'Code APE/NAF', category: 'agency', example: '7111Z' },
  
  // ===== CLIENT =====
  { key: 'client_name', label: 'Nom client', description: 'Nom de l\'entreprise cliente', category: 'client', example: 'Société Exemple SAS' },
  { key: 'client_logo_url', label: 'Logo client', description: 'URL du logo client', category: 'client', example: 'https://...' },
  { key: 'client_address', label: 'Adresse client', description: 'Adresse complète du client', category: 'client', example: '456 Avenue du Client' },
  { key: 'client_city', label: 'Ville client', description: 'Ville du client', category: 'client', example: 'Lyon' },
  { key: 'client_postal_code', label: 'Code postal client', description: 'Code postal du client', category: 'client', example: '69001' },
  { key: 'client_contact_name', label: 'Contact client', description: 'Nom du contact principal', category: 'client', example: 'Jean Dupont' },
  { key: 'client_contact_email', label: 'Email contact', description: 'Email du contact principal', category: 'client', example: 'jean.dupont@example.fr' },
  { key: 'client_contact_role', label: 'Fonction contact', description: 'Rôle du contact dans l\'entreprise', category: 'client', example: 'Directeur Général' },
  { key: 'billing_contact_name', label: 'Contact facturation', description: 'Nom du contact facturation', category: 'client', example: 'Marie Martin' },
  { key: 'billing_contact_email', label: 'Email facturation', description: 'Email du contact facturation', category: 'client', example: 'comptabilite@example.fr' },
  
  // ===== PROJET =====
  { key: 'project_name', label: 'Nom du projet', description: 'Titre du projet', category: 'project', example: 'Résidence Les Jardins' },
  { key: 'project_type', label: 'Type de projet', description: 'Catégorie du projet', category: 'project', example: 'Architecture d\'intérieur' },
  { key: 'project_address', label: 'Adresse projet', description: 'Adresse du chantier', category: 'project', example: '789 Boulevard du Projet' },
  { key: 'project_city', label: 'Ville projet', description: 'Ville du projet', category: 'project', example: 'Bordeaux' },
  { key: 'project_postal_code', label: 'Code postal projet', description: 'Code postal du projet', category: 'project', example: '33000' },
  { key: 'project_surface', label: 'Surface', description: 'Surface en m²', category: 'project', example: '120 m²' },
  { key: 'project_budget', label: 'Budget projet', description: 'Budget global du projet', category: 'project', example: '150 000 €' },
  { key: 'construction_budget', label: 'Budget travaux', description: 'Budget construction/travaux', category: 'project', example: '100 000 €' },
  { key: 'construction_budget_disclosed', label: 'Budget travaux communiqué', description: 'Oui/Non si budget communiqué', category: 'project', example: 'Oui' },
  
  // ===== FINANCIER =====
  { key: 'fee_mode', label: 'Mode de rémunération', description: 'Type de tarification', category: 'financial', example: 'Forfait' },
  { key: 'fee_percentage', label: 'Taux honoraires', description: 'Pourcentage des honoraires', category: 'financial', example: '12%' },
  { key: 'hourly_rate', label: 'Taux horaire', description: 'Taux horaire en euros', category: 'financial', example: '85 €/h' },
  { key: 'subtotal_ht', label: 'Sous-total HT', description: 'Total avant remises', category: 'financial', example: '55 000 €' },
  { key: 'total_discount', label: 'Total remises', description: 'Montant total des remises', category: 'financial', example: '5 000 €' },
  { key: 'total_ht', label: 'Total HT', description: 'Total hors taxes après remises', category: 'financial', example: '50 000 €' },
  { key: 'vat_rate', label: 'Taux TVA', description: 'Taux de TVA appliqué', category: 'financial', example: '20%' },
  { key: 'vat_type', label: 'Type TVA', description: 'Type de TVA (standard, exonéré...)', category: 'financial', example: 'Standard' },
  { key: 'tva_amount', label: 'Montant TVA', description: 'Montant de la TVA', category: 'financial', example: '10 000 €' },
  { key: 'total_ttc', label: 'Total TTC', description: 'Total toutes taxes comprises', category: 'financial', example: '60 000 €' },
  { key: 'requires_deposit', label: 'Acompte requis', description: 'Indicateur acompte (Oui/Non)', category: 'financial', example: 'Oui' },
  { key: 'deposit_percentage', label: 'Pourcentage acompte', description: 'Pourcentage d\'acompte', category: 'financial', example: '30%' },
  { key: 'deposit_amount', label: 'Montant acompte', description: 'Montant de l\'acompte', category: 'financial', example: '18 000 €' },
  { key: 'currency', label: 'Devise', description: 'Devise utilisée', category: 'financial', example: 'EUR' },
  
  // ===== CONDITIONS =====
  { key: 'payment_terms', label: 'Conditions de paiement', description: 'Termes de paiement', category: 'conditions', example: 'Paiement à 30 jours' },
  { key: 'special_conditions', label: 'Conditions particulières', description: 'Conditions spécifiques au projet', category: 'conditions', example: 'Démarrage conditionné à l\'obtention du PC' },
  { key: 'general_conditions', label: 'Conditions générales', description: 'CGV complètes', category: 'conditions', example: 'Conformément aux conditions générales...' },
  { key: 'header_text', label: 'Texte en-tête', description: 'Texte personnalisé en haut', category: 'conditions', example: 'Suite à notre entretien du...' },
  { key: 'footer_text', label: 'Texte pied de page', description: 'Texte personnalisé en bas', category: 'conditions', example: 'Merci pour votre confiance' },
  
  // ===== DATES =====
  { key: 'date', label: 'Date du document', description: 'Date de création du devis', category: 'dates', example: '18 janvier 2025' },
  { key: 'validity_days', label: 'Jours de validité', description: 'Nombre de jours de validité', category: 'dates', example: '30' },
  { key: 'validity_date', label: 'Date de validité', description: 'Date limite de validité', category: 'dates', example: '18 février 2025' },
  { key: 'expected_start_date', label: 'Date début prévue', description: 'Date de démarrage prévue', category: 'dates', example: '1 mars 2025' },
  { key: 'expected_end_date', label: 'Date fin prévue', description: 'Date de fin prévue', category: 'dates', example: '30 juin 2025' },
  { key: 'expected_signature_date', label: 'Date signature prévue', description: 'Date de signature prévue', category: 'dates', example: '20 janvier 2025' },
  { key: 'sent_at', label: 'Date d\'envoi', description: 'Date d\'envoi du document', category: 'dates', example: '19 janvier 2025' },
  { key: 'accepted_at', label: 'Date d\'acceptation', description: 'Date d\'acceptation', category: 'dates', example: '25 janvier 2025' },
  { key: 'signed_at', label: 'Date de signature', description: 'Date de signature', category: 'dates', example: '25 janvier 2025' },
  
  // ===== META =====
  { key: 'current_date', label: 'Date actuelle', description: 'Date du jour', category: 'meta', example: '18 janvier 2025' },
  { key: 'current_year', label: 'Année actuelle', description: 'Année en cours', category: 'meta', example: '2025' },
];

// Variables de boucle (arrays)
export const TEMPLATE_ARRAYS: TemplateArrayDefinition[] = [
  {
    key: 'phases',
    label: 'Phases/Prestations',
    description: 'Toutes les lignes incluses (phases, services, frais)',
    innerVariables: [
      { key: 'phase_code', label: 'Code', description: 'Code de la phase', category: 'document', example: 'ESQ' },
      { key: 'phase_name', label: 'Nom', description: 'Nom de la phase', category: 'document', example: 'Esquisse' },
      { key: 'phase_description', label: 'Description', description: 'Description détaillée', category: 'document', example: 'Études préliminaires...' },
      { key: 'phase_type', label: 'Type', description: 'Type de ligne', category: 'document', example: 'Phase' },
      { key: 'phase_quantity', label: 'Quantité', description: 'Quantité', category: 'document', example: '1' },
      { key: 'phase_unit', label: 'Unité', description: 'Unité de mesure', category: 'document', example: 'forfait' },
      { key: 'phase_unit_price', label: 'Prix unitaire', description: 'Prix unitaire HT', category: 'document', example: '5 000 €' },
      { key: 'phase_amount', label: 'Montant HT', description: 'Montant total HT', category: 'document', example: '5 000 €' },
      { key: 'phase_percentage', label: 'Pourcentage', description: 'Pourcentage du total', category: 'document', example: '10%' },
      { key: 'phase_start_date', label: 'Date début', description: 'Date de début', category: 'document', example: '1 mars 2025' },
      { key: 'phase_end_date', label: 'Date fin', description: 'Date de fin', category: 'document', example: '15 mars 2025' },
      { key: 'phase_is_optional', label: 'Optionnel', description: 'Oui/Non', category: 'document', example: 'Non' },
    ]
  },
  {
    key: 'deliverables',
    label: 'Livrables (par phase)',
    description: 'Liste des livrables pour chaque phase',
    innerVariables: [
      { key: 'deliverable_name', label: 'Nom du livrable', description: 'Description du livrable', category: 'document', example: 'Plans 2D échelle 1/50' },
    ]
  },
  {
    key: 'options',
    label: 'Options',
    description: 'Lignes optionnelles (non incluses)',
    innerVariables: [
      { key: 'option_code', label: 'Code', description: 'Code de l\'option', category: 'document', example: 'OPT-1' },
      { key: 'option_name', label: 'Nom', description: 'Nom de l\'option', category: 'document', example: 'Visite supplémentaire' },
      { key: 'option_description', label: 'Description', description: 'Description', category: 'document', example: 'Visite de chantier supplémentaire' },
      { key: 'option_amount', label: 'Montant', description: 'Montant HT', category: 'document', example: '500 €' },
    ]
  },
  {
    key: 'discounts',
    label: 'Remises',
    description: 'Lignes de remise',
    innerVariables: [
      { key: 'discount_name', label: 'Nom', description: 'Libellé de la remise', category: 'document', example: 'Remise fidélité' },
      { key: 'discount_description', label: 'Description', description: 'Description', category: 'document', example: 'Remise client fidèle' },
      { key: 'discount_amount', label: 'Montant', description: 'Montant de la remise', category: 'document', example: '-2 500 €' },
      { key: 'discount_percentage', label: 'Pourcentage', description: 'Pourcentage de remise', category: 'document', example: '5%' },
    ]
  },
  {
    key: 'groups',
    label: 'Groupes',
    description: 'Groupes de lignes',
    innerVariables: [
      { key: 'group_name', label: 'Nom du groupe', description: 'Nom du groupe', category: 'document', example: 'Études préliminaires' },
      { key: 'group_subtotal', label: 'Sous-total', description: 'Sous-total du groupe', category: 'document', example: '15 000 €' },
    ]
  },
  {
    key: 'invoice_schedule',
    label: 'Échéancier',
    description: 'Échéancier de facturation',
    innerVariables: [
      { key: 'schedule_number', label: 'Numéro', description: 'Numéro de l\'échéance', category: 'document', example: '1' },
      { key: 'schedule_title', label: 'Titre', description: 'Titre de l\'échéance', category: 'document', example: 'Acompte à la commande' },
      { key: 'schedule_percentage', label: 'Pourcentage', description: 'Pourcentage de l\'échéance', category: 'document', example: '30%' },
      { key: 'schedule_amount_ht', label: 'Montant HT', description: 'Montant HT', category: 'document', example: '15 000 €' },
      { key: 'schedule_amount_ttc', label: 'Montant TTC', description: 'Montant TTC', category: 'document', example: '18 000 €' },
      { key: 'schedule_date', label: 'Date prévue', description: 'Date prévue', category: 'document', example: '1 février 2025' },
      { key: 'schedule_milestone', label: 'Jalon', description: 'Événement déclencheur', category: 'document', example: 'Validation APS' },
    ]
  },
];

// ===============================
// DATA MAPPER - Convertit les données réelles en variables template
// ===============================

export interface AgencyInfo {
  name?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  siret?: string;
  siren?: string;
  vat_number?: string;
  capital_social?: number;
  forme_juridique?: string;
  rcs_city?: string;
  code_naf?: string;
}

export interface TemplateData {
  [key: string]: string | TemplatePhase[] | TemplateOption[] | TemplateDiscount[] | TemplateGroup[] | TemplateScheduleItem[];
}

export interface TemplatePhase {
  phase_code: string;
  phase_name: string;
  phase_description: string;
  phase_type: string;
  phase_quantity: string;
  phase_unit: string;
  phase_unit_price: string;
  phase_amount: string;
  phase_percentage: string;
  phase_start_date: string;
  phase_end_date: string;
  phase_is_optional: string;
  deliverables: { deliverable_name: string }[];
}

export interface TemplateOption {
  option_code: string;
  option_name: string;
  option_description: string;
  option_amount: string;
}

export interface TemplateDiscount {
  discount_name: string;
  discount_description: string;
  discount_amount: string;
  discount_percentage: string;
}

export interface TemplateGroup {
  group_name: string;
  group_subtotal: string;
}

export interface TemplateScheduleItem {
  schedule_number: string;
  schedule_title: string;
  schedule_percentage: string;
  schedule_amount_ht: string;
  schedule_amount_ttc: string;
  schedule_date: string;
  schedule_milestone: string;
}

// Fonctions utilitaires
const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null) return '';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: fr });
  } catch {
    return dateStr;
  }
};

const formatPercentage = (value?: number): string => {
  if (value === undefined || value === null) return '';
  return `${value}%`;
};

/**
 * Génère toutes les variables template à partir des données business
 */
export function mapDocumentToTemplateData(
  document: Partial<QuoteDocument>,
  lines: QuoteLine[],
  agencyInfo?: AgencyInfo | null
): TemplateData {
  // Calculs financiers
  const includedLines = lines.filter(l => l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
  const discountLines = lines.filter(l => l.line_type === 'discount');
  const optionalLines = lines.filter(l => !l.is_included && l.line_type !== 'discount' && l.line_type !== 'group');
  const groups = lines.filter(l => l.line_type === 'group');
  
  const subtotal = includedLines.reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalDiscount = discountLines.reduce((sum, l) => sum + Math.abs(l.amount || 0), 0);
  const totalHT = subtotal - totalDiscount;
  const vatRate = document.vat_rate ?? 20;
  const tvaAmount = totalHT * (vatRate / 100);
  const totalTTC = totalHT + tvaAmount;
  const depositAmount = document.requires_deposit && document.deposit_percentage 
    ? totalTTC * (document.deposit_percentage / 100)
    : 0;
  
  // Validity date
  const validityDate = document.valid_until 
    ? formatDate(document.valid_until)
    : document.validity_days 
      ? formatDate(new Date(Date.now() + document.validity_days * 24 * 60 * 60 * 1000).toISOString())
      : '';

  // Get group lines helper
  const getGroupLines = (groupId: string) => lines.filter(l => l.group_id === groupId && l.line_type !== 'group');
  const getGroupSubtotal = (groupId: string) => {
    return getGroupLines(groupId)
      .filter(l => l.is_included && l.line_type !== 'discount')
      .reduce((sum, l) => sum + (l.amount || 0), 0);
  };

  // Map phases (included lines)
  const phases: TemplatePhase[] = includedLines
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(line => ({
      phase_code: line.phase_code || '',
      phase_name: line.phase_name || '',
      phase_description: line.phase_description || '',
      phase_type: LINE_TYPE_LABELS[line.line_type] || line.line_type,
      phase_quantity: String(line.quantity || 1),
      phase_unit: line.unit || 'forfait',
      phase_unit_price: formatCurrency(line.unit_price),
      phase_amount: formatCurrency(line.amount),
      phase_percentage: line.percentage_fee ? formatPercentage(line.percentage_fee) : '',
      phase_start_date: formatDate(line.start_date),
      phase_end_date: formatDate(line.end_date),
      phase_is_optional: line.is_optional ? 'Oui' : 'Non',
      deliverables: (line.deliverables || []).map(d => ({ deliverable_name: d })),
    }));

  // Map options
  const options: TemplateOption[] = optionalLines
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(line => ({
      option_code: line.phase_code || '',
      option_name: line.phase_name || '',
      option_description: line.phase_description || '',
      option_amount: formatCurrency(line.amount),
    }));

  // Map discounts
  const discounts: TemplateDiscount[] = discountLines
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(line => ({
      discount_name: line.phase_name || 'Remise',
      discount_description: line.phase_description || '',
      discount_amount: formatCurrency(-Math.abs(line.amount || 0)),
      discount_percentage: line.percentage_fee ? formatPercentage(line.percentage_fee) : '',
    }));

  // Map groups
  const groupsData: TemplateGroup[] = groups
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(group => ({
      group_name: group.phase_name || '',
      group_subtotal: formatCurrency(getGroupSubtotal(group.id)),
    }));

  // Map invoice schedule
  const invoiceSchedule: TemplateScheduleItem[] = Array.isArray(document.invoice_schedule)
    ? document.invoice_schedule.map((item: any, index: number) => ({
        schedule_number: String(item.schedule_number || index + 1),
        schedule_title: item.title || '',
        schedule_percentage: item.percentage ? formatPercentage(item.percentage) : '',
        schedule_amount_ht: formatCurrency(item.amount_ht),
        schedule_amount_ttc: formatCurrency(item.amount_ttc),
        schedule_date: formatDate(item.planned_date),
        schedule_milestone: item.milestone || '',
      }))
    : [];

  // Fee mode labels
  const feeModeLabels: Record<string, string> = {
    fixed: 'Forfait',
    percentage: 'Pourcentage',
    hourly: 'Régie',
    mixed: 'Mixte',
  };

  // Document type labels
  const docTypeLabels: Record<string, string> = {
    quote: 'Devis',
    contract: 'Contrat',
  };

  // Status labels
  const statusLabels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyé',
    accepted: 'Accepté',
    rejected: 'Refusé',
    expired: 'Expiré',
    signed: 'Signé',
  };

  return {
    // ===== DOCUMENT =====
    document_number: document.document_number || '',
    document_type: docTypeLabels[document.document_type || 'quote'] || 'Devis',
    document_title: document.title || '',
    document_description: document.description || '',
    document_status: statusLabels[document.status || 'draft'] || '',
    reference_client: document.reference_client || '',
    market_reference: document.market_reference || '',
    is_public_market: document.is_public_market ? 'Oui' : 'Non',
    is_amendment: document.is_amendment ? 'Oui' : 'Non',
    
    // ===== AGENCE =====
    agency_name: agencyInfo?.name || '',
    agency_address: agencyInfo?.address || '',
    agency_city: agencyInfo?.city || '',
    agency_postal_code: agencyInfo?.postal_code || '',
    agency_phone: agencyInfo?.phone || '',
    agency_email: agencyInfo?.email || '',
    agency_website: agencyInfo?.website || '',
    agency_logo_url: agencyInfo?.logo_url || '',
    agency_siret: agencyInfo?.siret || '',
    agency_siren: agencyInfo?.siren || '',
    agency_vat_number: agencyInfo?.vat_number || '',
    agency_capital: agencyInfo?.capital_social ? formatCurrency(agencyInfo.capital_social) : '',
    agency_legal_form: agencyInfo?.forme_juridique || '',
    agency_rcs_city: agencyInfo?.rcs_city || '',
    agency_naf_code: agencyInfo?.code_naf || '',
    
    // ===== CLIENT =====
    client_name: document.client_company?.name || '',
    client_logo_url: document.client_company?.logo_url || '',
    client_address: '', // Would need billing profile data
    client_city: '', // Would need billing profile data
    client_postal_code: '', // Would need billing profile data
    client_contact_name: document.client_contact?.name || '',
    client_contact_email: document.client_contact?.email || '',
    client_contact_role: '', // Would need contact data
    billing_contact_name: document.billing_contact?.name || '',
    billing_contact_email: document.billing_contact?.email || '',
    
    // ===== PROJET =====
    project_name: document.project?.name || document.title || '',
    project_type: document.project_type || '',
    project_address: document.project_address || '',
    project_city: document.project_city || '',
    project_postal_code: document.postal_code || '',
    project_surface: document.project_surface ? `${document.project_surface} m²` : '',
    project_budget: formatCurrency(document.project_budget),
    construction_budget: formatCurrency(document.construction_budget),
    construction_budget_disclosed: document.construction_budget_disclosed ? 'Oui' : 'Non',
    
    // ===== FINANCIER =====
    fee_mode: feeModeLabels[document.fee_mode || 'fixed'] || 'Forfait',
    fee_percentage: document.fee_percentage ? formatPercentage(document.fee_percentage) : '',
    hourly_rate: document.hourly_rate ? `${document.hourly_rate} €/h` : '',
    subtotal_ht: formatCurrency(subtotal),
    total_discount: formatCurrency(totalDiscount),
    total_ht: formatCurrency(totalHT),
    vat_rate: formatPercentage(vatRate),
    vat_type: document.vat_type || 'Standard',
    tva_amount: formatCurrency(tvaAmount),
    total_ttc: formatCurrency(totalTTC),
    requires_deposit: document.requires_deposit ? 'Oui' : 'Non',
    deposit_percentage: document.deposit_percentage ? formatPercentage(document.deposit_percentage) : '',
    deposit_amount: formatCurrency(depositAmount),
    currency: document.currency || 'EUR',
    
    // ===== CONDITIONS =====
    payment_terms: document.payment_terms || '',
    special_conditions: document.special_conditions || '',
    general_conditions: document.general_conditions || '',
    header_text: document.header_text || '',
    footer_text: document.footer_text || '',
    
    // ===== DATES =====
    date: formatDate(document.created_at) || formatDate(new Date().toISOString()),
    validity_days: String(document.validity_days || 30),
    validity_date: validityDate,
    expected_start_date: formatDate(document.expected_start_date),
    expected_end_date: formatDate(document.expected_end_date),
    expected_signature_date: formatDate(document.expected_signature_date),
    sent_at: formatDate(document.sent_at),
    accepted_at: formatDate(document.accepted_at),
    signed_at: formatDate(document.signed_at),
    
    // ===== META =====
    current_date: formatDate(new Date().toISOString()),
    current_year: String(new Date().getFullYear()),
    
    // ===== ARRAYS =====
    phases,
    options,
    discounts,
    groups: groupsData,
    invoice_schedule: invoiceSchedule,
  };
}

/**
 * Rendu d'un template HTML avec les variables
 */
export function renderHtmlTemplate(htmlTemplate: string, data: TemplateData): string {
  let rendered = htmlTemplate;
  
  // Remplacer les variables simples
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    }
  });
  
  // Traiter les tableaux (phases, options, discounts, groups, invoice_schedule)
  const arrayKeys = ['phases', 'options', 'discounts', 'groups', 'invoice_schedule'];
  
  arrayKeys.forEach(arrayKey => {
    const arrayData = data[arrayKey];
    if (!Array.isArray(arrayData)) return;
    
    const blockRegex = new RegExp(`\\{\\{#${arrayKey}\\}\\}([\\s\\S]*?)\\{\\{\\/${arrayKey}\\}\\}`, 'g');
    
    rendered = rendered.replace(blockRegex, (match, template) => {
      if (arrayData.length === 0) return '';
      
      return arrayData.map((item: any) => {
        let itemHtml = template;
        
        // Remplacer les variables de l'item
        Object.entries(item).forEach(([itemKey, itemValue]) => {
          if (typeof itemValue === 'string') {
            const itemRegex = new RegExp(`\\{\\{${itemKey}\\}\\}`, 'g');
            itemHtml = itemHtml.replace(itemRegex, itemValue);
          } else if (Array.isArray(itemValue) && itemKey === 'deliverables') {
            // Handle nested deliverables array
            const delivRegex = new RegExp(`\\{\\{#deliverables\\}\\}([\\s\\S]*?)\\{\\{\\/deliverables\\}\\}`, 'g');
            itemHtml = itemHtml.replace(delivRegex, (m, delTemplate) => {
              return (itemValue as any[]).map((del: any) => {
                let delHtml = delTemplate;
                Object.entries(del).forEach(([delKey, delVal]) => {
                  const delItemRegex = new RegExp(`\\{\\{${delKey}\\}\\}`, 'g');
                  delHtml = delHtml.replace(delItemRegex, String(delVal));
                });
                return delHtml;
              }).join('');
            });
          }
        });
        
        return itemHtml;
      }).join('');
    });
  });
  
  // Nettoyer les variables non remplacées (les remplacer par vide)
  rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');
  
  return rendered;
}

/**
 * Génère les données d'exemple pour l'éditeur HTML
 */
export function getSampleTemplateData(): TemplateData {
  return {
    // Document
    document_number: 'DEV-2025-001',
    document_type: 'Devis',
    document_title: 'Mission d\'architecture d\'intérieur',
    document_description: 'Rénovation complète appartement 120m²',
    document_status: 'Brouillon',
    reference_client: 'REF-CLIENT-123',
    market_reference: '',
    is_public_market: 'Non',
    is_amendment: 'Non',
    
    // Agency
    agency_name: 'Studio Architecture',
    agency_address: '123 Rue de l\'Exemple',
    agency_city: 'Paris',
    agency_postal_code: '75001',
    agency_phone: '01 23 45 67 89',
    agency_email: 'contact@studio-architecture.fr',
    agency_website: 'www.studio-architecture.fr',
    agency_logo_url: 'https://via.placeholder.com/200x80?text=LOGO',
    agency_siret: '123 456 789 00012',
    agency_siren: '123 456 789',
    agency_vat_number: 'FR12345678901',
    agency_capital: '10 000 €',
    agency_legal_form: 'SARL',
    agency_rcs_city: 'Paris',
    agency_naf_code: '7111Z',
    
    // Client
    client_name: 'Société Exemple SAS',
    client_logo_url: '',
    client_address: '456 Avenue du Client',
    client_city: 'Lyon',
    client_postal_code: '69001',
    client_contact_name: 'Jean Dupont',
    client_contact_email: 'jean.dupont@example.fr',
    client_contact_role: 'Directeur Général',
    billing_contact_name: 'Marie Martin',
    billing_contact_email: 'comptabilite@example.fr',
    
    // Project
    project_name: 'Résidence Les Jardins',
    project_type: 'Architecture d\'intérieur',
    project_address: '789 Boulevard du Projet',
    project_city: 'Bordeaux',
    project_postal_code: '33000',
    project_surface: '120 m²',
    project_budget: '150 000 €',
    construction_budget: '100 000 €',
    construction_budget_disclosed: 'Oui',
    
    // Financial
    fee_mode: 'Forfait',
    fee_percentage: '12%',
    hourly_rate: '85 €/h',
    subtotal_ht: '55 000 €',
    total_discount: '5 000 €',
    total_ht: '50 000 €',
    vat_rate: '20%',
    vat_type: 'Standard',
    tva_amount: '10 000 €',
    total_ttc: '60 000 €',
    requires_deposit: 'Oui',
    deposit_percentage: '30%',
    deposit_amount: '18 000 €',
    currency: 'EUR',
    
    // Conditions
    payment_terms: 'Paiement à 30 jours fin de mois par virement bancaire',
    special_conditions: 'Démarrage de la mission conditionné à l\'obtention du permis de construire',
    general_conditions: 'Les présentes conditions générales régissent les relations contractuelles...',
    header_text: 'Suite à notre entretien du 15 janvier 2025, nous avons le plaisir de vous transmettre notre proposition.',
    footer_text: 'Nous restons à votre disposition pour toute question.',
    
    // Dates
    date: '18 janvier 2025',
    validity_days: '30',
    validity_date: '18 février 2025',
    expected_start_date: '1 mars 2025',
    expected_end_date: '30 juin 2025',
    expected_signature_date: '25 janvier 2025',
    sent_at: '',
    accepted_at: '',
    signed_at: '',
    
    // Meta
    current_date: format(new Date(), 'd MMMM yyyy', { locale: fr }),
    current_year: String(new Date().getFullYear()),
    
    // Arrays
    phases: [
      {
        phase_code: 'ESQ',
        phase_name: 'Esquisse',
        phase_description: 'Études préliminaires et intentions de projet',
        phase_type: 'Phase',
        phase_quantity: '1',
        phase_unit: 'forfait',
        phase_unit_price: '5 000 €',
        phase_amount: '5 000 €',
        phase_percentage: '10%',
        phase_start_date: '1 mars 2025',
        phase_end_date: '15 mars 2025',
        phase_is_optional: 'Non',
        deliverables: [
          { deliverable_name: 'Plans d\'intention 1/100' },
          { deliverable_name: 'Planche d\'ambiance' },
        ],
      },
      {
        phase_code: 'APS',
        phase_name: 'Avant-Projet Sommaire',
        phase_description: 'Définition des grandes lignes du projet',
        phase_type: 'Phase',
        phase_quantity: '1',
        phase_unit: 'forfait',
        phase_unit_price: '10 000 €',
        phase_amount: '10 000 €',
        phase_percentage: '20%',
        phase_start_date: '16 mars 2025',
        phase_end_date: '15 avril 2025',
        phase_is_optional: 'Non',
        deliverables: [
          { deliverable_name: 'Plans 1/50' },
          { deliverable_name: 'Estimation budgétaire' },
        ],
      },
      {
        phase_code: 'APD',
        phase_name: 'Avant-Projet Définitif',
        phase_description: 'Validation finale du projet',
        phase_type: 'Phase',
        phase_quantity: '1',
        phase_unit: 'forfait',
        phase_unit_price: '15 000 €',
        phase_amount: '15 000 €',
        phase_percentage: '30%',
        phase_start_date: '16 avril 2025',
        phase_end_date: '15 mai 2025',
        phase_is_optional: 'Non',
        deliverables: [],
      },
      {
        phase_code: 'PRO',
        phase_name: 'Projet',
        phase_description: 'Dossier technique complet',
        phase_type: 'Phase',
        phase_quantity: '1',
        phase_unit: 'forfait',
        phase_unit_price: '10 000 €',
        phase_amount: '10 000 €',
        phase_percentage: '20%',
        phase_start_date: '16 mai 2025',
        phase_end_date: '30 mai 2025',
        phase_is_optional: 'Non',
        deliverables: [],
      },
      {
        phase_code: 'EXE',
        phase_name: 'Suivi d\'exécution',
        phase_description: 'Suivi de chantier',
        phase_type: 'Phase',
        phase_quantity: '1',
        phase_unit: 'forfait',
        phase_unit_price: '10 000 €',
        phase_amount: '10 000 €',
        phase_percentage: '20%',
        phase_start_date: '1 juin 2025',
        phase_end_date: '30 juin 2025',
        phase_is_optional: 'Non',
        deliverables: [],
      },
    ],
    options: [
      {
        option_code: 'OPT-1',
        option_name: 'Visites supplémentaires',
        option_description: '3 visites de chantier additionnelles',
        option_amount: '1 500 €',
      },
      {
        option_code: 'OPT-2',
        option_name: 'Modélisation 3D',
        option_description: 'Visite virtuelle du projet',
        option_amount: '3 000 €',
      },
    ],
    discounts: [
      {
        discount_name: 'Remise fidélité',
        discount_description: 'Remise accordée en tant que client fidèle',
        discount_amount: '-5 000 €',
        discount_percentage: '10%',
      },
    ],
    groups: [
      {
        group_name: 'Études préliminaires',
        group_subtotal: '15 000 €',
      },
      {
        group_name: 'Études de projet',
        group_subtotal: '25 000 €',
      },
    ],
    invoice_schedule: [
      {
        schedule_number: '1',
        schedule_title: 'Acompte à la commande',
        schedule_percentage: '30%',
        schedule_amount_ht: '15 000 €',
        schedule_amount_ttc: '18 000 €',
        schedule_date: '25 janvier 2025',
        schedule_milestone: 'Signature du contrat',
      },
      {
        schedule_number: '2',
        schedule_title: 'Validation APS',
        schedule_percentage: '30%',
        schedule_amount_ht: '15 000 €',
        schedule_amount_ttc: '18 000 €',
        schedule_date: '15 avril 2025',
        schedule_milestone: 'Validation de l\'APS',
      },
      {
        schedule_number: '3',
        schedule_title: 'Solde',
        schedule_percentage: '40%',
        schedule_amount_ht: '20 000 €',
        schedule_amount_ttc: '24 000 €',
        schedule_date: '30 juin 2025',
        schedule_milestone: 'Livraison du projet',
      },
    ],
  };
}

/**
 * Génère la documentation des variables pour l'éditeur
 */
export function getVariablesDocumentation(): string {
  let doc = '# Variables disponibles pour les templates HTML\n\n';
  
  // Group by category
  const categories: Record<string, TemplateVariableDefinition[]> = {};
  TEMPLATE_VARIABLES.forEach(v => {
    if (!categories[v.category]) categories[v.category] = [];
    categories[v.category].push(v);
  });
  
  const categoryLabels: Record<string, string> = {
    agency: 'Agence',
    client: 'Client',
    project: 'Projet',
    document: 'Document',
    financial: 'Financier',
    conditions: 'Conditions',
    dates: 'Dates',
    meta: 'Méta',
  };
  
  Object.entries(categories).forEach(([cat, vars]) => {
    doc += `## ${categoryLabels[cat] || cat}\n\n`;
    vars.forEach(v => {
      doc += `- \`{{${v.key}}}\` - ${v.label}\n`;
    });
    doc += '\n';
  });
  
  doc += '## Boucles (tableaux)\n\n';
  TEMPLATE_ARRAYS.forEach(arr => {
    doc += `### {{#${arr.key}}}...{{/${arr.key}}}\n`;
    doc += `${arr.description}\n\n`;
    doc += 'Variables internes:\n';
    arr.innerVariables.forEach(v => {
      doc += `- \`{{${v.key}}}\` - ${v.label}\n`;
    });
    doc += '\n';
  });
  
  return doc;
}
