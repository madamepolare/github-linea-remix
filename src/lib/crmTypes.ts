// Company types for French architecture industry
// IMPORTANT: Les BET sont maintenant un TYPE UNIQUE avec des spécialités séparées (bet_specialties)
export type CompanyType =
  | 'client'
  | 'prospect'
  | 'client_prive'
  | 'client_public'
  | 'bet' // Type unique - les spécialités sont gérées via bet_specialties[]
  | 'architecte'
  | 'urbaniste'
  | 'paysagiste'
  | 'decorateur'
  | 'economiste'
  | 'opc'
  | 'sps'
  | 'geometre'
  | 'diagnostiqueur'
  | 'gros_oeuvre'
  | 'second_oeuvre'
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
  | 'societe' // Renommé de 'entreprise'
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

  // BET - Type unique, spécialités gérées via bet_specialties[]
  bet: { label: 'Bureau d\'Études Techniques', shortLabel: 'BET', category: 'bet', color: 'bg-orange-500' },

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

  // Sociétés (ex-Entreprises)
  gros_oeuvre: { label: 'Gros œuvre', shortLabel: 'GO', category: 'societe', color: 'bg-amber-700' },
  second_oeuvre: { label: 'Second œuvre', shortLabel: 'SO', category: 'societe', color: 'bg-orange-600' },
  entreprise_generale: { label: 'Entreprise générale', shortLabel: 'EG', category: 'societe', color: 'bg-red-600' },
  artisan: { label: 'Artisan', shortLabel: 'Artisan', category: 'societe', color: 'bg-yellow-600' },

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
    types: ['bet'], // Type unique - spécialités gérées via bet_specialties[]
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
    id: 'societe',
    label: 'Sociétés',
    icon: 'HardHat',
    types: ['gros_oeuvre', 'second_oeuvre', 'entreprise_generale', 'artisan'],
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

// BET Specialties - Liste unifiée pour création et édition
export const BET_SPECIALTIES = [
  { value: "structure", label: "Structure", color: "bg-orange-500" },
  { value: "fluides", label: "Fluides (CVC)", color: "bg-cyan-500" },
  { value: "electricite", label: "Électricité", color: "bg-yellow-500" },
  { value: "acoustique", label: "Acoustique", color: "bg-purple-500" },
  { value: "thermique", label: "Thermique / RE2020", color: "bg-red-500" },
  { value: "vrd", label: "VRD", color: "bg-amber-600" },
  { value: "facade", label: "Façades", color: "bg-slate-500" },
  { value: "environnement", label: "Environnement / HQE", color: "bg-green-600" },
  { value: "economie", label: "Économie", color: "bg-blue-500" },
  { value: "paysage", label: "Paysage", color: "bg-emerald-500" },
  { value: "securite", label: "Sécurité incendie", color: "bg-rose-500" },
  { value: "geotechnique", label: "Géotechnique", color: "bg-stone-500" },
];

// Contact Types - Liste unifiée pour création et édition
export const CONTACT_TYPES = [
  { value: "client", label: "Client" },
  { value: "partner", label: "Partenaire" },
  { value: "supplier", label: "Fournisseur" },
  { value: "amo", label: "AMO" },
  { value: "partner", label: "Partenaire" },
  { value: "supplier", label: "Fournisseur" },
  { value: "bet", label: "BET" },
  { value: "societe", label: "Société" },
];
