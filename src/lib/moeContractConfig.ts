// Configuration pour le Contrat de Maîtrise d'Œuvre (MOE) Architecture
// Basé sur les standards de l'Ordre des Architectes

// ============= Types =============

export interface MOEContractant {
  type: 'moa' | 'moe';
  name: string;
  company_name?: string;
  legal_form?: string; // SAS, SARL, etc.
  rcs?: string;
  representative_name?: string;
  representative_title?: string;
  address: string;
  postal_code?: string;
  city?: string;
  phone?: string;
  email?: string;
  ordre_number?: string; // Pour architecte (ex: S25457)
}

export interface MOEProjectInfo {
  name: string;
  address: string;
  city?: string;
  postal_code?: string;
  existing_surface?: number;
  project_surface?: number;
  project_type: 'renovation' | 'construction' | 'extension' | 'restructuration';
  constraints?: string;
  requirements?: string;
  budget_global?: number;
  budget_travaux?: number;
  additional_notes?: string;
}

export interface MOEMissionPhase {
  code: string;
  name: string;
  short_name: string;
  description: string;
  percentage: number;
  is_included: boolean;
  deliverables: string[];
  is_optional?: boolean;
}

export interface MOEHonoraireItem {
  name: string;
  quantity: number;
  amount_ht: number;
  tva_rate: number;
  is_offered: boolean;
  is_optional: boolean;
}

export interface MOEPaymentSchedule {
  stage: string;
  phase_code?: string;
  percentage: number;
  description?: string;
}

export interface MOEContractData {
  reference: string;
  date: string;
  moa: MOEContractant;
  moe: MOEContractant;
  project: MOEProjectInfo;
  mission_phases: MOEMissionPhase[];
  honoraires: MOEHonoraireItem[];
  total_ht: number;
  tva_rate: number;
  tva_amount: number;
  total_ttc: number;
  fee_calculation_method: 'forfait' | 'percentage' | 'hourly';
  payment_schedule: MOEPaymentSchedule[];
  clauses: Record<string, string>;
  insurance_company?: string;
  insurance_policy_number?: string;
}

// ============= Default Mission Phases (Loi MOP) =============

export const DEFAULT_MOE_MISSION_PHASES: MOEMissionPhase[] = [
  {
    code: 'REL',
    name: 'Relevé de l\'existant',
    short_name: 'REL',
    description: 'Relevé détaillé de l\'existant et établissement des plans',
    percentage: 0,
    is_included: false,
    is_optional: true,
    deliverables: ['Plans de l\'existant', 'Diagnostic technique']
  },
  {
    code: 'ESQ',
    name: 'Esquisse',
    short_name: 'ESQ',
    description: 'Proposition initiale de projet à partir du programme',
    percentage: 15,
    is_included: true,
    deliverables: ['Esquisses préliminaires', 'Note d\'intention', 'Estimation budgétaire indicative']
  },
  {
    code: 'AVP',
    name: 'Avant-Projet',
    short_name: 'AVP',
    description: 'Développement de l\'esquisse retenue avec précisions techniques',
    percentage: 15,
    is_included: true,
    deliverables: ['Plans AVP', 'Coupes et élévations', 'Descriptif sommaire', 'Estimation détaillée']
  },
  {
    code: 'PRO',
    name: 'Projet',
    short_name: 'PRO',
    description: 'Définition précise du projet avec tous les détails nécessaires',
    percentage: 20,
    is_included: true,
    deliverables: ['Plans définitifs', 'Détails techniques', 'Descriptif complet', 'Estimation précise']
  },
  {
    code: 'DCE',
    name: 'Dossier de Consultation des Entreprises',
    short_name: 'DCE',
    description: 'Production des plans et documents à l\'intention des entreprises',
    percentage: 10,
    is_included: true,
    deliverables: ['Plans d\'exécution', 'CCTP', 'Quantitatif détaillé', 'Planning prévisionnel']
  },
  {
    code: 'ACT',
    name: 'Assistance pour la passation des Contrats de Travaux',
    short_name: 'ACT',
    description: 'Consultation des entreprises et analyse des devis',
    percentage: 5,
    is_included: true,
    deliverables: ['Analyse comparative des offres', 'Rapport d\'analyse', 'Recommandations']
  },
  {
    code: 'DET',
    name: 'Direction de l\'Exécution des Travaux',
    short_name: 'DET',
    description: 'Réunions de chantier hebdomadaires et suivi de l\'exécution',
    percentage: 25,
    is_included: true,
    deliverables: ['Comptes-rendus de chantier', 'Ordres de service', 'Visa des situations', 'Suivi financier']
  },
  {
    code: 'AOR',
    name: 'Assistance aux Opérations de Réception',
    short_name: 'AOR',
    description: 'Organisation et participation à la réception des travaux',
    percentage: 5,
    is_included: true,
    deliverables: ['PV de réception', 'Liste des réserves', 'DOE', 'Levée des réserves']
  },
  {
    code: 'DECO',
    name: 'Décoration - Accessoirisation',
    short_name: 'DECO',
    description: 'Définition des choix d\'équipement mobiliers et appareillage',
    percentage: 0,
    is_included: false,
    is_optional: true,
    deliverables: ['Planches d\'ambiance', 'Sélection mobilier', 'Shopping list']
  }
];

