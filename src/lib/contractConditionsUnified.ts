// Unified Contract Conditions System
// Provides a single interface for managing conditions across all contract types

import { DEFAULT_MOE_CLAUSES, DEFAULT_MOE_PAYMENT_SCHEDULE } from './moeContractConfig';
import { DEFAULT_COMMUNICATION_CLAUSES, DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE } from './communicationContractDefaults';
import { isArchitectureContractType } from './moeContractDefaults';
import { isCommunicationContractType } from './communicationContractDefaults';

// ============= Types =============

export interface UnifiedPaymentScheduleItem {
  id?: string;
  stage: string;
  description: string;
  percentage: number;
  phase_code?: string;
}

export interface UnifiedContractConditions {
  template: string; // 'moe_architecture' | 'communication' | 'generic'
  version: number;
  payment_schedule: UnifiedPaymentScheduleItem[];
  clauses: Record<string, string>;
  settings: {
    minimum_fee?: number;
    daily_rate?: number;
    extra_meeting_rate?: number;
    validity_days?: number;
    insurance_company?: string;
    insurance_policy_number?: string;
    [key: string]: unknown;
  };
}

// ============= Clause Labels =============

export interface ClauseLabel {
  label: string;
  description: string;
}

// Universal clause labels applicable to all contract types
export const UNIVERSAL_CLAUSE_LABELS: Record<string, ClauseLabel> = {
  objet: { label: 'Objet du contrat', description: 'Définition de la mission' },
  mission: { label: 'Contenu de la mission', description: 'Détail des prestations' },
  honoraires: { label: 'Honoraires', description: 'Modalités de rémunération' },
  paiement: { label: 'Modalités de paiement', description: 'Échéances et conditions de règlement' },
  delais: { label: 'Délais', description: 'Planning et engagement de délais' },
  responsabilite: { label: 'Responsabilité', description: 'Limites de responsabilité' },
  assurance: { label: 'Assurances', description: 'Couverture et garanties' },
  propriete_intellectuelle: { label: 'Propriété intellectuelle', description: 'Droits sur les créations' },
  cession_droits: { label: 'Cession de droits', description: 'Transfert des droits d\'utilisation' },
  confidentialite: { label: 'Confidentialité', description: 'Protection des informations' },
  resiliation: { label: 'Résiliation', description: 'Conditions de fin de contrat' },
  litiges: { label: 'Litiges', description: 'Règlement des différends' },
  rgpd: { label: 'RGPD', description: 'Protection des données personnelles' },
  // Architecture-specific
  obligations_client: { label: 'Obligations du maître d\'ouvrage', description: 'Responsabilités du client' },
  obligations_architecte: { label: 'Obligations de l\'architecte', description: 'Engagement professionnel' },
  sous_traitance: { label: 'Sous-traitance', description: 'Recours à des tiers' },
  execution_travaux: { label: 'Suivi de chantier', description: 'Direction de l\'exécution' },
  reception: { label: 'Réception', description: 'Conditions de livraison et réception' },
  // Communication-specific
  validation: { label: 'Validation', description: 'Processus d\'approbation' },
  modifications: { label: 'Modifications', description: 'Gestion des changements' },
  references: { label: 'Références', description: 'Utilisation en portfolio' },
  // Generic
  special_conditions: { label: 'Conditions particulières', description: 'Conditions spécifiques à ce contrat' },
  general_conditions: { label: 'Conditions générales', description: 'CGV standard' }
};

// ============= Default Configurations by Type =============

export function getDefaultGenericConditions(): UnifiedContractConditions {
  return {
    template: 'generic',
    version: 1,
    payment_schedule: [
      { stage: 'Acompte à la commande', description: 'Versement initial', percentage: 30 },
      { stage: 'Étape intermédiaire', description: 'Mi-parcours', percentage: 40 },
      { stage: 'Livraison finale', description: 'Solde', percentage: 30 }
    ],
    clauses: {
      objet: 'Le présent contrat a pour objet de définir les conditions de réalisation des prestations décrites dans le devis annexé.',
      delais: 'Les délais sont indicatifs et peuvent être adaptés en fonction de l\'avancement du projet et des validations du client.',
      paiement: 'Les factures sont payables à 30 jours date de facture. Tout retard de paiement entraîne l\'application de pénalités de retard.',
      responsabilite: 'La responsabilité du prestataire est limitée au montant des honoraires perçus pour la mission concernée.',
      resiliation: 'Chaque partie peut résilier le contrat moyennant un préavis de 30 jours. Les prestations réalisées restent dues.',
      litiges: 'En cas de litige, les parties s\'engagent à rechercher une solution amiable avant toute action judiciaire.'
    },
    settings: {
      validity_days: 30
    }
  };
}

