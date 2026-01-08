// ============= TENDER TYPES =============

// New Pipeline Status (3 colonnes)
export type PipelineStatus = 'a_approuver' | 'en_cours' | 'deposes';

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  a_approuver: 'À approuver',
  en_cours: 'En cours',
  deposes: 'Déposés',
};

export const PIPELINE_STATUS_COLORS: Record<PipelineStatus, string> = {
  a_approuver: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  en_cours: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  deposes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

// Tender Type (Architecture / Scénographie)
export type TenderType = 'architecture' | 'scenographie';

export const TENDER_TYPE_LABELS: Record<TenderType, string> = {
  architecture: 'Architecture',
  scenographie: 'Scénographie',
};

// Submission Type
export type SubmissionType = 'candidature' | 'offre' | 'candidature_offre';

export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  candidature: 'Candidature',
  offre: 'Offre',
  candidature_offre: 'Candidature + Offre',
};

// Legacy status (for backward compatibility)
export type TenderStatus = 'repere' | 'en_analyse' | 'go' | 'no_go' | 'en_montage' | 'depose' | 'gagne' | 'perdu';

export const TENDER_STATUS_LABELS: Record<TenderStatus, string> = {
  repere: 'Repéré',
  en_analyse: 'En analyse',
  go: 'Go',
  no_go: 'No-Go',
  en_montage: 'En montage',
  depose: 'Déposé',
  gagne: 'Gagné',
  perdu: 'Perdu',
};

export const TENDER_STATUS_COLORS: Record<TenderStatus, string> = {
  repere: 'bg-muted text-muted-foreground',
  en_analyse: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  go: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  no_go: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  en_montage: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  depose: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  gagne: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  perdu: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

// Map legacy status to pipeline status
export function mapStatusToPipeline(status: TenderStatus): PipelineStatus {
  switch (status) {
    case 'repere':
    case 'en_analyse':
    case 'no_go':
      return 'a_approuver';
    case 'go':
    case 'en_montage':
      return 'en_cours';
    case 'depose':
    case 'gagne':
    case 'perdu':
      return 'deposes';
    default:
      return 'a_approuver';
  }
}

// Procedure Types
export type ProcedureType = 'ouvert' | 'restreint' | 'adapte' | 'mapa' | 'concours' | 'dialogue' | 'partenariat' | 'ppp' | 'conception_realisation' | 'autre';

export const PROCEDURE_TYPE_LABELS: Record<ProcedureType, string> = {
  ouvert: 'Appel d\'offres ouvert',
  restreint: 'Appel d\'offres restreint',
  adapte: 'Procédure adaptée',
  mapa: 'MAPA',
  concours: 'Concours',
  dialogue: 'Dialogue compétitif',
  partenariat: 'Partenariat d\'innovation',
  ppp: 'Partenariat Public-Privé',
  conception_realisation: 'Conception-Réalisation',
  autre: 'Autre',
};

// Team Roles
export type TenderTeamRole = 'mandataire' | 'cotraitant' | 'sous_traitant';

export const TEAM_ROLE_LABELS: Record<TenderTeamRole, string> = {
  mandataire: 'Mandataire',
  cotraitant: 'Cotraitant',
  sous_traitant: 'Sous-traitant',
};

// Invitation Response
export type InvitationResponse = 'pending' | 'accepted' | 'declined';

// Joint Venture Types
export type JointVentureType = 'conjoint' | 'solidaire';

export const JOINT_VENTURE_TYPE_LABELS: Record<JointVentureType, string> = {
  conjoint: 'Conjoint',
  solidaire: 'Solidaire',
};

// Criterion Types
export type CriterionType = 'price' | 'technical' | 'delay' | 'environmental' | 'social';

export const CRITERION_TYPE_LABELS: Record<CriterionType, string> = {
  price: 'Prix',
  technical: 'Valeur technique',
  delay: 'Délais',
  environmental: 'Environnement',
  social: 'Social',
};

// Document Category
export type DocumentCategory = 'candidature' | 'offre';

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  rc: 'Règlement de Consultation (RC)',
  ccap: 'CCAP',
  cctp: 'CCTP',
  ae: 'Acte d\'Engagement (AE)',
  dc1: 'DC1',
  dc2: 'DC2',
  dc4: 'DC4',
  annexe: 'Annexe',
  lettre_consultation: 'Lettre de consultation',
  note_programme: 'Note / Programme',
  attestation_visite: 'Attestation de visite',
  audit_technique: 'Audit / Diagnostic technique',
  dpgf: 'DPGF / BPU',
  plan: 'Plans / Documents graphiques',
  contrat: 'Contrat',
  bpu: 'BPU / DQE',
  autre: 'Autre',
};

