import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { type DisciplineSlug, getTenderDisciplineConfig } from "@/lib/tenderDisciplineConfig";

export interface TenderTypeField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  unit?: string;
  options?: { value: string; label: string }[];
  section: 'general' | 'project' | 'financial' | 'procedure' | 'dates';
  required?: boolean;
}

export interface TenderTypeDocument {
  value: string;
  label: string;
  mandatory: boolean;
}

export interface TenderTypeCriterion {
  type: string;
  label: string;
  default_weight: number;
}

export interface TenderTypeAIPrompts {
  dce_analysis: string;
  memoire_generation: string;
}

export interface TenderTypeParticularity {
  key: string;
  label: string;
  value: string | boolean | number;
  description?: string;
}

export interface TenderTypeConfig {
  id: string;
  workspace_id: string;
  discipline_slug: DisciplineSlug;
  type_key: string;
  label: string;
  description?: string;
  icon: string;
  color: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  specific_fields: TenderTypeField[];
  required_documents: {
    candidature: TenderTypeDocument[];
    offre: TenderTypeDocument[];
  };
  default_criteria: TenderTypeCriterion[];
  ai_prompts: TenderTypeAIPrompts;
  particularities: Record<string, TenderTypeParticularity>;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTenderTypeInput {
  discipline_slug: DisciplineSlug;
  type_key: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  is_default?: boolean;
  sort_order?: number;
  specific_fields?: TenderTypeField[];
  required_documents?: { candidature: TenderTypeDocument[]; offre: TenderTypeDocument[] };
  default_criteria?: TenderTypeCriterion[];
  ai_prompts?: TenderTypeAIPrompts;
  particularities?: Record<string, TenderTypeParticularity>;
}

// Default tender types for each discipline (used when none configured)
export const DEFAULT_TENDER_TYPES: Record<DisciplineSlug, Omit<TenderTypeConfig, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>[]> = {
  architecture: [
    {
      discipline_slug: 'architecture',
      type_key: 'moe',
      label: 'Maîtrise d\'œuvre',
      description: 'Mission de maîtrise d\'œuvre complète ou partielle',
      icon: 'Building2',
      color: '#3B82F6',
      is_active: true,
      is_default: true,
      sort_order: 0,
      specific_fields: [
        { key: 'estimated_budget', label: 'Budget travaux estimé', type: 'number', unit: '€ HT', section: 'financial' },
        { key: 'surface_area', label: 'Surface', type: 'number', unit: 'm²', section: 'project' },
        { key: 'moe_phases', label: 'Phases MOE', type: 'select', section: 'project' },
      ],
      required_documents: { candidature: [], offre: [] },
      default_criteria: [
        { type: 'price', label: 'Prix', default_weight: 40 },
        { type: 'technical', label: 'Valeur technique', default_weight: 60 },
      ],
      ai_prompts: {
        dce_analysis: 'Expert en marchés de maîtrise d\'œuvre et concours d\'architecture.',
        memoire_generation: 'Rédacteur expert en mémoires techniques MOE.',
      },
      particularities: {},
    },
    {
      discipline_slug: 'architecture',
      type_key: 'concours',
      label: 'Concours d\'architecture',
      description: 'Concours ouvert ou restreint avec remise de prestations',
      icon: 'Award',
      color: '#F59E0B',
      is_active: true,
      is_default: false,
      sort_order: 1,
      specific_fields: [
        { key: 'estimated_budget', label: 'Budget travaux', type: 'number', unit: '€ HT', section: 'financial' },
        { key: 'indemnite', label: 'Indemnité', type: 'number', unit: '€', section: 'financial' },
        { key: 'nb_candidats', label: 'Nombre de candidats', type: 'number', section: 'procedure' },
      ],
      required_documents: { candidature: [], offre: [] },
      default_criteria: [
        { type: 'artistic', label: 'Qualité architecturale', default_weight: 50 },
        { type: 'technical', label: 'Valeur technique', default_weight: 30 },
        { type: 'price', label: 'Prix', default_weight: 20 },
      ],
      ai_prompts: {
        dce_analysis: 'Expert en concours d\'architecture et marchés de conception.',
        memoire_generation: 'Architecte expert en préparation de concours.',
      },
      particularities: {},
    },
    {
      discipline_slug: 'architecture',
      type_key: 'conception_realisation',
      label: 'Conception-Réalisation',
      description: 'Marché global de conception et réalisation',
      icon: 'HardHat',
      color: '#10B981',
      is_active: true,
      is_default: false,
      sort_order: 2,
      specific_fields: [
        { key: 'estimated_budget', label: 'Enveloppe travaux', type: 'number', unit: '€ HT', section: 'financial' },
        { key: 'surface_area', label: 'Surface', type: 'number', unit: 'm²', section: 'project' },
        { key: 'delai_global', label: 'Délai global', type: 'number', unit: 'mois', section: 'procedure' },
      ],
      required_documents: { candidature: [], offre: [] },
      default_criteria: [],
      ai_prompts: {
        dce_analysis: 'Expert en marchés de conception-réalisation.',
        memoire_generation: 'Expert en offres de conception-réalisation.',
      },
      particularities: {},
    },
  ],
  scenographie: [
    {
      discipline_slug: 'scenographie',
      type_key: 'exposition_permanente',
      label: 'Exposition permanente',
      description: 'Scénographie d\'exposition permanente ou semi-permanente',
      icon: 'Frame',
      color: '#8B5CF6',
      is_active: true,
      is_default: true,
      sort_order: 0,
      specific_fields: [
        { key: 'estimated_budget', label: 'Budget scénographie', type: 'number', unit: '€ HT', section: 'financial' },
        { key: 'surface_area', label: 'Surface d\'exposition', type: 'number', unit: 'm²', section: 'project' },
      ],
      required_documents: { candidature: [], offre: [] },
      default_criteria: [
        { type: 'artistic', label: 'Qualité artistique', default_weight: 40 },
        { type: 'scenographic', label: 'Pertinence scénographique', default_weight: 30 },
        { type: 'price', label: 'Prix', default_weight: 30 },
      ],
      ai_prompts: {
        dce_analysis: 'Expert en marchés de scénographie muséographique.',
        memoire_generation: 'Scénographe expert en notes d\'intention.',
      },
      particularities: {},
    },
    {
      discipline_slug: 'scenographie',
      type_key: 'exposition_temporaire',
      label: 'Exposition temporaire',
      description: 'Scénographie d\'exposition temporaire',
      icon: 'Calendar',
      color: '#EC4899',
      is_active: true,
      is_default: false,
      sort_order: 1,
      specific_fields: [
        { key: 'estimated_budget', label: 'Budget', type: 'number', unit: '€ HT', section: 'financial' },
        { key: 'duree_expo', label: 'Durée exposition', type: 'number', unit: 'mois', section: 'project' },
      ],
      required_documents: { candidature: [], offre: [] },
      default_criteria: [],
      ai_prompts: {
        dce_analysis: 'Expert en expositions temporaires et itinérantes.',
        memoire_generation: 'Expert en scénographie d\'exposition temporaire.',
      },
      particularities: {},
    },
    {
      discipline_slug: 'scenographie',
      type_key: 'evenementiel',
      label: 'Événementiel',
      description: 'Scénographie événementielle, stands, installations',
      icon: 'Sparkles',
      color: '#F59E0B',
      is_active: true,
      is_default: false,
      sort_order: 2,
      specific_fields: [
        { key: 'estimated_budget', label: 'Budget', type: 'number', unit: '€ HT', section: 'financial' },
        { key: 'date_evenement', label: 'Date événement', type: 'date', section: 'dates' },
      ],
      required_documents: { candidature: [], offre: [] },
      default_criteria: [],
      ai_prompts: {
        dce_analysis: 'Expert en événementiel et scénographie de stands.',
        memoire_generation: 'Expert en propositions événementielles.',
      },
      particularities: {},
    },
  ],
  communication: [
    {
      discipline_slug: 'communication',
      type_key: 'accord_cadre',
      label: 'Accord-cadre communication',
      description: 'Accord-cadre multi-attributaire ou mono-attributaire',
      icon: 'FileStack',
      color: '#EC4899',
      is_active: true,
      is_default: true,
      sort_order: 0,
      specific_fields: [
        { key: 'montant_minimum', label: 'Montant minimum', type: 'number', unit: '€ HT', section: 'financial' },
        { key: 'montant_maximum', label: 'Montant maximum', type: 'number', unit: '€ HT', section: 'financial' },
        { key: 'duree_initiale_mois', label: 'Durée initiale', type: 'number', unit: 'mois', section: 'procedure' },
        { key: 'nb_reconductions', label: 'Reconductions', type: 'number', section: 'procedure' },
        { key: 'is_multi_attributaire', label: 'Multi-attributaire', type: 'checkbox', section: 'procedure' },
      ],
      required_documents: { candidature: [], offre: [] },
      default_criteria: [
        { type: 'creative', label: 'Créativité', default_weight: 30 },
        { type: 'strategic', label: 'Pertinence stratégique', default_weight: 30 },
        { type: 'price', label: 'Budget', default_weight: 40 },
      ],
      ai_prompts: {
        dce_analysis: 'Expert en accords-cadres de communication.',
        memoire_generation: 'Planneur stratégique expert en recommandations.',
      },
      particularities: {},
    },
    {
      discipline_slug: 'communication',
      type_key: 'campagne',
      label: 'Campagne de communication',
      description: 'Campagne ponctuelle avec cas pratique',
      icon: 'Megaphone',
      color: '#3B82F6',
      is_active: true,
      is_default: false,
      sort_order: 1,
      specific_fields: [
        { key: 'budget_campagne', label: 'Budget campagne', type: 'number', unit: '€ HT', section: 'financial' },
        { key: 'type_campagne', label: 'Type de campagne', type: 'select', section: 'project', options: [
          { value: 'institutionnelle', label: 'Institutionnelle' },
          { value: 'produit', label: 'Produit/Service' },
          { value: 'recrutement', label: 'Marque employeur' },
        ]},
        { key: 'cibles', label: 'Cibles', type: 'textarea', section: 'project' },
        { key: 'cas_pratique_requis', label: 'Cas pratique', type: 'checkbox', section: 'procedure' },
      ],
      required_documents: { candidature: [], offre: [] },
      default_criteria: [],
      ai_prompts: {
        dce_analysis: 'Expert en compétitions d\'agences de communication.',
        memoire_generation: 'Directeur de création expert en recommandations.',
      },
      particularities: {},
    },
    {
      discipline_slug: 'communication',
      type_key: 'digital',
      label: 'Stratégie digitale',
      description: 'Stratégie digitale, social media, influence',
      icon: 'Globe',
      color: '#10B981',
      is_active: true,
      is_default: false,
      sort_order: 2,
      specific_fields: [
        { key: 'budget_digital', label: 'Budget', type: 'number', unit: '€ HT', section: 'financial' },
        { key: 'canaux', label: 'Canaux', type: 'textarea', section: 'project', placeholder: 'Instagram, LinkedIn, TikTok...' },
      ],
      required_documents: { candidature: [], offre: [] },
      default_criteria: [],
      ai_prompts: {
        dce_analysis: 'Expert en stratégie digitale et social media.',
        memoire_generation: 'Expert en stratégie digitale et influence.',
      },
      particularities: {},
    },
  ],
};

export function useTenderTypeConfigs(disciplineSlug?: DisciplineSlug) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all tender type configs for the workspace
  const { data: configs, isLoading, error } = useQuery({
    queryKey: ['tender-type-configs', activeWorkspace?.id, disciplineSlug],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      let query = supabase
        .from('tender_type_configs')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('sort_order', { ascending: true });

      if (disciplineSlug) {
        query = query.eq('discipline_slug', disciplineSlug);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Cast the data properly
      return (data || []).map(item => ({
        ...item,
        specific_fields: (item.specific_fields as unknown as TenderTypeField[]) || [],
        required_documents: (item.required_documents as unknown as { candidature: TenderTypeDocument[]; offre: TenderTypeDocument[] }) || { candidature: [], offre: [] },
        default_criteria: (item.default_criteria as unknown as TenderTypeCriterion[]) || [],
        ai_prompts: (item.ai_prompts as unknown as TenderTypeAIPrompts) || { dce_analysis: '', memoire_generation: '' },
        particularities: (item.particularities as unknown as Record<string, TenderTypeParticularity>) || {},
      })) as TenderTypeConfig[];
    },
    enabled: !!activeWorkspace?.id,
  });

