export type TenderStatus = 'repere' | 'en_analyse' | 'go' | 'no_go' | 'en_montage' | 'depose' | 'gagne' | 'perdu';
export type ProcedureType = 'ouvert' | 'restreint' | 'adapte' | 'concours' | 'dialogue' | 'partenariat';
export type TenderTeamRole = 'mandataire' | 'cotraitant' | 'sous_traitant';
export type InvitationResponse = 'pending' | 'accepted' | 'declined';

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

export const PROCEDURE_TYPE_LABELS: Record<ProcedureType, string> = {
  ouvert: 'Appel d\'offres ouvert',
  restreint: 'Appel d\'offres restreint',
  adapte: 'Procédure adaptée (MAPA)',
  concours: 'Concours',
  dialogue: 'Dialogue compétitif',
  partenariat: 'Partenariat d\'innovation',
};

export const TEAM_ROLE_LABELS: Record<TenderTeamRole, string> = {
  mandataire: 'Mandataire',
  cotraitant: 'Cotraitant',
  sous_traitant: 'Sous-traitant',
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  rc: 'Règlement de Consultation (RC)',
  ccap: 'CCAP',
  cctp: 'CCTP',
  ae: 'Acte d\'Engagement (AE)',
  dc1: 'DC1',
  dc2: 'DC2',
  dc4: 'DC4',
  annexe: 'Annexe',
  autre: 'Autre',
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
  { value: 'autre', label: 'Autre' },
];

export interface Tender {
  id: string;
  workspace_id: string;
  created_by: string | null;
  reference: string;
  title: string;
  description: string | null;
  client_name: string | null;
  client_type: string | null;
  contracting_authority: string | null;
  estimated_budget: number | null;
  budget_disclosed: boolean | null;
  location: string | null;
  region: string | null;
  surface_area: number | null;
  procedure_type: ProcedureType | null;
  status: TenderStatus;
  go_decision_date: string | null;
  go_decision_by: string | null;
  go_decision_notes: string | null;
  submission_deadline: string | null;
  site_visit_required: boolean | null;
  site_visit_date: string | null;
  jury_date: string | null;
  results_date: string | null;
  source_platform: string | null;
  source_url: string | null;
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
  created_at: string;
}