export const REQUIRED_DOCUMENT_TYPES = {
  candidature: [
    { value: 'dc1', label: 'DC1 - Lettre de candidature', mandatory: true },
    { value: 'dc2', label: 'DC2 - Déclaration du candidat', mandatory: true },
    { value: 'attestation_assurance', label: 'Attestation d\'assurance', mandatory: true },
    { value: 'attestation_urssaf', label: 'Attestation URSSAF', mandatory: true },
    { value: 'attestation_fiscale', label: 'Attestation fiscale', mandatory: true },
    { value: 'kbis', label: 'Extrait Kbis', mandatory: true },
    { value: 'references', label: 'Références', mandatory: true },
    { value: 'moyens_humains', label: 'Moyens humains', mandatory: false },
    { value: 'moyens_techniques', label: 'Moyens techniques', mandatory: false },
    { value: 'cv_equipe', label: 'CV de l\'équipe', mandatory: false },
  ],
  offre: [
    { value: 'ae', label: 'Acte d\'Engagement', mandatory: true },
    { value: 'memoire_technique', label: 'Mémoire technique', mandatory: true },
    { value: 'dpgf', label: 'DPGF / BPU', mandatory: true },
    { value: 'planning', label: 'Planning prévisionnel', mandatory: false },
    { value: 'note_methodologique', label: 'Note méthodologique', mandatory: false },
    { value: 'dc4', label: 'DC4 - Sous-traitance', mandatory: false },
    { value: 'attestation_visite', label: 'Attestation de visite', mandatory: false },
    { value: 'pieces_graphiques', label: 'Pièces graphiques', mandatory: false },
  ],
};

export const DELIVERABLE_TYPES = [
  { value: 'dc1', label: 'DC1 - Lettre de candidature' },
  { value: 'dc2', label: 'DC2 - Déclaration du candidat' },
  { value: 'dc4', label: 'DC4 - Sous-traitance' },
  { value: 'ae', label: 'Acte d\'Engagement' },
  { value: 'memoire', label: 'Mémoire technique' },
  { value: 'attestation', label: 'Attestations' },
  { value: 'reference', label: 'Références' },
  { value: 'planning', label: 'Planning' },
  { value: 'bpu', label: 'BPU / DQE' },
  { value: 'autre', label: 'Autre' },
];

// MOE Specialties for team requirements
export const MOE_SPECIALTIES = [
  { value: 'architecte', label: 'Architecte' },
  { value: 'bet_structure', label: 'BET Structure' },
  { value: 'bet_fluides', label: 'BET Fluides' },
  { value: 'bet_electricite', label: 'BET Électricité' },
  { value: 'thermicien', label: 'Thermicien / RE2020' },
  { value: 'economiste', label: 'Économiste' },
  { value: 'acousticien', label: 'Acousticien' },
  { value: 'paysagiste', label: 'Paysagiste' },
  { value: 'vrd', label: 'VRD' },
  { value: 'opc', label: 'OPC' },
  { value: 'ssi', label: 'SSI' },
  { value: 'cuisiniste', label: 'Cuisiniste' },
  { value: 'bet_facade', label: 'BET Façade' },
  { value: 'geometre', label: 'Géomètre' },
  { value: 'geotechnicien', label: 'Géotechnicien' },
  { value: 'scenographe', label: 'Scénographe' },
  { value: 'eclairagiste', label: 'Éclairagiste' },
  { value: 'signaletique', label: 'Signalétique' },
  { value: 'autre', label: 'Autre' },
] as const;