  // Get active types for a discipline (with fallback to defaults)
  const getActiveTypesForDiscipline = useMemo(() => {
    return (slug: DisciplineSlug): TenderTypeConfig[] => {
      const workspaceConfigs = configs?.filter(c => c.discipline_slug === slug && c.is_active) || [];
      
      if (workspaceConfigs.length > 0) {
        return workspaceConfigs;
      }
      
      // Return defaults if no custom configs
      return DEFAULT_TENDER_TYPES[slug].map((t, idx) => ({
        ...t,
        id: `default-${slug}-${idx}`,
        workspace_id: activeWorkspace?.id || '',
      })) as TenderTypeConfig[];
    };
  }, [configs, activeWorkspace?.id]);

  // Create a new tender type config
  const createConfig = useMutation({
    mutationFn: async (input: CreateTenderTypeInput) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      const { data, error } = await supabase
        .from('tender_type_configs')
        .insert({
          workspace_id: activeWorkspace.id,
          discipline_slug: input.discipline_slug,
          type_key: input.type_key,
          label: input.label,
          description: input.description,
          icon: input.icon,
          color: input.color,
          is_active: input.is_active,
          is_default: input.is_default,
          sort_order: input.sort_order,
          specific_fields: JSON.parse(JSON.stringify(input.specific_fields || [])),
          required_documents: JSON.parse(JSON.stringify(input.required_documents || { candidature: [], offre: [] })),
          default_criteria: JSON.parse(JSON.stringify(input.default_criteria || [])),
          ai_prompts: JSON.parse(JSON.stringify(input.ai_prompts || { dce_analysis: '', memoire_generation: '' })),
          particularities: JSON.parse(JSON.stringify(input.particularities || {})),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-type-configs'] });
      toast.success('Type d\'AO créé');
    },
    onError: (error) => {
      console.error('Failed to create tender type config:', error);
      toast.error('Erreur lors de la création');
    },
  });

  // Update a tender type config
  const updateConfig = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TenderTypeConfig> & { id: string }) => {
      const cleanUpdates: Record<string, unknown> = {};
      if (updates.label !== undefined) cleanUpdates.label = updates.label;
      if (updates.description !== undefined) cleanUpdates.description = updates.description;
      if (updates.icon !== undefined) cleanUpdates.icon = updates.icon;
      if (updates.color !== undefined) cleanUpdates.color = updates.color;
      if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active;
      if (updates.is_default !== undefined) cleanUpdates.is_default = updates.is_default;
      if (updates.sort_order !== undefined) cleanUpdates.sort_order = updates.sort_order;
      if (updates.specific_fields !== undefined) cleanUpdates.specific_fields = JSON.parse(JSON.stringify(updates.specific_fields));
      if (updates.required_documents !== undefined) cleanUpdates.required_documents = JSON.parse(JSON.stringify(updates.required_documents));
      if (updates.default_criteria !== undefined) cleanUpdates.default_criteria = JSON.parse(JSON.stringify(updates.default_criteria));
      if (updates.ai_prompts !== undefined) cleanUpdates.ai_prompts = JSON.parse(JSON.stringify(updates.ai_prompts));
      if (updates.particularities !== undefined) cleanUpdates.particularities = JSON.parse(JSON.stringify(updates.particularities));

      const { data, error } = await supabase
        .from('tender_type_configs')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-type-configs'] });
      toast.success('Type d\'AO mis à jour');
    },
    onError: (error) => {
      console.error('Failed to update tender type config:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Delete a tender type config
  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tender_type_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-type-configs'] });
      toast.success('Type d\'AO supprimé');
    },
    onError: (error) => {
      console.error('Failed to delete tender type config:', error);
      toast.error('Erreur lors de la suppression');
    },
  });

  // Initialize default configs for a discipline
  const initializeDefaults = useMutation({
    mutationFn: async (slug: DisciplineSlug) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      const defaults = DEFAULT_TENDER_TYPES[slug];
      const inserts = defaults.map(d => ({
        workspace_id: activeWorkspace.id,
        discipline_slug: d.discipline_slug,
        type_key: d.type_key,
        label: d.label,
        description: d.description,
        icon: d.icon,
        color: d.color,
        is_active: d.is_active,
        is_default: d.is_default,
        sort_order: d.sort_order,
        specific_fields: JSON.parse(JSON.stringify(d.specific_fields)),
        required_documents: JSON.parse(JSON.stringify(d.required_documents)),
        default_criteria: JSON.parse(JSON.stringify(d.default_criteria)),
        ai_prompts: JSON.parse(JSON.stringify(d.ai_prompts)),
        particularities: JSON.parse(JSON.stringify(d.particularities)),
      }));

      const { data, error } = await supabase
        .from('tender_type_configs')
        .insert(inserts)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tender-type-configs'] });
      toast.success('Types par défaut initialisés');
    },
    onError: (error) => {
      console.error('Failed to initialize defaults:', error);
      toast.error('Erreur lors de l\'initialisation');
    },
  });

  return {
    configs: configs || [],
    isLoading,
    error,
    getActiveTypesForDiscipline,
    createConfig,
    updateConfig,
    deleteConfig,
    initializeDefaults,
  };
}
