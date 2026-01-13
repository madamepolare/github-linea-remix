// ============================================
// Registry central des disciplines
// Point d'entrée unique pour toutes les configurations
// ============================================

import type { 
  DisciplineSlug, 
  DisciplineDefinition, 
  DisciplineRegistry,
  DisciplineTerminology,
  TenderConfig,
  ProjectConfig,
  CRMConfig,
  TeamSpecialty,
  RequiredDocumentDef,
  CriterionTypeDef,
  MemoireSectionDef,
  ClientTypeDef,
  ProcedureTypeDef,
  TeamRoleDef,
  DisciplineFieldDef,
  DisciplineMetricDef,
  DisciplinePhase,
  DisciplineProjectType,
} from "./types";

// Export des configurations individuelles
export { ARCHITECTURE_DISCIPLINE } from "./architecture";
export { SCENOGRAPHIE_DISCIPLINE } from "./scenographie";
export { COMMUNICATION_DISCIPLINE } from "./communication";

// Import pour le registry
import { ARCHITECTURE_DISCIPLINE } from "./architecture";
import { SCENOGRAPHIE_DISCIPLINE } from "./scenographie";
import { COMMUNICATION_DISCIPLINE } from "./communication";

// Re-export des types
export type {
  DisciplineSlug,
  DisciplineDefinition,
  DisciplineRegistry,
  DisciplineTerminology,
  TenderConfig,
  ProjectConfig,
  CRMConfig,
  TeamSpecialty,
  RequiredDocumentDef,
  CriterionTypeDef,
  MemoireSectionDef,
  ClientTypeDef,
  ProcedureTypeDef,
  TeamRoleDef,
  DisciplineFieldDef,
  DisciplineMetricDef,
  DisciplinePhase,
  DisciplineProjectType,
};

// ============================================
// REGISTRY PRINCIPAL
// ============================================

export const DISCIPLINE_REGISTRY: DisciplineRegistry = {
  architecture: ARCHITECTURE_DISCIPLINE,
  scenographie: SCENOGRAPHIE_DISCIPLINE,
  communication: COMMUNICATION_DISCIPLINE,
};

// Liste ordonnée des disciplines
export const DISCIPLINE_ORDER: DisciplineSlug[] = ['architecture', 'scenographie', 'communication'];

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Récupère la définition complète d'une discipline
 */
export function getDiscipline(slug: DisciplineSlug): DisciplineDefinition {
  return DISCIPLINE_REGISTRY[slug];
}

/**
 * Récupère la définition d'une discipline par son slug (avec fallback)
 */
export function getDisciplineBySlug(slug: string): DisciplineDefinition {
  const validSlug = isDisciplineValid(slug) ? slug : 'architecture';
  return DISCIPLINE_REGISTRY[validSlug];
}

/**
 * Vérifie si un slug est valide
 */
export function isDisciplineValid(slug: string): slug is DisciplineSlug {
  return slug in DISCIPLINE_REGISTRY;
}

/**
 * Retourne toutes les disciplines
 */
export function getAllDisciplines(): DisciplineDefinition[] {
  return DISCIPLINE_ORDER.map(slug => DISCIPLINE_REGISTRY[slug]);
}

/**
 * Retourne les disciplines disponibles sous forme de liste pour les sélecteurs
 */
export function getDisciplineOptions(): Array<{
  slug: DisciplineSlug;
  name: string;
  shortName: string;
  description: string;
  color: string;
}> {
  return getAllDisciplines().map(d => ({
    slug: d.slug,
    name: d.name,
    shortName: d.shortName,
    description: d.description,
    color: d.color,
  }));
}

// ============================================
// ACCESSEURS PAR MODULE
// ============================================

/**
 * Récupère la terminologie d'une discipline
 */
export function getTerminology(slug: DisciplineSlug): DisciplineTerminology {
  return DISCIPLINE_REGISTRY[slug].terminology;
}

/**
 * Récupère la configuration Tenders d'une discipline
 */
export function getTenderConfig(slug: DisciplineSlug): TenderConfig {
  return DISCIPLINE_REGISTRY[slug].tenders;
}

/**
 * Récupère la configuration Projets d'une discipline
 */
export function getProjectConfig(slug: DisciplineSlug): ProjectConfig {
  return DISCIPLINE_REGISTRY[slug].projects;
}

/**
 * Récupère la configuration CRM d'une discipline
 */
export function getCRMConfig(slug: DisciplineSlug): CRMConfig {
  return DISCIPLINE_REGISTRY[slug].crm;
}

/**
 * Récupère les phases par défaut d'une discipline
 */
export function getDefaultPhases(slug: DisciplineSlug): DisciplinePhase[] {
  return DISCIPLINE_REGISTRY[slug].projects.phases;
}

/**
 * Récupère les types de projets d'une discipline
 */
export function getProjectTypes(slug: DisciplineSlug): DisciplineProjectType[] {
  return DISCIPLINE_REGISTRY[slug].projects.projectTypes;
}

