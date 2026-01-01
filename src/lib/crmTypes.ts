// Company types for French architecture industry
export type CompanyType =
  | 'client'
  | 'prospect'
  | 'client_prive'
  | 'client_public'
  | 'bet_structure'
  | 'bet_fluides'
  | 'bet_electricite'
  | 'bet_acoustique'
  | 'bet_thermique'
  | 'bet_vrd'
  | 'bet_facade'
  | 'bet_environnement'
  | 'architecte'
  | 'urbaniste'
  | 'paysagiste'
  | 'decorateur'
  | 'economiste'
  | 'opc'
  | 'sps'
  | 'geometre'
  | 'diagnostiqueur'
  | 'entreprise_gros_oeuvre'
  | 'entreprise_second_oeuvre'
  | 'entreprise_generale'
  | 'artisan'
  | 'fournisseur'
  | 'fabricant'
  | 'distributeur'
  | 'amo'
  | 'programmiste'
  | 'conseil'
  | 'administration'
  | 'notaire'
  | 'banque'
  | 'assurance'
  | 'autre';

export type CompanyCategory =
  | 'all'
  | 'client'
  | 'bet'
  | 'partenaire'
  | 'entreprise'
  | 'fournisseur'
  | 'conseil'
  | 'admin'
  | 'autre';

export const COMPANY_TYPE_CONFIG: Record<
  CompanyType,
  {
    label: string;
    shortLabel: string;
    category: CompanyCategory;
    color: string;
  }
> = {
  // Clients
  client: { label: 'Client actif', shortLabel: 'Client', category: 'client', color: 'bg-emerald-500' },
  prospect: { label: 'Prospect', shortLabel: 'Prospect', category: 'client', color: 'bg-blue-500' },
  client_prive: { label: 'Client privé', shortLabel: 'Privé', category: 'client', color: 'bg-emerald-600' },
  client_public: { label: 'Client public', shortLabel: 'Public', category: 'client', color: 'bg-indigo-500' },

  // BET
  bet_structure: { label: 'BET Structure', shortLabel: 'Structure', category: 'bet', color: 'bg-orange-500' },
  bet_fluides: { label: 'BET Fluides', shortLabel: 'Fluides', category: 'bet', color: 'bg-cyan-500' },
  bet_electricite: { label: 'BET Électricité', shortLabel: 'Élec', category: 'bet', color: 'bg-yellow-500' },
  bet_acoustique: { label: 'BET Acoustique', shortLabel: 'Acoustique', category: 'bet', color: 'bg-purple-500' },
  bet_thermique: { label: 'BET Thermique', shortLabel: 'Thermique', category: 'bet', color: 'bg-red-500' },
  bet_vrd: { label: 'BET VRD', shortLabel: 'VRD', category: 'bet', color: 'bg-amber-600' },
  bet_facade: { label: 'BET Façade', shortLabel: 'Façade', category: 'bet', color: 'bg-slate-500' },
  bet_environnement: { label: 'BET Environnement', shortLabel: 'Env.', category: 'bet', color: 'bg-green-600' },

  // Partenaires MOE
  architecte: { label: 'Architecte', shortLabel: 'Archi', category: 'partenaire', color: 'bg-violet-500' },
  urbaniste: { label: 'Urbaniste', shortLabel: 'Urba', category: 'partenaire', color: 'bg-teal-500' },
  paysagiste: { label: 'Paysagiste', shortLabel: 'Paysage', category: 'partenaire', color: 'bg-lime-500' },
  decorateur: { label: 'Décorateur', shortLabel: 'Déco', category: 'partenaire', color: 'bg-pink-500' },
  economiste: { label: 'Économiste', shortLabel: 'Éco', category: 'partenaire', color: 'bg-sky-500' },
  opc: { label: 'OPC', shortLabel: 'OPC', category: 'partenaire', color: 'bg-fuchsia-500' },
  sps: { label: 'SPS', shortLabel: 'SPS', category: 'partenaire', color: 'bg-rose-500' },
  geometre: { label: 'Géomètre', shortLabel: 'Géo', category: 'partenaire', color: 'bg-stone-500' },
  diagnostiqueur: { label: 'Diagnostiqueur', shortLabel: 'Diag', category: 'partenaire', color: 'bg-zinc-500' },

  // Entreprises
  entreprise_gros_oeuvre: { label: 'Gros œuvre', shortLabel: 'GO', category: 'entreprise', color: 'bg-amber-700' },
  entreprise_second_oeuvre: { label: 'Second œuvre', shortLabel: 'SO', category: 'entreprise', color: 'bg-orange-600' },
  entreprise_generale: { label: 'Entreprise générale', shortLabel: 'EG', category: 'entreprise', color: 'bg-red-600' },
  artisan: { label: 'Artisan', shortLabel: 'Artisan', category: 'entreprise', color: 'bg-yellow-600' },

  // Fournisseurs
  fournisseur: { label: 'Fournisseur', shortLabel: 'Fourn.', category: 'fournisseur', color: 'bg-blue-600' },
  fabricant: { label: 'Fabricant', shortLabel: 'Fab.', category: 'fournisseur', color: 'bg-indigo-600' },
  distributeur: { label: 'Distributeur', shortLabel: 'Dist.', category: 'fournisseur', color: 'bg-purple-600' },

  // AMO / Conseil
  amo: { label: 'AMO', shortLabel: 'AMO', category: 'conseil', color: 'bg-cyan-600' },
  programmiste: { label: 'Programmiste', shortLabel: 'Prog.', category: 'conseil', color: 'bg-teal-600' },
  conseil: { label: 'Conseil', shortLabel: 'Conseil', category: 'conseil', color: 'bg-emerald-700' },

  // Administration
  administration: { label: 'Administration', shortLabel: 'Admin', category: 'admin', color: 'bg-gray-600' },
  notaire: { label: 'Notaire', shortLabel: 'Notaire', category: 'admin', color: 'bg-slate-600' },
  banque: { label: 'Banque', shortLabel: 'Banque', category: 'admin', color: 'bg-blue-700' },
  assurance: { label: 'Assurance', shortLabel: 'Assur.', category: 'admin', color: 'bg-green-700' },

  // Autre
  autre: { label: 'Autre', shortLabel: 'Autre', category: 'autre', color: 'bg-neutral-500' },
};

