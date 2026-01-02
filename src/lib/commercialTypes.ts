// Types for Commercial Module

export type DocumentType = 'quote' | 'contract' | 'proposal';
export type ProjectType = 'interior' | 'architecture' | 'scenography';
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'signed';
export type FeeMode = 'fixed' | 'percentage' | 'hourly' | 'mixed';
export type ItemType = 'mission' | 'option' | 'expense' | 'discount';

export interface PhaseTemplate {
  code: string;
  name: string;
  description: string;
  defaultPercentage: number;
  deliverables: string[];
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
  project_type: ProjectType;
  project_address?: string;
  project_city?: string;
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
  project?: { id: string; name: string };
  phases?: CommercialDocumentPhase[];
  items?: CommercialDocumentItem[];
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

// Phase templates by project type
export const ARCHITECTURE_PHASES: PhaseTemplate[] = [
  {
    code: 'ESQ',
    name: 'Esquisse',
    description: 'Études préliminaires et esquisse du projet',
    defaultPercentage: 10,
    deliverables: ['Plans d\'esquisse', 'Volumétrie 3D', 'Estimation budgétaire préliminaire', 'Note d\'intention']
  },
  {
    code: 'APS',
    name: 'Avant-Projet Sommaire',
    description: 'Définition des principales caractéristiques du projet',
    defaultPercentage: 9,
    deliverables: ['Plans APS (1/200)', 'Coupes et façades', 'Notice descriptive', 'Estimation détaillée']
  },
  {
    code: 'APD',
    name: 'Avant-Projet Définitif',
    description: 'Conception détaillée du projet',
    defaultPercentage: 15,
    deliverables: ['Plans APD (1/100)', 'Coupes et façades détaillées', 'Perspectives', 'CCTP sommaire', 'Estimation définitive']
  },
  {
    code: 'PC',
    name: 'Permis de Construire',
    description: 'Constitution et dépôt du dossier de permis de construire',
    defaultPercentage: 6,
    deliverables: ['Dossier PC complet', 'Plans réglementaires', 'Notice PC', 'Insertion paysagère']
  },
  {
    code: 'PRO',
    name: 'Projet',
    description: 'Études de projet détaillées',
    defaultPercentage: 18,
    deliverables: ['Plans PRO (1/50)', 'Détails techniques', 'CCTP détaillé', 'Carnets de détails']
  },
  {
    code: 'DCE',
    name: 'Dossier de Consultation',
    description: 'Préparation des documents de consultation des entreprises',
    defaultPercentage: 7,
    deliverables: ['DCE complet', 'Quantitatif', 'Planning prévisionnel', 'RC et CCAP']
  },
  {
    code: 'ACT',
    name: 'Assistance Marchés',
    description: 'Analyse des offres et assistance à la passation des marchés',
    defaultPercentage: 5,
    deliverables: ['Analyse des offres', 'Rapport d\'analyse', 'Mise au point des marchés']
  },
  {
    code: 'VISA',
    name: 'Visa',
    description: 'Examen et visa des études d\'exécution',
    defaultPercentage: 5,
    deliverables: ['Visa des plans EXE', 'Validation des échantillons', 'Notes de calcul']
  },
  {
    code: 'DET',
    name: 'Direction des Travaux',
    description: 'Direction et coordination des travaux',
    defaultPercentage: 20,
    deliverables: ['Comptes-rendus de chantier', 'OPR', 'Suivi financier', 'Gestion des avenants']
  },
  {
    code: 'AOR',
    name: 'Réception',
    description: 'Assistance aux opérations de réception',
    defaultPercentage: 5,
    deliverables: ['PV de réception', 'Levée des réserves', 'DOE', 'DIUO']
  }
];

export const INTERIOR_PHASES: PhaseTemplate[] = [
  {
    code: 'BRIEF',
    name: 'Brief & Programme',
    description: 'Analyse des besoins et définition du programme',
    defaultPercentage: 5,
    deliverables: ['Analyse de l\'existant', 'Programme fonctionnel', 'Moodboard', 'Budget prévisionnel']
  },
  {
    code: 'ESQ',
    name: 'Esquisse',
    description: 'Premières propositions d\'aménagement',
    defaultPercentage: 15,
    deliverables: ['Plans d\'aménagement', 'Planche d\'ambiance', 'Croquis perspectives', 'Estimation budgétaire']
  },
  {
    code: 'APS',
    name: 'Avant-Projet Sommaire',
    description: 'Développement du concept retenu',
    defaultPercentage: 15,
    deliverables: ['Plans APS (1/50)', 'Élévations murales', 'Palette matériaux', 'Budget affiné']
  },
  {
    code: 'APD',
    name: 'Avant-Projet Définitif',
    description: 'Définition complète du projet',
    defaultPercentage: 20,
    deliverables: ['Plans APD (1/20)', 'Coupes techniques', 'Perspectives 3D', 'Carnet de finitions']
  },
  {
    code: 'PRO',
    name: 'Projet d\'Exécution',
    description: 'Plans d\'exécution détaillés',
    defaultPercentage: 20,
    deliverables: ['Plans techniques détaillés', 'Détails menuiserie', 'Plans électriques', 'Descriptif quantitatif']
  },
  {
    code: 'CONSULT',
    name: 'Consultation',
    description: 'Consultation et sélection des entreprises',
    defaultPercentage: 5,
    deliverables: ['Dossier de consultation', 'Analyse des devis', 'Tableaux comparatifs', 'Planning travaux']
  },
  {
    code: 'CHANTIER',
    name: 'Suivi de Chantier',
    description: 'Direction et suivi des travaux',
    defaultPercentage: 15,
    deliverables: ['Comptes-rendus de chantier', 'Suivi des commandes', 'Coordination artisans', 'Gestion du planning']
  },
  {
    code: 'RECEP',
    name: 'Réception',
    description: 'Réception des travaux et livraison',
    defaultPercentage: 5,
    deliverables: ['PV de réception', 'Levée des réserves', 'Livraison client', 'Dossier des ouvrages exécutés']
  }
];

export const SCENOGRAPHY_PHASES: PhaseTemplate[] = [
  {
    code: 'CONCEPT',
    name: 'Conception',
    description: 'Développement du concept scénographique',
    defaultPercentage: 15,
    deliverables: ['Note d\'intention', 'Recherches iconographiques', 'Parcours visiteur', 'Scénario muséographique']
  },
  {
    code: 'SCENARIO',
    name: 'Scénario Détaillé',
    description: 'Écriture du scénario et séquençage',
    defaultPercentage: 15,
    deliverables: ['Scénario détaillé', 'Storyboard', 'Contenus par séquence', 'Brief multimédia']
  },
  {
    code: 'DESIGN',
    name: 'Design Scénographique',
    description: 'Conception graphique et spatiale',
    defaultPercentage: 25,
    deliverables: ['Plans scénographiques', 'Élévations', 'Perspectives 3D', 'Design graphique', 'Palette matériaux']
  },
  {
    code: 'TECH',
    name: 'Études Techniques',
    description: 'Plans techniques et dossiers de fabrication',
    defaultPercentage: 15,
    deliverables: ['Plans techniques', 'Dossiers de fabrication', 'Spécifications techniques', 'CCTP']
  },
  {
    code: 'PROD',
    name: 'Suivi de Production',
    description: 'Suivi de la fabrication des éléments',
    defaultPercentage: 10,
    deliverables: ['Validation prototypes', 'Suivi fabrication', 'Contrôle qualité', 'Réception usine']
  },
  {
    code: 'MONTAGE',
    name: 'Montage',
    description: 'Installation sur site',
    defaultPercentage: 15,
    deliverables: ['Coordination montage', 'Suivi installation', 'Réglages', 'Tests multimédia']
  },
  {
    code: 'INAUG',
    name: 'Inauguration',
    description: 'Finalisation et inauguration',
    defaultPercentage: 5,
    deliverables: ['Réception finale', 'Formation exploitants', 'Documentation technique', 'Accompagnement inauguration']
  }
];

export const PHASES_BY_PROJECT_TYPE: Record<ProjectType, PhaseTemplate[]> = {
  architecture: ARCHITECTURE_PHASES,
  interior: INTERIOR_PHASES,
  scenography: SCENOGRAPHY_PHASES
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  quote: 'Devis',
  contract: 'Contrat',
  proposal: 'Proposition'
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
