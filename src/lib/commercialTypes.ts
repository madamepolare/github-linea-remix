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

// Phase templates by project type
// ============= ARCHITECTURE PHASES (Loi MOP) =============

// Phases de base de la mission de maîtrise d'œuvre
export const ARCHITECTURE_BASE_PHASES: PhaseTemplate[] = [
  {
    code: 'DIAG',
    name: 'Diagnostic',
    description: 'Études de diagnostic préalable (existant, faisabilité)',
    defaultPercentage: 3,
    deliverables: ['Relevé de l\'existant', 'Diagnostic structurel', 'Diagnostic réglementaire', 'Note de synthèse'],
    category: 'base'
  },
  {
    code: 'ESQ',
    name: 'Esquisse',
    description: 'Études préliminaires et esquisse du projet',
    defaultPercentage: 8,
    deliverables: ['Plans d\'esquisse', 'Volumétrie 3D', 'Estimation budgétaire préliminaire', 'Note d\'intention'],
    category: 'base'
  },
  {
    code: 'APS',
    name: 'Avant-Projet Sommaire',
    description: 'Définition des principales caractéristiques du projet',
    defaultPercentage: 9,
    deliverables: ['Plans APS (1/200)', 'Coupes et façades', 'Notice descriptive sommaire', 'Estimation détaillée par lots'],
    category: 'base'
  },
  {
    code: 'APD',
    name: 'Avant-Projet Définitif',
    description: 'Conception détaillée du projet arrêtant les choix définitifs',
    defaultPercentage: 12,
    deliverables: ['Plans APD (1/100)', 'Coupes et façades détaillées', 'Perspectives', 'Notice descriptive détaillée', 'Estimation définitive'],
    category: 'base'
  },
  {
    code: 'PC',
    name: 'Permis de Construire',
    description: 'Constitution et dépôt du dossier de permis de construire',
    defaultPercentage: 5,
    deliverables: ['Dossier PC complet (PCMI 1-8)', 'Plans réglementaires', 'Notice de sécurité', 'Insertion paysagère'],
    category: 'base'
  },
  {
    code: 'PRO',
    name: 'Études de Projet',
    description: 'Études de projet permettant de définir l\'ensemble des travaux',
    defaultPercentage: 15,
    deliverables: ['Plans PRO (1/50)', 'Détails techniques', 'CCTP par lots', 'Carnets de détails', 'Coupe sur locaux types'],
    category: 'base'
  },
  {
    code: 'DCE',
    name: 'Dossier de Consultation des Entreprises',
    description: 'Préparation des documents de consultation des entreprises',
    defaultPercentage: 6,
    deliverables: ['DCE complet', 'DPGF / Quantitatif estimatif', 'Planning prévisionnel TCE', 'RC et CCAP', 'Acte d\'engagement'],
    category: 'base'
  },
  {
    code: 'ACT',
    name: 'Assistance pour la passation des Contrats de Travaux',
    description: 'Analyse des offres et assistance à la passation des marchés',
    defaultPercentage: 4,
    deliverables: ['Analyse comparative des offres', 'Rapport d\'analyse', 'Mise au point des marchés', 'Procès-verbal d\'attribution'],
    category: 'base'
  },
  {
    code: 'EXE',
    name: 'Études d\'Exécution',
    description: 'Établissement des plans d\'exécution et de synthèse',
    defaultPercentage: 8,
    deliverables: ['Plans d\'exécution', 'Plans de synthèse', 'Notes de calcul', 'Plans de réservations'],
    category: 'base'
  },
  {
    code: 'VISA',
    name: 'Visa des études d\'exécution',
    description: 'Examen et visa des études d\'exécution réalisées par les entreprises',
    defaultPercentage: 5,
    deliverables: ['Visa des plans EXE entreprises', 'Validation des échantillons', 'Vérification des notes de calcul', 'Fiches de visa'],
    category: 'base'
  },
  {
    code: 'DET',
    name: 'Direction de l\'Exécution des Travaux',
    description: 'Direction et coordination de l\'exécution des travaux',
    defaultPercentage: 18,
    deliverables: ['Comptes-rendus de chantier hebdomadaires', 'Ordres de service', 'Suivi financier', 'Gestion des avenants', 'Contrôle de conformité'],
    category: 'base'
  },
  {
    code: 'AOR',
    name: 'Assistance aux Opérations de Réception',
    description: 'Organisation et suivi des opérations de réception',
    defaultPercentage: 4,
    deliverables: ['OPR', 'PV de réception', 'Levée des réserves', 'DOE', 'DIUO', 'DGD'],
    category: 'base'
  }
];