export const SPECIALTIES = [
  { value: 'architecte', label: 'Architecte' },
  { value: 'bet_structure', label: 'BET Structure' },
  { value: 'bet_fluides', label: 'BET Fluides' },
  { value: 'bet_electricite', label: 'BET Électricité' },
  { value: 'thermicien', label: 'Thermicien / RE2020' },
  { value: 'economiste', label: 'Économiste' },
  { value: 'acousticien', label: 'Acousticien' },
  { value: 'paysagiste', label: 'Paysagiste' },
  { value: 'vrd', label: 'VRD' },
  { value: 'opc', label: 'OPC' },
  { value: 'ssi', label: 'SSI' },
  { value: 'cuisiniste', label: 'Cuisiniste' },
  { value: 'bet_facade', label: 'BET Façade' },
  { value: 'geometre', label: 'Géomètre' },
  { value: 'geotechnicien', label: 'Géotechnicien' },
  { value: 'autre', label: 'Autre' },
];

export const CLIENT_TYPES = [
  { value: 'client_public', label: 'MOA Public' },
  { value: 'bailleur_social', label: 'Bailleur social' },
  { value: 'collectivite', label: 'Collectivité territoriale' },
  { value: 'etat', label: 'État / Ministère' },
  { value: 'hopital', label: 'Établissement de santé' },
  { value: 'universite', label: 'Université / Enseignement' },
  { value: 'etablissement_public', label: 'Établissement public' },
  { value: 'prive', label: 'Client privé' },
  { value: 'autre', label: 'Autre' },
];

export const WORK_NATURE_TAGS = [
  'Construction neuve',
  'Réhabilitation',
  'Extension',
  'Rénovation énergétique',
  'Mise aux normes',
  'Restructuration',
  'Déconstruction',
  'Aménagement intérieur',
  'Façades',
  'Toiture',
];

// ============= INTERFACES =============

