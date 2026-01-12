import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

// ============= TYPES =============

export interface TenderPhaseTemplate {
  id: string;
  name: string;
  duration_days: number;
  is_default: boolean;
  sort_order: number;
}

export interface TenderReminderConfig {
  enabled: boolean;
  days_before: number[];
}

export interface TenderCriterionTemplate {
  id: string;
  name: string;
  type: 'price' | 'technical' | 'delay' | 'environmental' | 'social' | 'creativity' | 'methodology';
  default_weight: number;
  is_default: boolean;
}

export interface TenderLotDomainTemplate {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_default: boolean;
}

export interface TenderPipelineColumn {
  id: string;
  name: string;
  color: string;
  is_visible: boolean;
  sort_order: number;
}

export interface TenderSettings {
  // Phases par défaut
  default_phases: TenderPhaseTemplate[];
  
  // Configuration des rappels
  validity_reminder: TenderReminderConfig;
  submission_reminder: TenderReminderConfig;
  
  // Critères de notation par défaut
  default_criteria: TenderCriterionTemplate[];
  
  // Domaines/lots types
  default_lot_domains: TenderLotDomainTemplate[];
  
  // Colonnes pipeline
  pipeline_columns: TenderPipelineColumn[];
  
  // Autres configurations
  default_offer_validity_days: number;
  auto_create_tasks_for_case_study: boolean;
}

// ============= DEFAULTS =============

const DEFAULT_PHASES: TenderPhaseTemplate[] = [
  { id: 'candidature', name: 'Candidature', duration_days: 30, is_default: true, sort_order: 0 },
  { id: 'offre', name: 'Offre', duration_days: 45, is_default: true, sort_order: 1 },
  { id: 'negociation', name: 'Négociation', duration_days: 14, is_default: false, sort_order: 2 },
  { id: 'attribution', name: 'Attribution', duration_days: 30, is_default: false, sort_order: 3 },
];

const DEFAULT_CRITERIA: TenderCriterionTemplate[] = [
  { id: 'prix', name: 'Prix', type: 'price', default_weight: 40, is_default: true },
  { id: 'technique', name: 'Valeur technique', type: 'technical', default_weight: 40, is_default: true },
  { id: 'delai', name: 'Délais', type: 'delay', default_weight: 10, is_default: true },
  { id: 'environnement', name: 'Développement durable', type: 'environmental', default_weight: 10, is_default: false },
  { id: 'creativite', name: 'Créativité', type: 'creativity', default_weight: 20, is_default: false },
  { id: 'methodologie', name: 'Méthodologie', type: 'methodology', default_weight: 15, is_default: false },
];

const DEFAULT_LOT_DOMAINS: TenderLotDomainTemplate[] = [
  { id: 'graphisme', name: 'Graphisme', description: 'Création graphique, identité visuelle', color: '#8B5CF6', is_default: true },
  { id: 'impression', name: 'Impression', description: 'Impression papier, PLV', color: '#F59E0B', is_default: true },
  { id: 'digital', name: 'Digital', description: 'Web, applications, réseaux sociaux', color: '#3B82F6', is_default: true },
  { id: 'evenementiel', name: 'Événementiel', description: 'Événements, stands, salons', color: '#EC4899', is_default: true },
  { id: 'video', name: 'Vidéo / Motion', description: 'Production audiovisuelle, motion design', color: '#EF4444', is_default: false },
  { id: 'strategie', name: 'Stratégie', description: 'Conseil, stratégie de communication', color: '#10B981', is_default: false },
  { id: 'rp', name: 'Relations Presse', description: 'RP, influence, média training', color: '#6366F1', is_default: false },
  { id: 'signalétique', name: 'Signalétique', description: 'Signalétique, habillage', color: '#14B8A6', is_default: false },
];

const DEFAULT_PIPELINE_COLUMNS: TenderPipelineColumn[] = [
  { id: 'a_approuver', name: 'À approuver', color: '#f59e0b', is_visible: true, sort_order: 0 },
  { id: 'en_cours', name: 'En cours', color: '#3b82f6', is_visible: true, sort_order: 1 },
  { id: 'deposes', name: 'Déposés', color: '#10b981', is_visible: true, sort_order: 2 },
  { id: 'archives', name: 'Archivés', color: '#6b7280', is_visible: true, sort_order: 3 },
];

const DEFAULT_TENDER_SETTINGS: TenderSettings = {
  default_phases: DEFAULT_PHASES,
  validity_reminder: {
    enabled: true,
    days_before: [60, 30, 14], // 2 mois, 1 mois, 2 semaines
  },
  submission_reminder: {
    enabled: true,
    days_before: [14, 7, 3, 1], // 2 semaines, 1 semaine, 3 jours, 1 jour
  },
  default_criteria: DEFAULT_CRITERIA,
  default_lot_domains: DEFAULT_LOT_DOMAINS,
  pipeline_columns: DEFAULT_PIPELINE_COLUMNS,
  default_offer_validity_days: 90,
  auto_create_tasks_for_case_study: true,
};

// ============= HOOK =============