// Missions complémentaires
export const ARCHITECTURE_COMPLEMENTARY_PHASES: PhaseTemplate[] = [
  {
    code: 'OPC',
    name: 'Ordonnancement, Pilotage et Coordination',
    description: 'Coordination générale du chantier et des intervenants',
    defaultPercentage: 3,
    deliverables: ['Planning général TCE', 'Planning détaillé 3 semaines', 'Coordination interentreprises', 'Suivi d\'avancement', 'Compte-rendu OPC'],
    category: 'complementary'
  },
  {
    code: 'SSI',
    name: 'Coordination SSI',
    description: 'Coordination du Système de Sécurité Incendie',
    defaultPercentage: 1,
    deliverables: ['Analyse SSI', 'Coordination détection/désenfumage', 'Essais fonctionnels', 'Procès-verbal de réception SSI'],
    category: 'complementary'
  },
  {
    code: 'SYN',
    name: 'Synthèse',
    description: 'Mission de synthèse technique tous corps d\'état',
    defaultPercentage: 2,
    deliverables: ['Plans de synthèse', 'Détection des conflits', 'Réunions de synthèse', 'Maquette BIM de synthèse'],
    category: 'complementary'
  },
  {
    code: 'BIM',
    name: 'Mission BIM',
    description: 'Gestion et coordination BIM du projet',
    defaultPercentage: 3,
    deliverables: ['Convention BIM', 'Maquette numérique', 'Coordination BIM', 'DOE numérique'],
    category: 'complementary'
  },
  {
    code: 'HQE',
    name: 'Accompagnement Environnemental',
    description: 'Mission d\'accompagnement HQE / RE2020 / Labels',
    defaultPercentage: 2,
    deliverables: ['Audit environnemental', 'Simulation thermique', 'Dossier de certification', 'Suivi des objectifs environnementaux'],
    category: 'complementary'
  },
  {
    code: 'HAND',
    name: 'Accessibilité PMR',
    description: 'Mission accessibilité et conformité handicap',
    defaultPercentage: 1,
    deliverables: ['Diagnostic accessibilité', 'Registre d\'accessibilité', 'Attestation de conformité', 'Ad\'AP si nécessaire'],
    category: 'complementary'
  },
  {
    code: 'ORD',
    name: 'Ordonnancement',
    description: 'Établissement et suivi du planning général',
    defaultPercentage: 1,
    deliverables: ['Planning directeur', 'Planning d\'exécution', 'Suivi des jalons', 'Rapports d\'avancement'],
    category: 'complementary'
  },
  {
    code: 'PIL',
    name: 'Pilotage',
    description: 'Pilotage et animation des réunions de chantier',
    defaultPercentage: 1,
    deliverables: ['Animation des réunions', 'Suivi des décisions', 'Relance des entreprises', 'Gestion des interfaces'],
    category: 'complementary'
  },
  {
    code: 'COORD',
    name: 'Coordination',
    description: 'Coordination des interventions sur chantier',
    defaultPercentage: 1,
    deliverables: ['Planning d\'intervention', 'Coordination des accès', 'Gestion des livraisons', 'Suivi des effectifs'],
    category: 'complementary'
  },
  {
    code: 'SIGNA',
    name: 'Signalétique',
    description: 'Conception et suivi de la signalétique',
    defaultPercentage: 2,
    deliverables: ['Charte signalétique', 'Plans d\'implantation', 'Dossier de fabrication', 'Suivi de pose'],
    category: 'complementary'
  },
  {
    code: 'MOB',
    name: 'Mobilier',
    description: 'Mission mobilier et aménagement',
    defaultPercentage: 2,
    deliverables: ['Cahier de mobilier', 'Plans d\'implantation', 'Consultation fournisseurs', 'Suivi livraisons'],
    category: 'complementary'
  },
  {
    code: 'PAY',
    name: 'Paysage',
    description: 'Mission paysagère et espaces extérieurs',
    defaultPercentage: 3,
    deliverables: ['Plan de masse paysager', 'Palette végétale', 'Plans de plantation', 'Suivi des travaux paysagers'],
    category: 'complementary'
  }
];

// Toutes les phases architecture combinées
export const ARCHITECTURE_PHASES: PhaseTemplate[] = [
  ...ARCHITECTURE_BASE_PHASES,
  ...ARCHITECTURE_COMPLEMENTARY_PHASES
];

// ============= INTERIOR DESIGN PHASES =============

