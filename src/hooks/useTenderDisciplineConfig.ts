import { useMemo } from "react";
import { useTender } from "./useTenders";
import { 
  getTenderDisciplineConfig, 
  type TenderDisciplineConfig,
  type DisciplineSlug,
  type TeamSpecialty,
  type RequiredDocumentDef,
  type CriterionTypeDef,
  type MemoireSectionDef,
} from "@/lib/tenderDisciplineConfig";

export interface UseTenderDisciplineConfigResult {
  config: TenderDisciplineConfig;
  disciplineSlug: DisciplineSlug;
  isLoading: boolean;
  
  // Accesseurs typés pour les listes
  teamSpecialties: TeamSpecialty[];
  candidatureDocuments: RequiredDocumentDef[];
  offreDocuments: RequiredDocumentDef[];
  criterionTypes: CriterionTypeDef[];
  memoireSections: MemoireSectionDef[];
  
  // Helpers
  getSpecialtyLabel: (value: string) => string;
  getDocumentLabel: (value: string) => string;
  getCriterionLabel: (value: string) => string;
  getSectionLabel: (value: string) => string;
}

/**
 * Hook pour récupérer la configuration de discipline d'un tender
 * @param tenderId - ID du tender (optionnel, utilisera 'architecture' par défaut)
 * @param disciplineSlugOverride - Permet de forcer une discipline (utile lors de la création)
 */
export function useTenderDisciplineConfig(
  tenderId?: string,
  disciplineSlugOverride?: DisciplineSlug
): UseTenderDisciplineConfigResult {
  const { data: tender, isLoading: tenderLoading } = useTender(tenderId);
  
  const disciplineSlug = useMemo(() => {
    if (disciplineSlugOverride) return disciplineSlugOverride;
    // Récupère le slug depuis le tender, ou utilise 'architecture' par défaut
    const slug = (tender as any)?.discipline_slug;
    return (slug || 'architecture') as DisciplineSlug;
  }, [tender, disciplineSlugOverride]);
  
  const config = useMemo(() => {
    return getTenderDisciplineConfig(disciplineSlug);
  }, [disciplineSlug]);
  
  // Helpers pour récupérer les labels
  const getSpecialtyLabel = useMemo(() => {
    const map = new Map(config.teamSpecialties.map(s => [s.value, s.label]));
    return (value: string) => map.get(value) || value;
  }, [config.teamSpecialties]);
  
  const getDocumentLabel = useMemo(() => {
    const allDocs = [...config.requiredDocuments.candidature, ...config.requiredDocuments.offre];
    const map = new Map(allDocs.map(d => [d.value, d.label]));
    return (value: string) => map.get(value) || value;
  }, [config.requiredDocuments]);
  
  const getCriterionLabel = useMemo(() => {
    const map = new Map(config.criterionTypes.map(c => [c.value, c.label]));
    return (value: string) => map.get(value) || value;
  }, [config.criterionTypes]);
  
  const getSectionLabel = useMemo(() => {
    const map = new Map(config.memoireSections.map(s => [s.value, s.label]));
    return (value: string) => map.get(value) || value;
  }, [config.memoireSections]);
  
  return {
    config,
    disciplineSlug,
    isLoading: tenderId ? tenderLoading : false,
    
    // Accesseurs directs
    teamSpecialties: config.teamSpecialties,
    candidatureDocuments: config.requiredDocuments.candidature,
    offreDocuments: config.requiredDocuments.offre,
    criterionTypes: config.criterionTypes,
    memoireSections: config.memoireSections,
    
    // Helpers
    getSpecialtyLabel,
    getDocumentLabel,
    getCriterionLabel,
    getSectionLabel,
  };
}

/**
 * Hook simplifié pour utiliser une config de discipline sans tender
 */
export function useDisciplineConfig(disciplineSlug: DisciplineSlug = 'architecture') {
  return useTenderDisciplineConfig(undefined, disciplineSlug);
}
