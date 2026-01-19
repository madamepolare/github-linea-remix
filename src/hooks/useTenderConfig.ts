/**
 * Hook unifié pour la configuration des tenders
 * Remplace et unifie useTenderDisciplineConfig + useWorkspaceTenderConfig
 * Fournit un accès centralisé à toutes les configurations par discipline
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTender } from "./useTenders";
import { 
  getDiscipline, 
  type DisciplineSlug,
  type TenderConfig,
  type TenderTabDef,
  type TenderSynthesisBlockDef,
  type TenderSectionDef,
  type TeamSpecialty,
  type CriterionTypeDef,
  type MemoireSectionDef,
  type ClientTypeDef,
  type ProcedureTypeDef,
  type TeamRoleDef,
  type DisciplineFieldDef,
  type DisciplineMetricDef,
} from "@/lib/disciplines";

// Type for required documents
interface RequiredDocItem {
  value: string;
  label: string;
  mandatory: boolean;
}

interface RequiredDocuments {
  candidature: RequiredDocItem[];
  offre: RequiredDocItem[];
}

// =============================================
// TYPES
// =============================================

export interface WorkspaceTenderOverrides {
  hidden_team_specialties?: string[];
  custom_team_specialties?: TeamSpecialty[];
  hidden_document_types?: string[];
  custom_document_types?: {
    candidature?: { value: string; label: string; mandatory: boolean }[];
    offre?: { value: string; label: string; mandatory: boolean }[];
  };
  hidden_criterion_types?: string[];
  custom_criterion_types?: { value: string; label: string }[];
  hidden_memoire_sections?: string[];
  custom_memoire_sections?: { value: string; label: string; description?: string }[];
  custom_ai_prompts?: {
    dceAnalysis?: string;
    memoireGeneration?: string;
  };
  default_field_values?: Record<string, any>;
}

export interface MergedTenderConfig extends TenderConfig {
  hasCustomizations: boolean;
  disciplineSlug: DisciplineSlug;
  disciplineName: string;
}

// =============================================
// HELPERS
// =============================================

function mergeConfigs(
  baseConfig: TenderConfig,
  overrides: WorkspaceTenderOverrides | null,
  disciplineSlug: DisciplineSlug,
  disciplineName: string
): MergedTenderConfig {
  if (!overrides) {
    return {
      ...baseConfig,
      hasCustomizations: false,
      disciplineSlug,
      disciplineName,
    };
  }

  // Merge team specialties
  const teamSpecialties = baseConfig.teamSpecialties
    .filter(s => !overrides.hidden_team_specialties?.includes(s.value))
    .concat(overrides.custom_team_specialties || []);

  // Merge required documents
  const requiredDocuments: RequiredDocuments = {
    candidature: baseConfig.requiredDocuments.candidature
      .filter(d => !overrides.hidden_document_types?.includes(d.value))
      .concat(overrides.custom_document_types?.candidature || []),
    offre: baseConfig.requiredDocuments.offre
      .filter(d => !overrides.hidden_document_types?.includes(d.value))
      .concat(overrides.custom_document_types?.offre || []),
  };

  // Merge criterion types
  const criterionTypes = baseConfig.criterionTypes
    .filter(c => !overrides.hidden_criterion_types?.includes(c.value))
    .concat(overrides.custom_criterion_types || []);

  // Merge memoir sections
  const memoireSections = baseConfig.memoireSections
    .filter(s => !overrides.hidden_memoire_sections?.includes(s.value))
    .concat(overrides.custom_memoire_sections || []);

  // Merge AI prompts (custom prompts override base)
  const aiPrompts = {
    dceAnalysis: overrides.custom_ai_prompts?.dceAnalysis || baseConfig.aiPrompts.dceAnalysis,
    memoireGeneration: overrides.custom_ai_prompts?.memoireGeneration || baseConfig.aiPrompts.memoireGeneration,
  };

  return {
    ...baseConfig,
    teamSpecialties,
    requiredDocuments,
    criterionTypes,
    memoireSections,
    aiPrompts,
    hasCustomizations: true,
    disciplineSlug,
    disciplineName,
  };
}

// =============================================
// MAIN HOOK
// =============================================

export interface UseTenderConfigResult {
  // Configuration complète
  config: MergedTenderConfig;
  isLoading: boolean;
  
  // Discipline info
  disciplineSlug: DisciplineSlug;
  disciplineName: string;
  
  // Accesseurs directs pour les listes
  tabs: TenderTabDef[];
  synthesisBlocks: TenderSynthesisBlockDef[];
  formSections: TenderSectionDef[];
  teamSpecialties: TeamSpecialty[];
  candidatureDocuments: RequiredDocuments['candidature'];
  offreDocuments: RequiredDocuments['offre'];
  criterionTypes: CriterionTypeDef[];
  memoireSections: MemoireSectionDef[];
  clientTypes: ClientTypeDef[];
  procedureTypes: ProcedureTypeDef[];
  teamRoles: TeamRoleDef[];
  specificFields: DisciplineFieldDef[];
  keyMetrics: DisciplineMetricDef[];
  aiPrompts: TenderConfig['aiPrompts'];
  
  // Helpers pour récupérer les labels
  getSpecialtyLabel: (value: string) => string;
  getDocumentLabel: (value: string) => string;
  getCriterionLabel: (value: string) => string;
  getSectionLabel: (value: string) => string;
  getClientTypeLabel: (value: string) => string;
  getProcedureTypeLabel: (value: string) => string;
  
  // Helpers pour vérifier la visibilité
  isTabVisible: (tabKey: string) => boolean;
  isBlockVisible: (blockKey: string) => boolean;
  
  // Helper pour récupérer un composant
  getTabComponent: (tabKey: string) => string | null;
  getBlockComponent: (blockKey: string) => string | null;
}

/**
 * Hook principal pour récupérer la configuration d'un tender
 * @param tenderId - ID du tender (optionnel)
 * @param disciplineSlugOverride - Force une discipline spécifique (utile lors de la création)
 */