export interface Tender {
  id: string;
  workspace_id: string;
  created_by: string | null;
  reference: string;
  title: string;
  description: string | null;
  // Tender type
  tender_type: TenderType;
  submission_type: SubmissionType;
  pipeline_status: PipelineStatus;
  // Market identification
  consultation_number: string | null;
  group_code: string | null;
  market_object: string | null;
  // Client info
  client_name: string | null;
  client_type: string | null;
  client_direction: string | null;
  client_address: string | null;
  client_contact_name: string | null;
  client_contact_phone: string | null;
  client_contact_email: string | null;
  contracting_authority: string | null;
  moa_company_id: string | null;
  // Project info
  estimated_budget: number | null;
  budget_disclosed: boolean | null;
  location: string | null;
  region: string | null;
  surface_area: number | null;
  work_nature_tags: string[] | null;
  // Procedure
  procedure_type: ProcedureType | null;
  procedure_other: string | null;
  allows_negotiation: boolean | null;
  negotiation_candidates_count: number | null;
  negotiation_method: string | null;
  allows_joint_venture: boolean | null;
  joint_venture_type: string | null;
  mandataire_must_be_solidary: boolean | null;
  allows_variants: boolean | null;
  // Deadlines
  submission_deadline: string | null;
  offer_validity_days: number | null;
  dce_delivery_deadline: string | null;
  dce_delivery_duration_months: number | null;
  questions_deadline_days: number | null;
  // Site visit
  site_visit_required: boolean | null;
  site_visit_date: string | null;
  site_visit_contact_name: string | null;
  site_visit_contact_phone: string | null;
  site_visit_contact_email: string | null;
  site_visit_secondary_contact: Record<string, string> | null;
  site_visit_assigned_user_id: string | null;
  // Key dates
  jury_date: string | null;
  results_date: string | null;
  // Decision
  status: TenderStatus;
  go_decision_date: string | null;
  go_decision_by: string | null;
  go_decision_notes: string | null;
  // Source
  source_platform: string | null;
  source_url: string | null;
  source_contact_email: string | null;
  dce_link: string | null;
  // Required team (stored as JSON, typed at runtime)
  required_team: unknown;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface TenderDocument {
  id: string;
  tender_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  is_analyzed: boolean;
  extracted_data: Record<string, unknown>;
  uploaded_at: string;
  analyzed_at: string | null;
}

export interface TenderTeamMember {
  id: string;
  tender_id: string;
  role: TenderTeamRole;
  specialty: string | null;
  company_id: string | null;
  contact_id: string | null;
  status: InvitationResponse;
  invited_at: string | null;
  responded_at: string | null;
  notes: string | null;
  created_at: string;
  parent_member_id: string | null;
  fee_percentage: number | null;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  contact?: {
    id: string;
    name: string;
    email: string | null;
  };
  parent_member?: {
    id: string;
    company: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface TenderDeliverable {
  id: string;
  tender_id: string;
  deliverable_type: string;
  name: string;
  description: string | null;
  responsible_type: string;
  responsible_company_ids: string[];
  is_completed: boolean;
  due_date: string | null;
  file_urls: string[];
  sort_order: number;
  member_completion: Record<string, boolean>;
  created_at: string;
}

export interface TenderRequiredDocument {
  id: string;
  tender_id: string;
  workspace_id: string;
  document_category: DocumentCategory;
  document_type: string;
  name: string;
  description: string | null;
  is_mandatory: boolean;
  template_url: string | null;
  is_completed: boolean;
  file_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TenderCriterion {
  id: string;
  tender_id: string;
  name: string;
  weight: number;
  criterion_type: CriterionType;
  parent_criterion_id: string | null;
  sub_criteria?: TenderCriterion[];
}

export interface TenderRequiredTeam {
  id: string;
  tender_id: string;
  workspace_id: string;
  specialty: string;
  is_mandatory: boolean;
  notes: string | null;
  company_id: string | null;
  created_at: string;
}

export interface ExtractedTenderData {
  title?: string;
  reference?: string;
  tender_type?: TenderType;
  submission_type?: SubmissionType;
  budget?: {
    amount?: number;
    disclosed?: boolean;
    notes?: string;
  };
  deadlines?: {
    submission?: string;
    questions?: string;
    site_visit?: string;
    jury?: string;
    results?: string;
  };
  site_visit?: {
    required?: boolean;
    date?: string;
    location?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
  };
  selection_criteria?: Array<{
    name: string;
    weight: number;
    type?: CriterionType;
    sub_criteria?: Array<{
      name: string;
      weight: number;
    }>;
  }>;
  required_competencies?: Array<{
    specialty: string;
    mandatory: boolean;
    requirements?: string;
  }>;
  required_documents?: Array<{
    type: string;
    name: string;
    mandatory: boolean;
    category?: DocumentCategory;
  }>;
  project_info?: {
    type?: string;
    surface?: number;
    location?: string;
    description?: string;
    work_nature?: string[];
  };
  procedure?: {
    type?: string;
    other?: string;
    lots?: boolean;
    lots_count?: number;
    allows_variants?: boolean;
    allows_joint_venture?: boolean;
    joint_venture_type?: string;
  };
  client?: {
    name?: string;
    type?: string;
    direction?: string;
    address?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
  };
  consultation?: {
    number?: string;
    object?: string;
    reference?: string;
  };
  insurance_requirements?: Array<{
    type: string;
    minimum_amount?: number;
  }>;
  reference_requirements?: {
    count?: number;
    min_budget?: number;
    max_age_years?: number;
    specific_types?: string[];
  };
  dce_link?: string;
}
