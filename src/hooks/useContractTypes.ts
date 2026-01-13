import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PDFDocumentConfig, isValidPDFConfig, DEFAULT_PDF_CONFIG } from '@/lib/pdfBlockTypes';
import type { Json } from '@/integrations/supabase/types';

export interface ContractTypeFields {
  surface?: boolean;
  construction_budget?: boolean;
  address?: boolean;
  city?: boolean;
  budget?: boolean;
  [key: string]: boolean | undefined;
}

// Available tabs in the quote builder
export type BuilderTab = 'general' | 'fees' | 'lines' | 'production' | 'planning' | 'terms';

export interface ContractType {
  id: string;
  workspace_id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  default_fields: ContractTypeFields;
  default_clauses: Record<string, unknown>; // Can contain MOE config or simple string clauses
  builder_tabs: BuilderTab[];
  pdf_config: PDFDocumentConfig;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateContractTypeInput {
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  default_fields?: ContractTypeFields;
  default_clauses?: Record<string, unknown>;
  builder_tabs?: BuilderTab[];
  sort_order?: number;
  is_default?: boolean;
}

export interface UpdateContractTypeInput extends Partial<CreateContractTypeInput> {
  id: string;
  is_active?: boolean;
  builder_tabs?: BuilderTab[];
  pdf_config?: PDFDocumentConfig;
}

// Default contract types to initialize workspaces with
import { 
  DEFAULT_MOE_MISSION_PHASES, 
  DEFAULT_MOE_PAYMENT_SCHEDULE, 
  DEFAULT_MOE_CLAUSES 
} from '@/lib/moeContractConfig';
import {
  DEFAULT_COMMUNICATION_PHASES,
  DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE,
  DEFAULT_COMMUNICATION_CLAUSES
} from '@/lib/communicationContractDefaults';

// Default MOE configuration for architecture contracts
export const DEFAULT_MOE_CONFIG = {
  template: 'moe_architecture_contract',
  version: 1,
  mission_phases: DEFAULT_MOE_MISSION_PHASES,
  payment_schedule: DEFAULT_MOE_PAYMENT_SCHEDULE,
  clauses: DEFAULT_MOE_CLAUSES,
  settings: {
    minimum_fee: 4000,
    extra_meeting_rate: 250,
    insurance_company: '',
    insurance_policy_number: ''
  }
};

// Default Communication configuration
export const DEFAULT_COMMUNICATION_CONFIG = {
  template: 'communication_contract',
  version: 1,
  phases: DEFAULT_COMMUNICATION_PHASES,
  payment_schedule: DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE,
  clauses: DEFAULT_COMMUNICATION_CLAUSES,
  settings: {
    daily_rate: 800,
    minimum_project: 5000,
    currency: 'EUR'
  }
};

export const DEFAULT_CONTRACT_TYPES: Omit<ContractType, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Architecture / MOE',
    code: 'MOE',
    description: 'Contrat de Maîtrise d\'Œuvre - Missions selon loi MOP',
    icon: 'Building2',
    color: '#3B82F6',
    default_fields: { surface: true, construction_budget: true, address: true, city: true },
    default_clauses: DEFAULT_MOE_CONFIG,
    builder_tabs: ['general', 'fees', 'planning', 'terms'],
    pdf_config: DEFAULT_PDF_CONFIG,
    sort_order: 0,
    is_default: true,
    is_active: true
  },
  {
    name: 'Architecture d\'intérieur',
    code: 'INTERIOR',
    description: 'Projets d\'aménagement et décoration',
    icon: 'Sofa',
    color: '#8B5CF6',
    default_fields: { surface: true, address: true, city: true, budget: true },
    default_clauses: {},
    builder_tabs: ['general', 'fees', 'lines', 'terms'],
    pdf_config: DEFAULT_PDF_CONFIG,
    sort_order: 1,
    is_default: false,
    is_active: true
  },
  {
    name: 'Scénographie',
    code: 'SCENO',
    description: 'Expositions, muséographie, événementiel',
    icon: 'Theater',
    color: '#EC4899',
    default_fields: { surface: true, budget: true },
    default_clauses: {},
    builder_tabs: ['general', 'lines', 'production', 'planning', 'terms'],
    pdf_config: DEFAULT_PDF_CONFIG,
    sort_order: 2,
    is_default: false,
    is_active: true
  },
  {
    name: 'Campagne 360°',
    code: 'CAMP360',
    description: 'Campagne de communication multi-canal',
    icon: 'Megaphone',
    color: '#EC4899',
    default_fields: { budget: true },
    default_clauses: DEFAULT_COMMUNICATION_CONFIG,
    builder_tabs: ['general', 'fees', 'lines', 'terms'],
    pdf_config: DEFAULT_PDF_CONFIG,
    sort_order: 3,
    is_default: false,
    is_active: true
  },
  {
    name: 'Branding / Identité',
    code: 'BRAND',
    description: 'Création ou refonte d\'identité visuelle',
    icon: 'Palette',
    color: '#8B5CF6',
    default_fields: { budget: true },
    default_clauses: DEFAULT_COMMUNICATION_CONFIG,
    builder_tabs: ['general', 'fees', 'lines', 'terms'],
    pdf_config: DEFAULT_PDF_CONFIG,
    sort_order: 4,
    is_default: false,
    is_active: true
  },
  {
    name: 'Digital / Social Media',
    code: 'DIGITAL',
    description: 'Stratégie digitale et réseaux sociaux',
    icon: 'Globe',
    color: '#06B6D4',
    default_fields: { budget: true },
    default_clauses: DEFAULT_COMMUNICATION_CONFIG,
    builder_tabs: ['general', 'fees', 'lines', 'terms'],
    pdf_config: DEFAULT_PDF_CONFIG,
    sort_order: 5,
    is_default: false,
    is_active: true
  },
  {
    name: 'Événementiel',
    code: 'EVENT',
    description: 'Conception et production d\'événements',
    icon: 'Calendar',
    color: '#F59E0B',
    default_fields: { budget: true },
    default_clauses: DEFAULT_COMMUNICATION_CONFIG,
    builder_tabs: ['general', 'fees', 'lines', 'planning', 'terms'],
    pdf_config: DEFAULT_PDF_CONFIG,
    sort_order: 6,
    is_default: false,
    is_active: true
  },
  {
    name: 'Production vidéo',
    code: 'VIDEO',
    description: 'Films, vidéos et contenus audiovisuels',
    icon: 'Video',
    color: '#EF4444',
    default_fields: { budget: true },
    default_clauses: DEFAULT_COMMUNICATION_CONFIG,
    builder_tabs: ['general', 'fees', 'lines', 'terms'],
    pdf_config: DEFAULT_PDF_CONFIG,
    sort_order: 7,
    is_default: false,
    is_active: true
  }
];