export function getDefaultArchitectureConditions(): UnifiedContractConditions {
  return {
    template: 'moe_architecture',
    version: 1,
    payment_schedule: DEFAULT_MOE_PAYMENT_SCHEDULE.map(p => ({
      stage: p.stage,
      description: p.description,
      percentage: p.percentage,
      phase_code: p.phase_code
    })),
    clauses: DEFAULT_MOE_CLAUSES,
    settings: {
      minimum_fee: 4000,
      extra_meeting_rate: 250,
      validity_days: 30,
      insurance_company: '',
      insurance_policy_number: ''
    }
  };
}

export function getDefaultCommunicationConditions(): UnifiedContractConditions {
  return {
    template: 'communication',
    version: 1,
    payment_schedule: DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE.map(p => ({
      stage: p.stage,
      description: p.description || '',
      percentage: p.percentage,
      phase_code: p.phase_code
    })),
    clauses: DEFAULT_COMMUNICATION_CLAUSES,
    settings: {
      daily_rate: 800,
      minimum_fee: 5000,
      validity_days: 30
    }
  };
}

// ============= Main Helper Functions =============

/**
 * Get default conditions based on contract type code
 */
export function getDefaultConditionsForType(code: string | undefined): UnifiedContractConditions {
  if (!code) return getDefaultGenericConditions();
  
  if (isArchitectureContractType(code)) {
    return getDefaultArchitectureConditions();
  }
  
  if (isCommunicationContractType(code)) {
    return getDefaultCommunicationConditions();
  }
  
  return getDefaultGenericConditions();
}

/**
 * Parse conditions from document's general_conditions JSON
 */
export function parseConditionsFromDocument(generalConditions: string | null): UnifiedContractConditions | null {
  if (!generalConditions) return null;
  
  try {
    const parsed = JSON.parse(generalConditions);
    
    // Normalize to unified format
    return {
      template: parsed.template || 'generic',
      version: parsed.version || 1,
      payment_schedule: (parsed.payment_schedule || []).map((p: Record<string, unknown>) => ({
        id: p.id as string | undefined,
        stage: p.stage as string || '',
        description: p.description as string || '',
        percentage: typeof p.percentage === 'number' ? p.percentage : 0,
        phase_code: p.phase_code as string | undefined
      })),
      clauses: parsed.clauses || {},
      settings: parsed.settings || {}
    };
  } catch {
    return null;
  }
}

/**
 * Get the appropriate clause labels for a contract type
 */
export function getClauseLabelsForType(code: string | undefined): Record<string, ClauseLabel> {
  // Return all universal labels - the component will filter based on what's in the config
  return UNIVERSAL_CLAUSE_LABELS;
}

/**
 * Get label for a specific clause key
 */
export function getClauseLabel(key: string): ClauseLabel {
  return UNIVERSAL_CLAUSE_LABELS[key] || {
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
    description: ''
  };
}

/**
 * Merge existing conditions with defaults, preserving user customizations
 */
export function mergeWithDefaults(
  existing: Partial<UnifiedContractConditions> | null,
  defaults: UnifiedContractConditions
): UnifiedContractConditions {
  if (!existing) return defaults;
  
  return {
    template: existing.template || defaults.template,
    version: existing.version || defaults.version,
    payment_schedule: existing.payment_schedule?.length 
      ? existing.payment_schedule as UnifiedPaymentScheduleItem[]
      : defaults.payment_schedule,
    clauses: {
      ...defaults.clauses,
      ...(existing.clauses || {})
    },
    settings: {
      ...defaults.settings,
      ...(existing.settings || {})
    }
  };
}

/**
 * Serialize conditions to JSON for storage
 */
export function serializeConditions(conditions: UnifiedContractConditions): string {
  return JSON.stringify(conditions);
}

/**
 * Get template display name
 */
export function getTemplateDisplayName(template: string): string {
  switch (template) {
    case 'moe_architecture':
    case 'moe_architecture_contract':
      return 'Architecture / MOE';
    case 'communication':
    case 'communication_contract':
      return 'Communication';
    default:
      return 'Générique';
  }
}