// ============= Default Payment Schedule =============

export const DEFAULT_MOE_PAYMENT_SCHEDULE: MOEPaymentSchedule[] = [
  { stage: 'Signature du contrat', phase_code: 'ACOMPTE', percentage: 30, description: 'Acompte prévisionnel' },
  { stage: 'Validation AVP', phase_code: 'AVP', percentage: 10 },
  { stage: 'Validation PRO/DCE', phase_code: 'PRO', percentage: 20 },
  { stage: 'Phase ACT', phase_code: 'ACT', percentage: 5 },
  { stage: 'Phase DET', phase_code: 'DET', percentage: 30 },
  { stage: 'Fin AOR', phase_code: 'AOR', percentage: 5, description: 'Solde avec réajustement selon montant définitif des travaux' }
];

// ============= Default Clauses =============

export const DEFAULT_MOE_CLAUSES = {
  responsabilite: `L'Architecte est responsable de ses prestations dans le cadre de ses missions définies au contrat. Il est couvert par une assurance responsabilité civile professionnelle et décennale. Cependant, sa responsabilité est exclue pour les éléments non liés à ses prestations ou en cas d'ingérence de tiers non sous sa supervision directe.`,

  references_tiers: `L'Architecte s'engage à proposer des solutions conformes aux réglementations en vigueur, notamment en matière d'urbanisme, de sécurité, et de performance énergétique. Pour les études ou prestations spécifiques non incluses dans ses compétences (structure, fluides, thermique, acoustique, essais de sol, etc.), les interventions seront effectuées par des bureaux d'études dûment qualifiés, choisis avec l'accord du Maître d'ouvrage et à sa charge.`,

  limitation_responsabilite: `L'Architecte ne pourra être tenu responsable des conséquences :
- D'un état de l'existant non conforme ou vicié (diagnostics non fournis ou incorrects par le Maître d'ouvrage, incluant la présence d'amiante, de plomb ou de défauts structurels)
- D'imprévus techniques ou réglementaires indépendants de sa mission
- En cas de non-paiement des honoraires ou d'annulation unilatérale`,

  modification_avenant: `Toute demande du Maître d'ouvrage modifiant l'étendue, le contenu ou les délais de la mission fera l'objet d'un avenant au contrat, entraînant une révision des honoraires et des délais, en proportion des modifications.`,

  obligations_moe: `Le client déclare avoir été informé par l'architecte des obligations en matière de sous-traitance, en application de la loi n° 75-1334 du 31 décembre 1975.`,

  obligations_moa: `Le Maître d'ouvrage s'engage à fournir dans les délais les informations et diagnostics nécessaires (plans de l'existant, diagnostics amiante/plomb, règlement de copropriété, autorisations administratives, etc.). En cas de carence, les dommages et surcoûts seront à sa charge exclusive. L'Architecte conseille au Maître d'ouvrage de souscrire une assurance dommages-ouvrage.`,

  imprevus: `Les conditions inhérentes aux travaux dans l'existant (réseaux cachés, infrastructures détériorées, etc.) peuvent entraîner des ajustements des coûts ou des délais. L'Architecte sera dégagé de toute responsabilité tant qu'un avenant n'est pas signé pour acter ces ajustements.`,

  suspension: `En cas de non-paiement des honoraires ou de non-respect des obligations du Maître d'ouvrage, l'Architecte se réserve le droit de suspendre ses prestations après une mise en demeure restée sans réponse.`,

  resiliation: `La résiliation peut intervenir à l'initiative de l'architecte pour des motifs tels que : perte de confiance manifestée par le maître d'ouvrage, impossibilité de respecter les règles de l'art, déontologiques, légales ou réglementaires, choix imposé d'une entreprise ne présentant pas les garanties indispensables, non-respect d'une ou plusieurs clauses du contrat. La résiliation donne droit au paiement des honoraires liquidés au jour de la résiliation et, si justifiée par le comportement fautif du maître d'ouvrage, d'une indemnité égale à 20% des honoraires restants.`,

  litiges: `En cas de différend relatif à l'exécution du présent contrat, les parties s'engagent à recourir, avant toute procédure judiciaire ou arbitrale, à une tentative de conciliation organisée par le Conseil régional de l'Ordre des architectes territorialement compétent, conformément à l'article 26 du Code de déontologie des architectes. À défaut de résolution du litige par cette voie, les parties pourront saisir les juridictions compétentes.`,

  delais_validation: `La maîtrise d'œuvre ne pourra être tenue responsable que de ses propres temps d'élaboration et de rendu des dossiers qui lui incombent. La validation de principe écrite du maître d'ouvrage conditionne l'engagement de la phase suivante.`,

  honoraires_nota: `Minima de facturation (mission partielle ou mission complète) : 4000 euros HT. Les temps et les frais de transport hors zone de résidence s'ajoutent aux montants des honoraires.`,

  reunion_supplementaire: `Réunions supplémentaires facturées au tarif de 250 € HT par réunion.`
};