export const COMPANY_CATEGORIES: {
  id: CompanyCategory;
  label: string;
  icon: string;
  types?: CompanyType[];
}[] = [
  { id: 'all', label: 'Toutes', icon: 'Layers' },
  {
    id: 'client',
    label: 'Clients',
    icon: 'Building2',
    types: ['client', 'prospect', 'client_prive', 'client_public'],
  },
  {
    id: 'bet',
    label: 'BET',
    icon: 'Ruler',
    types: [
      'bet_structure',
      'bet_fluides',
      'bet_electricite',
      'bet_acoustique',
      'bet_thermique',
      'bet_vrd',
      'bet_facade',
      'bet_environnement',
    ],
  },
  {
    id: 'partenaire',
    label: 'Partenaires MOE',
    icon: 'Users',
    types: [
      'architecte',
      'urbaniste',
      'paysagiste',
      'decorateur',
      'economiste',
      'opc',
      'sps',
      'geometre',
      'diagnostiqueur',
    ],
  },
  {
    id: 'entreprise',
    label: 'Entreprises',
    icon: 'HardHat',
    types: ['entreprise_gros_oeuvre', 'entreprise_second_oeuvre', 'entreprise_generale', 'artisan'],
  },
  {
    id: 'fournisseur',
    label: 'Fournisseurs',
    icon: 'Package',
    types: ['fournisseur', 'fabricant', 'distributeur'],
  },
  {
    id: 'conseil',
    label: 'AMO / Conseil',
    icon: 'Lightbulb',
    types: ['amo', 'programmiste', 'conseil'],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: 'Landmark',
    types: ['administration', 'notaire', 'banque', 'assurance'],
  },
  { id: 'autre', label: 'Autre', icon: 'MoreHorizontal', types: ['autre'] },
];