export const INTERIOR_BASE_PHASES: PhaseTemplate[] = [
  {
    code: 'BRIEF',
    name: 'Brief & Programme',
    description: 'Analyse des besoins et définition du programme',
    defaultPercentage: 5,
    deliverables: ['Analyse de l\'existant', 'Programme fonctionnel', 'Moodboard', 'Budget prévisionnel'],
    category: 'base'
  },
  {
    code: 'ESQ',
    name: 'Esquisse',
    description: 'Premières propositions d\'aménagement',
    defaultPercentage: 15,
    deliverables: ['Plans d\'aménagement', 'Planche d\'ambiance', 'Croquis perspectives', 'Estimation budgétaire'],
    category: 'base'
  },
  {
    code: 'APS',
    name: 'Avant-Projet Sommaire',
    description: 'Développement du concept retenu',
    defaultPercentage: 12,
    deliverables: ['Plans APS (1/50)', 'Élévations murales', 'Palette matériaux', 'Budget affiné'],
    category: 'base'
  },
  {
    code: 'APD',
    name: 'Avant-Projet Définitif',
    description: 'Définition complète du projet',
    defaultPercentage: 18,
    deliverables: ['Plans APD (1/20)', 'Coupes techniques', 'Perspectives 3D', 'Carnet de finitions'],
    category: 'base'
  },
  {
    code: 'PRO',
    name: 'Projet d\'Exécution',
    description: 'Plans d\'exécution détaillés',
    defaultPercentage: 18,
    deliverables: ['Plans techniques détaillés', 'Détails menuiserie', 'Plans électriques', 'Descriptif quantitatif'],
    category: 'base'
  },
  {
    code: 'DCE',
    name: 'Consultation',
    description: 'Consultation et sélection des entreprises',
    defaultPercentage: 5,
    deliverables: ['Dossier de consultation', 'Analyse des devis', 'Tableaux comparatifs', 'Planning travaux'],
    category: 'base'
  },
  {
    code: 'DET',
    name: 'Suivi de Chantier',
    description: 'Direction et suivi des travaux',
    defaultPercentage: 20,
    deliverables: ['Comptes-rendus de chantier', 'Suivi des commandes', 'Coordination artisans', 'Gestion du planning'],
    category: 'base'
  },
  {
    code: 'AOR',
    name: 'Réception',
    description: 'Réception des travaux et livraison',
    defaultPercentage: 5,
    deliverables: ['PV de réception', 'Levée des réserves', 'Livraison client', 'Dossier des ouvrages exécutés'],
    category: 'base'
  }
];

export const INTERIOR_COMPLEMENTARY_PHASES: PhaseTemplate[] = [
  {
    code: 'DECO',
    name: 'Décoration',
    description: 'Mission de décoration et styling',
    defaultPercentage: 5,
    deliverables: ['Shopping list', 'Mise en scène', 'Accessoirisation', 'Reportage photo'],
    category: 'complementary'
  },
  {
    code: 'MOB',
    name: 'Mobilier sur-mesure',
    description: 'Conception de mobilier sur-mesure',
    defaultPercentage: 8,
    deliverables: ['Études mobilier', 'Plans de fabrication', 'Consultation ébénistes', 'Suivi fabrication'],
    category: 'complementary'
  },
  {
    code: 'ART',
    name: 'Œuvres d\'art',
    description: 'Conseil et acquisition d\'œuvres d\'art',
    defaultPercentage: 3,
    deliverables: ['Sélection d\'œuvres', 'Négociation', 'Suivi installation', 'Éclairage muséal'],
    category: 'complementary'
  },
  {
    code: 'ECLAI',
    name: 'Éclairagisme',
    description: 'Étude d\'éclairage et mise en lumière',
    defaultPercentage: 4,
    deliverables: ['Étude d\'éclairage', 'Simulation luminosité', 'Plans d\'implantation', 'Programmation scénarios'],
    category: 'complementary'
  }
];

export const INTERIOR_PHASES: PhaseTemplate[] = [
  ...INTERIOR_BASE_PHASES,
  ...INTERIOR_COMPLEMENTARY_PHASES
];

// ============= SCENOGRAPHY PHASES =============

