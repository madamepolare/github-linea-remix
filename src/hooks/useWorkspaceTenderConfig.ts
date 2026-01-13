import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getDiscipline, 
  getTenderConfig,
  type DisciplineSlug,
  type DisciplineDefinition,
  type TenderConfig,
  type TeamSpecialty,
  type RequiredDocumentDef,
  type CriterionTypeDef,
  type DisciplineFieldDef,
  type ClientTypeDef,
  type ProcedureTypeDef,
} from "@/lib/disciplines";

// Types for workspace overrides stored in DB
export interface WorkspaceTenderOverrides {
  hidden_fields?: string[];
  custom_fields?: DisciplineFieldDef[];
  custom_team_specialties?: TeamSpecialty[];
  hidden_team_specialties?: string[];
  custom_document_types?: RequiredDocumentDef[];
  hidden_document_types?: string[];
  custom_criterion_types?: CriterionTypeDef[];
  custom_client_types?: ClientTypeDef[];
  custom_procedure_types?: ProcedureTypeDef[];
  custom_ai_prompts?: {
    dceAnalysis?: string;
    memoireGeneration?: string;
  };
  default_values?: Record<string, unknown>;
}

// Merged config type
export interface MergedTenderConfig extends TenderConfig {
  hasCustomizations: boolean;
  disciplineSlug: DisciplineSlug;
  disciplineName: string;
}

// Fetch workspace tender config from DB
async function fetchWorkspaceTenderConfig(
  workspaceId: string,
  disciplineSlug: DisciplineSlug
): Promise<WorkspaceTenderOverrides | null> {
  const { data, error } = await supabase
    .from('workspace_settings')
    .select('setting_value')
    .eq('workspace_id', workspaceId)
    .eq('setting_type', 'tender_discipline_config')
    .eq('setting_key', disciplineSlug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching workspace tender config:', error);
    return null;
  }

  return data?.setting_value as WorkspaceTenderOverrides | null;
}

// Merge base config with workspace overrides
function mergeConfigs(
  baseConfig: TenderConfig,
  discipline: DisciplineDefinition,
  overrides: WorkspaceTenderOverrides | null
): MergedTenderConfig {
  if (!overrides) {
    return {
      ...baseConfig,
      hasCustomizations: false,
      disciplineSlug: discipline.slug,
      disciplineName: discipline.name,
    };
  }

  // Filter out hidden fields
  const filteredSpecificFields = baseConfig.specificFields.filter(
    f => !overrides.hidden_fields?.includes(f.key)
  );

  // Filter out hidden team specialties
  const filteredTeamSpecialties = baseConfig.teamSpecialties.filter(
    s => !overrides.hidden_team_specialties?.includes(s.value)
  );

  // Filter out hidden document types
  const filteredCandidatureDocs = baseConfig.requiredDocuments.candidature.filter(
    d => !overrides.hidden_document_types?.includes(d.value)
  );
  const filteredOffreDocs = baseConfig.requiredDocuments.offre.filter(
    d => !overrides.hidden_document_types?.includes(d.value)
  );

  // Merge custom documents by phase
  const customCandidatureDocs = overrides.custom_document_types?.filter(d => {
    // Custom docs don't have phase, add to candidature by default
    return true;
  }) || [];

  return {
    ...baseConfig,
    // Merge team specialties
    teamSpecialties: [
      ...filteredTeamSpecialties,
      ...(overrides.custom_team_specialties || []),
    ],
    // Merge required documents
    requiredDocuments: {
      candidature: [
        ...filteredCandidatureDocs,
        ...customCandidatureDocs,
      ],
      offre: filteredOffreDocs,
    },
    // Merge criterion types
    criterionTypes: [
      ...baseConfig.criterionTypes,
      ...(overrides.custom_criterion_types || []),
    ],
    // Merge client types
    clientTypes: overrides.custom_client_types || baseConfig.clientTypes,
    // Merge procedure types
    procedureTypes: overrides.custom_procedure_types || baseConfig.procedureTypes,
    // Merge specific fields
    specificFields: [
      ...filteredSpecificFields,
      ...(overrides.custom_fields || []),
    ],
    // Override AI prompts if provided
    aiPrompts: {
      dceAnalysis: overrides.custom_ai_prompts?.dceAnalysis || baseConfig.aiPrompts.dceAnalysis,
      memoireGeneration: overrides.custom_ai_prompts?.memoireGeneration || baseConfig.aiPrompts.memoireGeneration,
    },
    hasCustomizations: true,
    disciplineSlug: discipline.slug,
    disciplineName: discipline.name,
  };
}