export type LeadStatus = 'new' | 'contacted' | 'meeting' | 'proposal' | 'negotiation' | 'won' | 'lost';

export const LEAD_STATUSES: { id: LeadStatus; label: string; color: string; probability: number }[] = [
  { id: 'new', label: 'Nouveau', color: '#6b7280', probability: 10 },
  { id: 'contacted', label: 'Contacté', color: '#3b82f6', probability: 20 },
  { id: 'meeting', label: 'RDV planifié', color: '#8b5cf6', probability: 40 },
  { id: 'proposal', label: 'Proposition', color: '#ec4899', probability: 60 },
  { id: 'negotiation', label: 'Négociation', color: '#f97316', probability: 80 },
  { id: 'won', label: 'Gagné', color: '#22c55e', probability: 100 },
  { id: 'lost', label: 'Perdu', color: '#ef4444', probability: 0 },
];

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'task'
  | 'proposal'
  | 'site_visit'
  | 'document';

export const ACTIVITY_TYPES: { id: ActivityType; label: string; icon: string; color: string }[] = [
  { id: 'call', label: 'Appel', icon: 'Phone', color: 'text-green-500' },
  { id: 'email', label: 'Email', icon: 'Mail', color: 'text-blue-500' },
  { id: 'meeting', label: 'Réunion', icon: 'Users', color: 'text-purple-500' },
  { id: 'note', label: 'Note', icon: 'StickyNote', color: 'text-yellow-500' },
  { id: 'task', label: 'Tâche', icon: 'CheckSquare', color: 'text-orange-500' },
  { id: 'proposal', label: 'Proposition', icon: 'FileText', color: 'text-pink-500' },
  { id: 'site_visit', label: 'Visite site', icon: 'MapPin', color: 'text-teal-500' },
  { id: 'document', label: 'Document', icon: 'File', color: 'text-slate-500' },
];

export const LEAD_SOURCES: { id: string; label: string }[] = [
  { id: 'referral', label: 'Recommandation' },
  { id: 'website', label: 'Site web' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'cold_call', label: 'Prospection téléphonique' },
  { id: 'event', label: 'Événement / Salon' },
  { id: 'tender', label: 'Appel d\'offres' },
  { id: 'partner', label: 'Partenaire' },
  { id: 'press', label: 'Presse / Publication' },
  { id: 'other', label: 'Autre' },
];

// Interfaces
export interface CRMCompany {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  billing_email: string | null;
  notes: string | null;
  logo_url: string | null;
  bet_specialties: string[] | null;
  created_by: string | null;
  workspace_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CRMCompanyEnriched extends CRMCompany {
  contacts_count: number;
  leads_count: number;
  leads_value: number;
  primary_contact: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  contact_type: string | null;
  location: string | null;
  notes: string | null;
  avatar_url: string | null;
  crm_company_id: string | null;
  created_by: string | null;
  workspace_id: string;
  created_at: string | null;
  updated_at: string | null;
  company?: CRMCompany | null;
}

export interface CRMFilters {
  search: string;
  category: CompanyCategory;
  companyType: CompanyType | 'all';
  letterFilter: string | null;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export function getCompanyTypeConfig(type: string | null): {
  label: string;
  shortLabel: string;
  category: CompanyCategory;
  color: string;
} {
  if (!type || !(type in COMPANY_TYPE_CONFIG)) {
    return COMPANY_TYPE_CONFIG.autre;
  }
  return COMPANY_TYPE_CONFIG[type as CompanyType];
}

export function getTypesByCategory(category: CompanyCategory): CompanyType[] {
  const categoryConfig = COMPANY_CATEGORIES.find((c) => c.id === category);
  return categoryConfig?.types || [];
}