// ============= Project Types =============

export const MOE_PROJECT_TYPES = {
  renovation: 'Rénovation',
  construction: 'Construction neuve',
  extension: 'Extension',
  restructuration: 'Restructuration'
};

// ============= Fee Calculation Methods =============

export const MOE_FEE_METHODS = {
  forfait: 'Au forfait',
  percentage: 'Au pourcentage du montant des travaux',
  hourly: 'En régie (taux horaire)'
};

// ============= Helper Functions =============

export function calculateMOETotals(phases: MOEMissionPhase[], baseAmount: number): {
  total_ht: number;
  tva_amount: number;
  total_ttc: number;
} {
  const includedPhases = phases.filter(p => p.is_included);
  const total_ht = baseAmount;
  const tva_amount = total_ht * 0.2;
  const total_ttc = total_ht + tva_amount;
  
  return { total_ht, tva_amount, total_ttc };
}

export function getPhasesByPercentage(
  phases: MOEMissionPhase[],
  total_ht: number
): Array<MOEMissionPhase & { calculated_amount: number }> {
  return phases.map(phase => ({
    ...phase,
    calculated_amount: (phase.percentage / 100) * total_ht
  }));
}

export function formatMOEReference(date: Date, clientName: string): string {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const initials = clientName
    .split(' ')
    .map(word => word[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 3);
  
  return `${year}${month}${day}_${initials}`;
}
