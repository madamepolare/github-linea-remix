import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PDFDocumentConfig, isValidPDFConfig, DEFAULT_PDF_CONFIG } from '@/lib/pdfBlockTypes';

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
  default_clauses: Record<string, string>;
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
  default_clauses?: Record<string, string>;
  builder_tabs?: BuilderTab[];
  sort_order?: number;
  is_default?: boolean;
}

export interface UpdateContractTypeInput extends Partial<CreateContractTypeInput> {
  id: string;
  is_active?: boolean;
  builder_tabs?: BuilderTab[];
}

// Default contract types to initialize workspaces with
export const DEFAULT_CONTRACT_TYPES: Omit<ContractType, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'Architecture',
    code: 'ARCHI',
    description: 'Missions de maîtrise d\'œuvre selon loi MOP',
    icon: 'Building2',
    color: '#3B82F6',
    default_fields: { surface: true, construction_budget: true, address: true, city: true },
    default_clauses: {},
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
    name: 'Campagne publicitaire',
    code: 'PUB',
    description: 'Campagnes de communication et publicité',
    icon: 'Megaphone',
    color: '#F59E0B',
    default_fields: { budget: true },
    default_clauses: {},
    builder_tabs: ['general', 'lines', 'production', 'terms'],
    pdf_config: DEFAULT_PDF_CONFIG,
    sort_order: 3,
    is_default: false,
    is_active: true
  },
  {
    name: 'Branding',
    code: 'BRAND',
    description: 'Identité visuelle et charte graphique',
    icon: 'Palette',
    color: '#10B981',
    default_fields: { budget: true },
    default_clauses: {},
    builder_tabs: ['general', 'lines', 'production', 'terms'],
    pdf_config: DEFAULT_PDF_CONFIG,
    sort_order: 4,
    is_default: false,
    is_active: true
  },
  {
    name: 'Web & Digital',
    code: 'WEB',
    description: 'Sites web, applications, digital',
    icon: 'Globe',
    color: '#06B6D4',
    default_fields: { budget: true },
    default_clauses: {},
    builder_tabs: ['general', 'lines', 'production', 'terms'],
    pdf_config: DEFAULT_PDF_CONFIG,
    sort_order: 5,
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
        .insert({
          ...input,
          workspace_id: activeWorkspace.id,
          default_fields: input.default_fields || {},
          default_clauses: input.default_clauses || {}
        })
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
    mutationFn: async ({ id, ...input }: UpdateContractTypeInput) => {
      const { data, error } = await supabase
        .from('contract_types')
        .update(input)
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

      const { error } = await supabase
        .from('contract_types')
        .insert(
          typesToCreate.map(t => ({
            name: t.name,
            code: t.code,
            description: t.description,
            icon: t.icon,
            color: t.color,
            default_fields: t.default_fields as Record<string, unknown>,
            default_clauses: t.default_clauses as Record<string, unknown>,
            builder_tabs: t.builder_tabs as unknown[],
            pdf_config: JSON.parse(JSON.stringify(t.pdf_config)),
            sort_order: t.sort_order,
            is_default: t.is_default,
            is_active: t.is_active,
            workspace_id: activeWorkspace.id
          }))
        );

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
