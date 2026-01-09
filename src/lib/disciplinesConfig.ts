import { Building2, Sofa, Theater, Megaphone, LucideIcon } from "lucide-react";

// ============================================
// LINEA Multi-Discipline Configuration
// ============================================

export type DisciplineSlug = 'architecture' | 'interior' | 'scenography' | 'communication';

export interface DisciplineTerminology {
  project: string;
  projects: string;
  phase: string;
  phases: string;
  lot: string;
  lots: string;
  chantier: string;
  client: string;
  clients: string;
  intervenant: string;
  intervenants: string;
  dce: string;
  devis: string;
  contrat: string;
}

export interface DisciplinePhase {
  code: string;
  name: string;
  description?: string;
  percentage?: number;
}

export interface DisciplineProjectType {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export interface DisciplineConfig {
  slug: DisciplineSlug;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  color: string;
  terminology: DisciplineTerminology;
  projectTypes: DisciplineProjectType[];
  defaultPhases: DisciplinePhase[];
  crmPipelineStages: string[];
  availableModules: string[];
  recommendedModules: string[];
}

// ============================================
// Terminologies par discipline
// ============================================

const ARCHITECTURE_TERMINOLOGY: DisciplineTerminology = {
  project: 'Projet',
  projects: 'Projets',
  phase: 'Phase',
  phases: 'Phases',
  lot: 'Lot',
  lots: 'Lots',
  chantier: 'Chantier',
  client: 'Maître d\'ouvrage',
  clients: 'Maîtres d\'ouvrage',
  intervenant: 'Intervenant',
  intervenants: 'Intervenants',
  dce: 'DCE',
  devis: 'Honoraires',
  contrat: 'Contrat de maîtrise d\'œuvre',
};

const INTERIOR_TERMINOLOGY: DisciplineTerminology = {
  project: 'Projet',
  projects: 'Projets',
  phase: 'Phase',
  phases: 'Phases',
  lot: 'Lot',
  lots: 'Lots',
  chantier: 'Chantier',
  client: 'Client',
  clients: 'Clients',
  intervenant: 'Prestataire',
  intervenants: 'Prestataires',
  dce: 'Cahier des charges',
  devis: 'Devis',
  contrat: 'Contrat',
};

const SCENOGRAPHY_TERMINOLOGY: DisciplineTerminology = {
  project: 'Projet',
  projects: 'Projets',
  phase: 'Étape',
  phases: 'Étapes',
  lot: 'Lot',
  lots: 'Lots',
  chantier: 'Montage',
  client: 'Commanditaire',
  clients: 'Commanditaires',
  intervenant: 'Prestataire',
  intervenants: 'Prestataires',
  dce: 'Cahier des charges',
  devis: 'Proposition',
  contrat: 'Contrat',
};

const COMMUNICATION_TERMINOLOGY: DisciplineTerminology = {
  project: 'Projet',
  projects: 'Projets',
  phase: 'Phase',
  phases: 'Phases',
  lot: 'Livrable',
  lots: 'Livrables',
  chantier: 'Production',
  client: 'Client',
  clients: 'Clients',
  intervenant: 'Partenaire',
  intervenants: 'Partenaires',
  dce: 'Brief',
  devis: 'Proposition',
  contrat: 'Contrat',
};

// ============================================
// Types de projets par discipline
// ============================================

const ARCHITECTURE_PROJECT_TYPES: DisciplineProjectType[] = [
  { value: 'construction', label: 'Construction neuve', description: 'Projet de construction neuve', icon: 'Building2' },
  { value: 'renovation', label: 'Rénovation', description: 'Réhabilitation et rénovation', icon: 'Hammer' },
  { value: 'extension', label: 'Extension', description: 'Extension de bâtiment existant', icon: 'Maximize2' },
  { value: 'permis', label: 'Permis de construire', description: 'Dépôt de permis uniquement', icon: 'FileCheck' },
  { value: 'urbanisme', label: 'Urbanisme', description: 'Projet d\'urbanisme', icon: 'Map' },
];

const INTERIOR_PROJECT_TYPES: DisciplineProjectType[] = [
  { value: 'amenagement', label: 'Aménagement', description: 'Aménagement intérieur complet', icon: 'LayoutGrid' },
  { value: 'retail', label: 'Retail', description: 'Boutiques et espaces commerciaux', icon: 'Store' },
  { value: 'residential', label: 'Résidentiel', description: 'Appartements et maisons', icon: 'Home' },
  { value: 'hospitality', label: 'Hospitality', description: 'Hôtels, restaurants, bars', icon: 'UtensilsCrossed' },
  { value: 'workspace', label: 'Bureaux', description: 'Espaces de travail', icon: 'Building' },
];

const SCENOGRAPHY_PROJECT_TYPES: DisciplineProjectType[] = [
  { value: 'exposition', label: 'Exposition', description: 'Exposition temporaire ou permanente', icon: 'Frame' },
  { value: 'musee', label: 'Muséographie', description: 'Parcours muséographique', icon: 'Landmark' },
  { value: 'evenement', label: 'Événement', description: 'Scénographie événementielle', icon: 'PartyPopper' },
  { value: 'stand', label: 'Stand', description: 'Stand de salon professionnel', icon: 'Box' },
  { value: 'spectacle', label: 'Spectacle', description: 'Décor de spectacle', icon: 'Sparkles' },
];

const COMMUNICATION_PROJECT_TYPES: DisciplineProjectType[] = [
  { value: 'campagne', label: 'Campagne', description: 'Campagne de communication 360°', icon: 'Megaphone' },
  { value: 'branding', label: 'Branding', description: 'Identité visuelle et branding', icon: 'Palette' },
  { value: 'digital', label: 'Digital', description: 'Stratégie et contenus digitaux', icon: 'Globe' },
  { value: 'evenementiel', label: 'Événementiel', description: 'Événements et activations', icon: 'Calendar' },
  { value: 'contenu', label: 'Contenu', description: 'Production de contenus', icon: 'FileVideo' },
];

// ============================================
// Phases par défaut par discipline
// ============================================

const ARCHITECTURE_PHASES: DisciplinePhase[] = [
  { code: 'ESQ', name: 'Esquisse', description: 'Études préliminaires et esquisse', percentage: 10 },
  { code: 'APS', name: 'Avant-Projet Sommaire', description: 'Études d\'avant-projet sommaire', percentage: 10 },
  { code: 'APD', name: 'Avant-Projet Définitif', description: 'Études d\'avant-projet définitif', percentage: 15 },
  { code: 'PRO', name: 'Projet', description: 'Études de projet', percentage: 20 },
  { code: 'DCE', name: 'DCE', description: 'Dossier de consultation des entreprises', percentage: 10 },
  { code: 'ACT', name: 'Passation des marchés', description: 'Assistance aux contrats de travaux', percentage: 5 },
  { code: 'VISA', name: 'Visa', description: 'Visa des études d\'exécution', percentage: 5 },
  { code: 'DET', name: 'Direction travaux', description: 'Direction de l\'exécution des travaux', percentage: 20 },
  { code: 'AOR', name: 'Réception', description: 'Assistance aux opérations de réception', percentage: 5 },
];

const INTERIOR_PHASES: DisciplinePhase[] = [
  { code: 'BRIEF', name: 'Brief', description: 'Analyse du brief et des besoins', percentage: 5 },
  { code: 'CONCEPT', name: 'Concept', description: 'Recherches et concept créatif', percentage: 15 },
  { code: 'APS', name: 'Avant-Projet', description: 'Développement avant-projet', percentage: 20 },
  { code: 'PRO', name: 'Projet', description: 'Plans d\'exécution et détails', percentage: 25 },
  { code: 'CONSULT', name: 'Consultation', description: 'Consultation des entreprises', percentage: 10 },
  { code: 'SUIVI', name: 'Suivi chantier', description: 'Suivi de réalisation', percentage: 20 },
  { code: 'LIVRAISON', name: 'Livraison', description: 'Réception et livraison', percentage: 5 },
];

const SCENOGRAPHY_PHASES: DisciplinePhase[] = [
  { code: 'BRIEF', name: 'Brief', description: 'Analyse du brief et intentions', percentage: 5 },
  { code: 'CONCEPT', name: 'Concept', description: 'Concept scénographique', percentage: 20 },
  { code: 'DEV', name: 'Développement', description: 'Développement du projet', percentage: 25 },
  { code: 'PROD', name: 'Production', description: 'Suivi de production', percentage: 20 },
  { code: 'MONTAGE', name: 'Montage', description: 'Montage sur site', percentage: 25 },
  { code: 'EXPLOIT', name: 'Exploitation', description: 'Suivi d\'exploitation', percentage: 5 },
];

const COMMUNICATION_PHASES: DisciplinePhase[] = [
  { code: 'BRIEF', name: 'Brief', description: 'Réception et analyse du brief', percentage: 10 },
  { code: 'STRAT', name: 'Stratégie', description: 'Recommandation stratégique', percentage: 15 },
  { code: 'CREA', name: 'Création', description: 'Création et conception', percentage: 25 },
  { code: 'PROD', name: 'Production', description: 'Production des livrables', percentage: 30 },
  { code: 'DIFFUSION', name: 'Diffusion', description: 'Mise en ligne et diffusion', percentage: 10 },
  { code: 'BILAN', name: 'Bilan', description: 'Analyse et bilan de campagne', percentage: 10 },
];

// ============================================
// Étapes pipeline CRM par discipline
// ============================================

const ARCHITECTURE_CRM_STAGES = [
  'Premier contact',
  'Visite',
  'Programme défini',
  'Proposition envoyée',
  'Négociation',
  'Signé',
  'Perdu',
];

const INTERIOR_CRM_STAGES = [
  'Premier contact',
  'Rencontre',
  'Brief reçu',
  'Proposition envoyée',
  'Négociation',
  'Signé',
  'Perdu',
];

const SCENOGRAPHY_CRM_STAGES = [
  'Appel d\'offres reçu',
  'Visite',
  'Proposition envoyée',
  'Présentation',
  'Négociation',
  'Lauréat',
  'Non retenu',
];

const COMMUNICATION_CRM_STAGES = [
  'Lead entrant',
  'Brief reçu',
  'Proposition envoyée',
  'Présentation',
  'Négociation',
  'Signé',
  'Perdu',
];

// ============================================
// Configuration complète par discipline
// ============================================

export const DISCIPLINE_CONFIGS: Record<DisciplineSlug, DisciplineConfig> = {
  architecture: {
    slug: 'architecture',
    name: 'Architecture',
    shortName: 'Archi',
    description: 'Projets de construction, réhabilitation, extension et permis de construire',
    icon: Building2,
    color: 'hsl(220, 70%, 50%)',
    terminology: ARCHITECTURE_TERMINOLOGY,
    projectTypes: ARCHITECTURE_PROJECT_TYPES,
    defaultPhases: ARCHITECTURE_PHASES,
    crmPipelineStages: ARCHITECTURE_CRM_STAGES,
    availableModules: ['projects', 'tasks', 'crm', 'documents', 'tenders', 'commercial', 'construction', 'time-tracking', 'resources', 'calendar', 'references'],
    recommendedModules: ['projects', 'tasks', 'crm', 'documents', 'tenders', 'commercial', 'construction'],
  },
  interior: {
    slug: 'interior',
    name: 'Architecture d\'intérieur',
    shortName: 'Intérieur',
    description: 'Aménagement, retail, résidentiel et hospitality',
    icon: Sofa,
    color: 'hsl(280, 70%, 50%)',
    terminology: INTERIOR_TERMINOLOGY,
    projectTypes: INTERIOR_PROJECT_TYPES,
    defaultPhases: INTERIOR_PHASES,
    crmPipelineStages: INTERIOR_CRM_STAGES,
    availableModules: ['projects', 'tasks', 'crm', 'documents', 'tenders', 'commercial', 'construction', 'time-tracking', 'resources', 'calendar', 'references', 'objects'],
    recommendedModules: ['projects', 'tasks', 'crm', 'documents', 'commercial', 'references', 'objects'],
  },
  scenography: {
    slug: 'scenography',
    name: 'Scénographie',
    shortName: 'Scéno',
    description: 'Expositions, muséographie, événementiel et stands',
    icon: Theater,
    color: 'hsl(340, 70%, 50%)',
    terminology: SCENOGRAPHY_TERMINOLOGY,
    projectTypes: SCENOGRAPHY_PROJECT_TYPES,
    defaultPhases: SCENOGRAPHY_PHASES,
    crmPipelineStages: SCENOGRAPHY_CRM_STAGES,
    availableModules: ['projects', 'tasks', 'crm', 'documents', 'tenders', 'commercial', 'time-tracking', 'resources', 'calendar', 'references', 'objects'],
    recommendedModules: ['projects', 'tasks', 'crm', 'documents', 'tenders', 'commercial', 'references'],
  },
  communication: {
    slug: 'communication',
    name: 'Agence de Communication',
    shortName: 'Comm',
    description: 'Campagnes, branding, digital et événementiel',
    icon: Megaphone,
    color: 'hsl(30, 70%, 50%)',
    terminology: COMMUNICATION_TERMINOLOGY,
    projectTypes: COMMUNICATION_PROJECT_TYPES,
    defaultPhases: COMMUNICATION_PHASES,
    crmPipelineStages: COMMUNICATION_CRM_STAGES,
    availableModules: ['projects', 'tasks', 'crm', 'documents', 'commercial', 'time-tracking', 'resources', 'calendar', 'campaigns', 'media-planning'],
    recommendedModules: ['projects', 'tasks', 'crm', 'documents', 'commercial', 'time-tracking', 'calendar', 'campaigns', 'media-planning'],
  },
};

// ============================================
// Helper functions
// ============================================

export function getDisciplineConfig(slug: DisciplineSlug): DisciplineConfig {
  return DISCIPLINE_CONFIGS[slug];
}

export function getDisciplineBySlug(slug: string): DisciplineConfig | undefined {
  return DISCIPLINE_CONFIGS[slug as DisciplineSlug];
}

export function getAllDisciplines(): DisciplineConfig[] {
  return Object.values(DISCIPLINE_CONFIGS);
}

export function getTerminology(slug: DisciplineSlug): DisciplineTerminology {
  return DISCIPLINE_CONFIGS[slug].terminology;
}

export function getDefaultPhases(slug: DisciplineSlug): DisciplinePhase[] {
  return DISCIPLINE_CONFIGS[slug].defaultPhases;
}

export function getProjectTypes(slug: DisciplineSlug): DisciplineProjectType[] {
  return DISCIPLINE_CONFIGS[slug].projectTypes;
}

export function isModuleAvailable(slug: DisciplineSlug, moduleKey: string): boolean {
  return DISCIPLINE_CONFIGS[slug].availableModules.includes(moduleKey);
}

export function isModuleRecommended(slug: DisciplineSlug, moduleKey: string): boolean {
  return DISCIPLINE_CONFIGS[slug].recommendedModules.includes(moduleKey);
}