// ============================================
// ACCESSEURS TENDERS SPÉCIFIQUES
// ============================================

/**
 * Récupère les spécialités d'équipe pour les tenders
 */
export function getTeamSpecialties(slug: DisciplineSlug): TeamSpecialty[] {
  return DISCIPLINE_REGISTRY[slug].tenders.teamSpecialties;
}

/**
 * Récupère les documents requis pour les tenders
 */
export function getRequiredDocuments(slug: DisciplineSlug): {
  candidature: RequiredDocumentDef[];
  offre: RequiredDocumentDef[];
} {
  return DISCIPLINE_REGISTRY[slug].tenders.requiredDocuments;
}

/**
 * Récupère les types de critères pour les tenders
 */
export function getCriterionTypes(slug: DisciplineSlug): CriterionTypeDef[] {
  return DISCIPLINE_REGISTRY[slug].tenders.criterionTypes;
}

/**
 * Récupère les sections du mémoire technique
 */
export function getMemoireSections(slug: DisciplineSlug): MemoireSectionDef[] {
  return DISCIPLINE_REGISTRY[slug].tenders.memoireSections;
}

/**
 * Récupère les types de clients
 */
export function getClientTypes(slug: DisciplineSlug): ClientTypeDef[] {
  return DISCIPLINE_REGISTRY[slug].tenders.clientTypes;
}

/**
 * Récupère les types de procédures
 */
export function getProcedureTypes(slug: DisciplineSlug): ProcedureTypeDef[] {
  return DISCIPLINE_REGISTRY[slug].tenders.procedureTypes;
}

/**
 * Récupère les rôles d'équipe
 */
export function getTeamRoles(slug: DisciplineSlug): TeamRoleDef[] {
  return DISCIPLINE_REGISTRY[slug].tenders.teamRoles;
}

/**
 * Récupère les champs spécifiques
 */
export function getSpecificFields(slug: DisciplineSlug): DisciplineFieldDef[] {
  return DISCIPLINE_REGISTRY[slug].tenders.specificFields;
}

/**
 * Récupère les métriques clés pour la synthèse
 */
export function getKeyMetrics(slug: DisciplineSlug): DisciplineMetricDef[] {
  return DISCIPLINE_REGISTRY[slug].tenders.keyMetrics;
}

/**
 * Récupère les prompts IA
 */
export function getAIPrompts(slug: DisciplineSlug): { dceAnalysis: string; memoireGeneration: string } {
  return DISCIPLINE_REGISTRY[slug].tenders.aiPrompts;
}

// ============================================
// HELPERS DE RECHERCHE
// ============================================

/**
 * Récupère le label d'une spécialité
 */
export function getSpecialtyLabel(slug: DisciplineSlug, value: string): string {
  const specialty = DISCIPLINE_REGISTRY[slug].tenders.teamSpecialties.find(s => s.value === value);
  return specialty?.label || value;
}

/**
 * Récupère le label d'un document
 */
export function getDocumentLabel(slug: DisciplineSlug, value: string): string {
  const docs = DISCIPLINE_REGISTRY[slug].tenders.requiredDocuments;
  const allDocs = [...docs.candidature, ...docs.offre];
  const doc = allDocs.find(d => d.value === value);
  return doc?.label || value;
}

/**
 * Récupère le label d'un critère
 */
export function getCriterionLabel(slug: DisciplineSlug, value: string): string {
  const criterion = DISCIPLINE_REGISTRY[slug].tenders.criterionTypes.find(c => c.value === value);
  return criterion?.label || value;
}

/**
 * Récupère le label d'une section de mémoire
 */
export function getSectionLabel(slug: DisciplineSlug, value: string): string {
  const section = DISCIPLINE_REGISTRY[slug].tenders.memoireSections.find(s => s.value === value);
  return section?.label || value;
}

/**
 * Récupère le label d'un type de client
 */
export function getClientTypeLabel(slug: DisciplineSlug, value: string): string {
  const clientType = DISCIPLINE_REGISTRY[slug].tenders.clientTypes.find(c => c.value === value);
  return clientType?.label || value;
}

/**
 * Récupère le label d'une procédure
 */
export function getProcedureTypeLabel(slug: DisciplineSlug, value: string): string {
  const procedureType = DISCIPLINE_REGISTRY[slug].tenders.procedureTypes.find(p => p.value === value);
  return procedureType?.label || value;
}

// ============================================
// VÉRIFICATIONS MODULES
// ============================================

/**
 * Vérifie si un module est disponible pour une discipline
 */
export function isModuleAvailable(slug: DisciplineSlug, moduleKey: string): boolean {
  return DISCIPLINE_REGISTRY[slug].availableModules.includes(moduleKey);
}

/**
 * Vérifie si un module est recommandé pour une discipline
 */
export function isModuleRecommended(slug: DisciplineSlug, moduleKey: string): boolean {
  return DISCIPLINE_REGISTRY[slug].recommendedModules.includes(moduleKey);
}