/**
 * Hook to get the merged tender configuration for a discipline
 * Combines the default discipline config with any workspace-level customizations
 */
export function useWorkspaceTenderConfig(disciplineSlug: DisciplineSlug) {
  const { activeWorkspace } = useAuth();
  const workspaceId = activeWorkspace?.id;

  const {
    data: overrides,
    isLoading: isLoadingOverrides,
  } = useQuery({
    queryKey: ['workspace-tender-config', workspaceId, disciplineSlug],
    queryFn: () => fetchWorkspaceTenderConfig(workspaceId!, disciplineSlug),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });

  const discipline = getDiscipline(disciplineSlug);
  const baseConfig = getTenderConfig(disciplineSlug);

  const mergedConfig = mergeConfigs(baseConfig, discipline, overrides ?? null);

  return {
    config: mergedConfig,
    discipline,
    isLoading: isLoadingOverrides,
    hasCustomizations: mergedConfig.hasCustomizations,
  };
}

/**
 * Hook to get tender config for the current workspace's discipline
 */
export function useCurrentWorkspaceTenderConfig() {
  const { activeWorkspace } = useAuth();
  
  // Get discipline from workspace
  const { data: workspaceData } = useQuery({
    queryKey: ['workspace-discipline', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;
      const { data, error } = await supabase
        .from('workspaces')
        .select('discipline_id, disciplines(slug)')
        .eq('id', activeWorkspace.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id,
  });

  const disciplineSlug = (workspaceData?.disciplines as { slug?: string })?.slug as DisciplineSlug || 'architecture';

  return useWorkspaceTenderConfig(disciplineSlug);
}

/**
 * Get field visibility for a tender form based on discipline
 */
export function useFieldVisibility(disciplineSlug: DisciplineSlug) {
  const { config } = useWorkspaceTenderConfig(disciplineSlug);

  const isFieldVisible = (fieldKey: string): boolean => {
    const field = config.specificFields.find(f => f.key === fieldKey);
    return field !== undefined || isCommonField(fieldKey);
  };

  const isFieldRequired = (fieldKey: string): boolean => {
    const field = config.specificFields.find(f => f.key === fieldKey);
    return field?.required ?? false;
  };

  const getFieldLabel = (fieldKey: string, defaultLabel: string): string => {
    const field = config.specificFields.find(f => f.key === fieldKey);
    return field?.label ?? defaultLabel;
  };

  return {
    isFieldVisible,
    isFieldRequired,
    getFieldLabel,
  };
}

// Common fields visible across all disciplines
const COMMON_FIELDS = [
  'title', 'reference', 'client_name', 'client_type', 
  'submission_deadline', 'procedure_type', 'description',
  'dce_link', 'status', 'pipeline_status'
];

function isCommonField(fieldKey: string): boolean {
  return COMMON_FIELDS.includes(fieldKey);
}

/**
 * Get key metrics for tender synthesis display
 */
export function useTenderMetrics(disciplineSlug: DisciplineSlug) {
  const { config } = useWorkspaceTenderConfig(disciplineSlug);
  
  return {
    metrics: config.keyMetrics,
    getMetricValue: (tender: Record<string, unknown>, metricKey: string) => {
      const metric = config.keyMetrics.find(m => m.key === metricKey);
      if (!metric) return null;
      
      const value = tender[metricKey];
      if (value === null || value === undefined) return null;
      
      // Format based on formatType
      switch (metric.formatType) {
        case 'currency':
          return new Intl.NumberFormat('fr-FR', { 
            style: 'currency', 
            currency: 'EUR',
            maximumFractionDigits: 0 
          }).format(value as number);
        case 'number':
          return String(value);
        case 'duration':
          return `${value}${metric.unit ? ' ' + metric.unit : ''}`;
        case 'date':
          return new Date(value as string).toLocaleDateString('fr-FR');
        default:
          return String(value);
      }
    },
  };
}
