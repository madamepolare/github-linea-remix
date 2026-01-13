// ============================================
// Types unifiés pour le système de disciplines
// ============================================

import { LucideIcon } from "lucide-react";

// Slugs des disciplines disponibles
export type DisciplineSlug = 'architecture' | 'scenographie' | 'communication';

// ============================================
// Types génériques (terminologie, phases, projets)
// ============================================

export interface DisciplineTerminology {
  // Termes projet
  project: string;
  projects: string;
  phase: string;
  phases: string;
  lot: string;
  lots: string;
  chantier: string;
  
  // Termes clients
  client: string;
  clients: string;
  
  // Termes intervenants
  intervenant: string;
  intervenants: string;
  
  // Documents
  dce: string;
  devis: string;
  contrat: string;
  
  // Termes spécifiques tenders
  budget: string;
  surface: string;
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

// ============================================
// Types spécifiques aux Tenders
// ============================================

export interface TeamSpecialty {
  value: string;
  label: string;
  category?: string;
}

export interface RequiredDocumentDef {
  value: string;
  label: string;
  mandatory: boolean;
}

export interface RequiredDocuments {
  candidature: RequiredDocumentDef[];
  offre: RequiredDocumentDef[];
}

export interface CriterionTypeDef {
  value: string;
  label: string;
}

export interface MemoireSectionDef {
  value: string;
  label: string;
  description?: string;
}

export interface ClientTypeDef {
  value: string;
  label: string;
}

export interface ProcedureTypeDef {
  value: string;
  label: string;
}

export interface TeamRoleDef {
  value: string;
  label: string;
}

export interface DisciplineFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  unit?: string;
  options?: { value: string; label: string }[];
  section: 'general' | 'project' | 'financial' | 'procedure' | 'dates';
  required?: boolean;
}

export interface DisciplineMetricDef {
  key: string;
  label: string;
  icon: string;
  colorClass: string;
  formatType: 'currency' | 'number' | 'date' | 'text' | 'duration';
  unit?: string;
}

export interface DisciplineAIPrompts {
  dceAnalysis: string;
  memoireGeneration: string;
}

// ============================================
// Configuration des onglets Tender
// ============================================

export interface TenderTabDef {
  key: string;
  label: string;
  icon: string; // nom de l'icône Lucide
  component: string; // nom du composant à rendre
  visible: boolean;
  order: number;
}

export interface TenderSectionDef {
  key: string;
  label: string;
  fields: string[]; // champs à afficher dans cette section
  visible: boolean;
  order: number;
}

// Pour la page de synthèse : quels blocs afficher
export interface TenderSynthesisBlockDef {
  key: string;
  label: string;
  component: string; // 'budget' | 'honoraires' | 'accord_cadre' | 'exposition' | etc.
  visible: boolean;
  order: number;
}

// ============================================
// Configuration Tender complète
// ============================================

export interface TenderConfig {
  // === ONGLETS ===
  tabs: TenderTabDef[];
  
  // === BLOCS SYNTHÈSE ===
  synthesisBlocks: TenderSynthesisBlockDef[];
  
  // === SECTIONS FORMULAIRE ===
  formSections: TenderSectionDef[];
  
  // === ÉQUIPE ===
  teamSpecialties: TeamSpecialty[];
  teamRoles: TeamRoleDef[];
  
  // === DOCUMENTS ===
  requiredDocuments: RequiredDocuments;
  
  // === CRITÈRES & PROCÉDURES ===
  criterionTypes: CriterionTypeDef[];
  clientTypes: ClientTypeDef[];
  procedureTypes: ProcedureTypeDef[];
  
  // === MÉMOIRE TECHNIQUE ===
  memoireSections: MemoireSectionDef[];
  
  // === CHAMPS SPÉCIFIQUES ===
  specificFields: DisciplineFieldDef[];
  
  // === MÉTRIQUES SYNTHÈSE ===
  keyMetrics: DisciplineMetricDef[];
  
  // === IA ===
  aiPrompts: DisciplineAIPrompts;
}

// ============================================
// Configuration Projets complète
// ============================================

export interface ProjectConfig {
  phases: DisciplinePhase[];
  projectTypes: DisciplineProjectType[];
}

// ============================================
// Configuration CRM
// ============================================

export interface CRMConfig {
  pipelineStages: string[];
}

// ============================================
// Configuration commerciale
// ============================================

export interface CommercialConfig {
  defaultHourlyRate?: number;
  defaultDailyRate?: number;
  vatRates: number[];
}

// ============================================
// DÉFINITION COMPLÈTE D'UNE DISCIPLINE
// ============================================

export interface DisciplineDefinition {
  // === Identité ===
  slug: DisciplineSlug;
  name: string;
  shortName: string;
  description: string;
  icon: LucideIcon;
  color: string;
  
  // === Terminologie ===
  terminology: DisciplineTerminology;
  
  // === Modules ===
  availableModules: string[];
  recommendedModules: string[];
  
  // === Configurations par module ===
  tenders: TenderConfig;
  projects: ProjectConfig;
  crm: CRMConfig;
  commercial: CommercialConfig;
}

// ============================================
// Types utilitaires
// ============================================

export type DisciplineRegistry = Record<DisciplineSlug, DisciplineDefinition>;

// Type pour les overrides workspace (SaaS)
export interface WorkspaceDisciplineOverrides {
  // Champs cachés
  hiddenFields?: string[];
  
  // Documents personnalisés
  customDocuments?: RequiredDocumentDef[];
  
  // Critères personnalisés
  customCriteria?: CriterionTypeDef[];
  
  // Prompts IA personnalisés
  customAIPrompts?: Partial<DisciplineAIPrompts>;
  
  // Spécialités personnalisées
  customSpecialties?: TeamSpecialty[];
}