export function useTenderConfig(
  tenderId?: string,
  disciplineSlugOverride?: DisciplineSlug
): UseTenderConfigResult {
  const { activeWorkspace } = useAuth();
  const { data: tender, isLoading: tenderLoading } = useTender(tenderId);
  
  // Déterminer la discipline
  const disciplineSlug = useMemo<DisciplineSlug>(() => {
    if (disciplineSlugOverride) return disciplineSlugOverride;
    const slug = (tender as any)?.discipline_slug;
    return (slug || 'architecture') as DisciplineSlug;
  }, [tender, disciplineSlugOverride]);

  // Récupérer la configuration de base depuis le registre
  const discipline = useMemo(() => getDiscipline(disciplineSlug), [disciplineSlug]);
  const baseConfig = discipline.tenders;
  const disciplineName = discipline.name;

  // Récupérer les surcharges workspace - pour l'instant on retourne null (table peut ne pas exister)
  const overrides: WorkspaceTenderOverrides | null = null;
  const overridesLoading = false;

  // Fusionner les configurations
  const mergedConfig = useMemo(() => {
    return mergeConfigs(baseConfig, overrides || null, disciplineSlug, disciplineName);
  }, [baseConfig, overrides, disciplineSlug, disciplineName]);

  // Helpers pour récupérer les labels
  const getSpecialtyLabel = useMemo(() => {
    const map = new Map(mergedConfig.teamSpecialties.map(s => [s.value, s.label]));
    return (value: string) => map.get(value) || value;
  }, [mergedConfig.teamSpecialties]);

  const getDocumentLabel = useMemo(() => {
    const allDocs = [...mergedConfig.requiredDocuments.candidature, ...mergedConfig.requiredDocuments.offre];
    const map = new Map(allDocs.map(d => [d.value, d.label]));
    return (value: string) => map.get(value) || value;
  }, [mergedConfig.requiredDocuments]);

  const getCriterionLabel = useMemo(() => {
    const map = new Map(mergedConfig.criterionTypes.map(c => [c.value, c.label]));
    return (value: string) => map.get(value) || value;
  }, [mergedConfig.criterionTypes]);

  const getSectionLabel = useMemo(() => {
    const map = new Map(mergedConfig.memoireSections.map(s => [s.value, s.label]));
    return (value: string) => map.get(value) || value;
  }, [mergedConfig.memoireSections]);

  const getClientTypeLabel = useMemo(() => {
    const map = new Map(mergedConfig.clientTypes.map(c => [c.value, c.label]));
    return (value: string) => map.get(value) || value;
  }, [mergedConfig.clientTypes]);

  const getProcedureTypeLabel = useMemo(() => {
    const map = new Map(mergedConfig.procedureTypes.map(p => [p.value, p.label]));
    return (value: string) => map.get(value) || value;
  }, [mergedConfig.procedureTypes]);

  // Helpers pour vérifier la visibilité
  const isTabVisible = useMemo(() => {
    const visibleTabs = new Set(
      mergedConfig.tabs.filter(t => t.visible).map(t => t.key)
    );
    return (tabKey: string) => visibleTabs.has(tabKey);
  }, [mergedConfig.tabs]);

  const isBlockVisible = useMemo(() => {
    const visibleBlocks = new Set(
      mergedConfig.synthesisBlocks.filter(b => b.visible).map(b => b.key)
    );
    return (blockKey: string) => visibleBlocks.has(blockKey);
  }, [mergedConfig.synthesisBlocks]);

  // Helpers pour récupérer les composants
  const getTabComponent = useMemo(() => {
    const map = new Map(mergedConfig.tabs.map(t => [t.key, t.component]));
    return (tabKey: string) => map.get(tabKey) || null;
  }, [mergedConfig.tabs]);

  const getBlockComponent = useMemo(() => {
    const map = new Map(mergedConfig.synthesisBlocks.map(b => [b.key, b.component]));
    return (blockKey: string) => map.get(blockKey) || null;
  }, [mergedConfig.synthesisBlocks]);

  // Listes triées
  const sortedTabs = useMemo(() => 
    [...mergedConfig.tabs].filter(t => t.visible).sort((a, b) => a.order - b.order),
    [mergedConfig.tabs]
  );

  const sortedBlocks = useMemo(() => 
    [...mergedConfig.synthesisBlocks].filter(b => b.visible).sort((a, b) => a.order - b.order),
    [mergedConfig.synthesisBlocks]
  );

  const sortedSections = useMemo(() => 
    [...mergedConfig.formSections].filter(s => s.visible).sort((a, b) => a.order - b.order),
    [mergedConfig.formSections]
  );

  return {
    config: mergedConfig,
    isLoading: (tenderId ? tenderLoading : false) || overridesLoading,
    
    disciplineSlug,
    disciplineName,
    
    // Accesseurs directs
    tabs: sortedTabs,
    synthesisBlocks: sortedBlocks,
    formSections: sortedSections,
    teamSpecialties: mergedConfig.teamSpecialties,
    candidatureDocuments: mergedConfig.requiredDocuments.candidature,
    offreDocuments: mergedConfig.requiredDocuments.offre,
    criterionTypes: mergedConfig.criterionTypes,
    memoireSections: mergedConfig.memoireSections,
    clientTypes: mergedConfig.clientTypes,
    procedureTypes: mergedConfig.procedureTypes,
    teamRoles: mergedConfig.teamRoles,
    specificFields: mergedConfig.specificFields,
    keyMetrics: mergedConfig.keyMetrics,
    aiPrompts: mergedConfig.aiPrompts,
    
    // Helpers
    getSpecialtyLabel,
    getDocumentLabel,
    getCriterionLabel,
    getSectionLabel,
    getClientTypeLabel,
    getProcedureTypeLabel,
    isTabVisible,
    isBlockVisible,
    getTabComponent,
    getBlockComponent,
  };
}

/**
 * Hook simplifié pour utiliser une config de discipline sans tender
 */
export function useDisciplineTenderConfig(disciplineSlug: DisciplineSlug = 'architecture') {
  return useTenderConfig(undefined, disciplineSlug);
}