export function useTenderSettings() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: settingRecord, isLoading } = useQuery({
    queryKey: ["tender-settings", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;

      const { data, error } = await supabase
        .from("workspace_settings")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("setting_type", "tender_config")
        .eq("setting_key", "tender_defaults")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id,
  });

  const rawValue = settingRecord?.setting_value as Record<string, unknown> | null;

  const tenderSettings: TenderSettings = rawValue
    ? {
        default_phases: (rawValue.default_phases as TenderPhaseTemplate[]) ?? DEFAULT_TENDER_SETTINGS.default_phases,
        validity_reminder: (rawValue.validity_reminder as TenderReminderConfig) ?? DEFAULT_TENDER_SETTINGS.validity_reminder,
        submission_reminder: (rawValue.submission_reminder as TenderReminderConfig) ?? DEFAULT_TENDER_SETTINGS.submission_reminder,
        default_criteria: (rawValue.default_criteria as TenderCriterionTemplate[]) ?? DEFAULT_TENDER_SETTINGS.default_criteria,
        default_lot_domains: (rawValue.default_lot_domains as TenderLotDomainTemplate[]) ?? DEFAULT_TENDER_SETTINGS.default_lot_domains,
        pipeline_columns: (rawValue.pipeline_columns as TenderPipelineColumn[]) ?? DEFAULT_TENDER_SETTINGS.pipeline_columns,
        default_offer_validity_days: (rawValue.default_offer_validity_days as number) ?? DEFAULT_TENDER_SETTINGS.default_offer_validity_days,
        auto_create_tasks_for_case_study: (rawValue.auto_create_tasks_for_case_study as boolean) ?? DEFAULT_TENDER_SETTINGS.auto_create_tasks_for_case_study,
      }
    : DEFAULT_TENDER_SETTINGS;

  const updateTenderSettings = useMutation({
    mutationFn: async (updates: Partial<TenderSettings>) => {
      if (!activeWorkspace?.id) throw new Error("No workspace selected");

      const newValue = { ...tenderSettings, ...updates };

      if (settingRecord?.id) {
        const { error } = await supabase
          .from("workspace_settings")
          .update({ setting_value: newValue as unknown as Json })
          .eq("id", settingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("workspace_settings")
          .insert([{
            workspace_id: activeWorkspace.id,
            setting_type: "tender_config",
            setting_key: "tender_defaults",
            setting_value: newValue as unknown as Json,
            sort_order: 0,
            is_active: true,
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-settings", activeWorkspace?.id] });
      toast.success("Paramètres AO mis à jour");
    },
    onError: (error: Error) => {
      toast.error("Erreur", { description: error.message });
    },
  });

  // Helper functions for managing phases
  const addPhase = (phase: Omit<TenderPhaseTemplate, 'id' | 'sort_order'>) => {
    const newPhase: TenderPhaseTemplate = {
      ...phase,
      id: `phase_${Date.now()}`,
      sort_order: tenderSettings.default_phases.length,
    };
    updateTenderSettings.mutate({
      default_phases: [...tenderSettings.default_phases, newPhase],
    });
  };

  const updatePhase = (id: string, updates: Partial<TenderPhaseTemplate>) => {
    updateTenderSettings.mutate({
      default_phases: tenderSettings.default_phases.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    });
  };

  const removePhase = (id: string) => {
    updateTenderSettings.mutate({
      default_phases: tenderSettings.default_phases.filter(p => p.id !== id),
    });
  };

  // Helper functions for managing criteria
  const addCriterion = (criterion: Omit<TenderCriterionTemplate, 'id'>) => {
    const newCriterion: TenderCriterionTemplate = {
      ...criterion,
      id: `criterion_${Date.now()}`,
    };
    updateTenderSettings.mutate({
      default_criteria: [...tenderSettings.default_criteria, newCriterion],
    });
  };

  const updateCriterion = (id: string, updates: Partial<TenderCriterionTemplate>) => {
    updateTenderSettings.mutate({
      default_criteria: tenderSettings.default_criteria.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  const removeCriterion = (id: string) => {
    updateTenderSettings.mutate({
      default_criteria: tenderSettings.default_criteria.filter(c => c.id !== id),
    });
  };

  // Helper functions for managing lot domains
  const addLotDomain = (domain: Omit<TenderLotDomainTemplate, 'id'>) => {
    const newDomain: TenderLotDomainTemplate = {
      ...domain,
      id: `domain_${Date.now()}`,
    };
    updateTenderSettings.mutate({
      default_lot_domains: [...tenderSettings.default_lot_domains, newDomain],
    });
  };

  const updateLotDomain = (id: string, updates: Partial<TenderLotDomainTemplate>) => {
    updateTenderSettings.mutate({
      default_lot_domains: tenderSettings.default_lot_domains.map(d =>
        d.id === id ? { ...d, ...updates } : d
      ),
    });
  };

  const removeLotDomain = (id: string) => {
    updateTenderSettings.mutate({
      default_lot_domains: tenderSettings.default_lot_domains.filter(d => d.id !== id),
    });
  };

  // Helper functions for managing pipeline columns
  const addPipelineColumn = (column: Omit<TenderPipelineColumn, 'id' | 'sort_order'>) => {
    const newColumn: TenderPipelineColumn = {
      ...column,
      id: `column_${Date.now()}`,
      sort_order: tenderSettings.pipeline_columns.length,
    };
    updateTenderSettings.mutate({
      pipeline_columns: [...tenderSettings.pipeline_columns, newColumn],
    });
  };

  const updatePipelineColumn = (id: string, updates: Partial<TenderPipelineColumn>) => {
    updateTenderSettings.mutate({
      pipeline_columns: tenderSettings.pipeline_columns.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  const removePipelineColumn = (id: string) => {
    updateTenderSettings.mutate({
      pipeline_columns: tenderSettings.pipeline_columns.filter(c => c.id !== id),
    });
  };

  return {
    tenderSettings,
    isLoading,
    updateTenderSettings,
    // Phases
    addPhase,
    updatePhase,
    removePhase,
    // Criteria
    addCriterion,
    updateCriterion,
    removeCriterion,
    // Lot domains
    addLotDomain,
    updateLotDomain,
    removeLotDomain,
    // Pipeline columns
    addPipelineColumn,
    updatePipelineColumn,
    removePipelineColumn,
  };
}