export const SCENOGRAPHY_BASE_PHASES: PhaseTemplate[] = [
  {
    code: 'DIAG',
    name: 'Diagnostic & Programme',
    description: 'Analyse du site et définition du programme muséographique',
    defaultPercentage: 5,
    deliverables: ['Diagnostic du lieu', 'Étude des collections', 'Programme scientifique', 'Cahier des charges'],
    category: 'base'
  },
  {
    code: 'CONCEPT',
    name: 'Conception',
    description: 'Développement du concept scénographique',
    defaultPercentage: 15,
    deliverables: ['Note d\'intention', 'Recherches iconographiques', 'Parcours visiteur', 'Scénario muséographique'],
    category: 'base'
  },
  {
    code: 'SCENARIO',
    name: 'Scénario Détaillé',
    description: 'Écriture du scénario et séquençage',
    defaultPercentage: 12,
    deliverables: ['Scénario détaillé', 'Storyboard', 'Contenus par séquence', 'Brief multimédia'],
    category: 'base'
  },
  {
    code: 'APS',
    name: 'Avant-Projet Sommaire',
    description: 'Première spatialisation du projet',
    defaultPercentage: 10,
    deliverables: ['Plans APS', 'Élévations principales', 'Vues 3D', 'Estimation budgétaire'],
    category: 'base'
  },
  {
    code: 'APD',
    name: 'Avant-Projet Définitif',
    description: 'Conception graphique et spatiale complète',
    defaultPercentage: 15,
    deliverables: ['Plans scénographiques (1/50)', 'Élévations détaillées', 'Perspectives 3D', 'Design graphique', 'Palette matériaux'],
    category: 'base'
  },
  {
    code: 'PRO',
    name: 'Études de Projet',
    description: 'Plans techniques et dossiers de fabrication',
    defaultPercentage: 12,
    deliverables: ['Plans techniques', 'Dossiers de fabrication', 'Spécifications techniques', 'CCTP scénographie'],
    category: 'base'
  },
  {
    code: 'DCE',
    name: 'Consultation',
    description: 'Consultation des fabricants et prestataires',
    defaultPercentage: 5,
    deliverables: ['DCE scénographie', 'DPGF', 'Analyse des offres', 'Rapport d\'attribution'],
    category: 'base'
  },
  {
    code: 'SUIVI',
    name: 'Suivi de Production',
    description: 'Suivi de la fabrication des éléments',
    defaultPercentage: 8,
    deliverables: ['Validation prototypes', 'Suivi fabrication', 'Contrôle qualité', 'Réception usine'],
    category: 'base'
  },
  {
    code: 'MONTAGE',
    name: 'Montage',
    description: 'Installation sur site',
    defaultPercentage: 12,
    deliverables: ['Coordination montage', 'Suivi installation', 'Réglages éclairage', 'Tests multimédia'],
    category: 'base'
  },
  {
    code: 'AOR',
    name: 'Réception',
    description: 'Réception et mise en service',
    defaultPercentage: 4,
    deliverables: ['PV de réception', 'Formation exploitants', 'Documentation technique', 'Accompagnement ouverture'],
    category: 'base'
  }
];

export const SCENOGRAPHY_COMPLEMENTARY_PHASES: PhaseTemplate[] = [
  {
    code: 'MULTI',
    name: 'Production Multimédia',
    description: 'Conception et production des contenus multimédia',
    defaultPercentage: 10,
    deliverables: ['Brief créatif', 'Scénarios interactifs', 'Production audiovisuelle', 'Intégration'],
    category: 'complementary'
  },
  {
    code: 'GRAPH',
    name: 'Graphisme',
    description: 'Conception graphique et signalétique',
    defaultPercentage: 5,
    deliverables: ['Charte graphique', 'Panneaux d\'interprétation', 'Signalétique', 'Supports de communication'],
    category: 'complementary'
  },
  {
    code: 'ECLAI',
    name: 'Éclairage',
    description: 'Conception lumière muséographique',
    defaultPercentage: 4,
    deliverables: ['Étude d\'éclairage', 'Plans d\'implantation', 'Réglages scéniques', 'Programmation'],
    category: 'complementary'
  },
  {
    code: 'CONS',
    name: 'Conservation Préventive',
    description: 'Mission de conservation des œuvres',
    defaultPercentage: 3,
    deliverables: ['Étude climatique', 'Préconisations conservation', 'Suivi des conditions', 'Constats d\'état'],
    category: 'complementary'
  },
  {
    code: 'ACCESS',
    name: 'Accessibilité',
    description: 'Mission accessibilité tous publics',
    defaultPercentage: 3,
    deliverables: ['Diagnostic accessibilité', 'Outils de médiation', 'Parcours adaptés', 'Formation personnel'],
    category: 'complementary'
  }
];

export const SCENOGRAPHY_PHASES: PhaseTemplate[] = [
  ...SCENOGRAPHY_BASE_PHASES,
  ...SCENOGRAPHY_COMPLEMENTARY_PHASES
];

export const PHASES_BY_PROJECT_TYPE: Record<ProjectType, PhaseTemplate[]> = {
  architecture: ARCHITECTURE_PHASES,
  interior: INTERIOR_PHASES,
  scenography: SCENOGRAPHY_PHASES
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