export function useContractTypes() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const contractTypesQuery = useQuery({
    queryKey: ['contract-types', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from('contract_types')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .order('sort_order');

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        builder_tabs: Array.isArray(item.builder_tabs) 
          ? item.builder_tabs as BuilderTab[]
          : ['general', 'lines', 'terms'] as BuilderTab[],
        pdf_config: isValidPDFConfig(item.pdf_config) 
          ? item.pdf_config as PDFDocumentConfig
          : DEFAULT_PDF_CONFIG
      })) as ContractType[];
    },
    enabled: !!activeWorkspace?.id
  });

  const createContractType = useMutation({
    mutationFn: async (input: CreateContractTypeInput) => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      const { data, error } = await supabase
        .from('contract_types')
        .insert([{
          workspace_id: activeWorkspace.id,
          name: input.name,
          code: input.code,
          description: input.description,
          icon: input.icon,
          color: input.color,
          default_fields: (input.default_fields || {}) as unknown as Json,
          default_clauses: (input.default_clauses || {}) as unknown as Json,
          builder_tabs: input.builder_tabs as unknown as Json,
          sort_order: input.sort_order ?? 0,
          is_default: input.is_default ?? false
        }])
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        pdf_config: isValidPDFConfig(data.pdf_config) ? data.pdf_config as PDFDocumentConfig : DEFAULT_PDF_CONFIG
      } as ContractType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-types'] });
      toast.success('Type de contrat créé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la création');
      console.error(error);
    }
  });

  const updateContractType = useMutation({
    mutationFn: async ({ id, pdf_config, ...input }: UpdateContractTypeInput) => {
      const updateData: Record<string, any> = { ...input };
      if (pdf_config) {
        updateData.pdf_config = pdf_config;
      }
      
      const { data, error } = await supabase
        .from('contract_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        pdf_config: isValidPDFConfig(data.pdf_config) ? data.pdf_config as PDFDocumentConfig : DEFAULT_PDF_CONFIG
      } as ContractType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-types'] });
      toast.success('Type de contrat mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    }
  });

  const deleteContractType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contract_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-types'] });
      toast.success('Type de contrat supprimé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    }
  });

  const initializeDefaults = useMutation({
    mutationFn: async () => {
      if (!activeWorkspace?.id) throw new Error('No workspace');

      const existingTypes = contractTypesQuery.data || [];
      const existingCodes = existingTypes.map(t => t.code);

      const typesToCreate = DEFAULT_CONTRACT_TYPES.filter(
        t => !existingCodes.includes(t.code)
      );

      if (typesToCreate.length === 0) {
        toast.info('Tous les types par défaut existent déjà');
        return;
      }

      const insertData = typesToCreate.map(t => ({
        name: t.name,
        code: t.code,
        description: t.description,
        icon: t.icon,
        color: t.color,
        default_fields: t.default_fields,
        default_clauses: t.default_clauses,
        builder_tabs: t.builder_tabs as string[],
        pdf_config: t.pdf_config,
        sort_order: t.sort_order,
        is_default: t.is_default,
        is_active: t.is_active,
        workspace_id: activeWorkspace.id
      }));

      const { error } = await supabase
        .from('contract_types')
        .insert(insertData as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-types'] });
      toast.success('Types par défaut initialisés');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'initialisation');
      console.error(error);
    }
  });

  return {
    contractTypes: contractTypesQuery.data || [],
    activeContractTypes: (contractTypesQuery.data || []).filter(t => t.is_active),
    isLoading: contractTypesQuery.isLoading,
    createContractType,
    updateContractType,
    deleteContractType,
    initializeDefaults
  };
}
