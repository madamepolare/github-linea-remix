import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type GenerationType = 'skills' | 'pricing_grid' | 'quote_template' | 'contract_types';

export interface GeneratedSkill {
  label: string;
  daily_rate: number;
  cost_daily_rate: number;
  description: string;
  color: string;
}

export interface GeneratedPricingItem {
  skill_name: string;
  experience_level: 'junior' | 'confirmed' | 'senior' | 'expert';
  hourly_rate: number;
  daily_rate: number;
}

export interface GeneratedQuoteTemplate {
  name: string;
  description: string;
  default_phases: {
    phase_name: string;
    phase_code: string;
    description: string;
    percentage: number;
  }[];
  default_terms: string;
}

export interface GeneratedContractType {
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  default_fields: {
    surface?: boolean;
    construction_budget?: boolean;
    address?: boolean;
    city?: boolean;
    budget?: boolean;
  };
  builder_tabs: string[];
}

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSkills = async (
    disciplineName: string,
    disciplineDescription?: string
  ): Promise<GeneratedSkill[]> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-discipline-content', {
        body: {
          type: 'skills',
          discipline_name: disciplineName,
          discipline_description: disciplineDescription,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.data as GeneratedSkill[];
    } catch (error) {
      console.error('Error generating skills:', error);
      toast.error('Erreur lors de la génération des compétences');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePricingGrid = async (
    disciplineName: string,
    existingSkills: string[]
  ): Promise<GeneratedPricingItem[]> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-discipline-content', {
        body: {
          type: 'pricing_grid',
          discipline_name: disciplineName,
          existing_skills: existingSkills,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.data as GeneratedPricingItem[];
    } catch (error) {
      console.error('Error generating pricing grid:', error);
      toast.error('Erreur lors de la génération de la grille tarifaire');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQuoteTemplate = async (
    disciplineName: string,
    contractTypeName?: string
  ): Promise<GeneratedQuoteTemplate> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-discipline-content', {
        body: {
          type: 'quote_template',
          discipline_name: disciplineName,
          contract_type_name: contractTypeName,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.data as GeneratedQuoteTemplate;
    } catch (error) {
      console.error('Error generating quote template:', error);
      toast.error('Erreur lors de la génération du template');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateContractTypes = async (
    disciplineName: string,
    disciplineDescription?: string
  ): Promise<GeneratedContractType[]> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-discipline-content', {
        body: {
          type: 'contract_types',
          discipline_name: disciplineName,
          discipline_description: disciplineDescription,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data.data as GeneratedContractType[];
    } catch (error) {
      console.error('Error generating contract types:', error);
      toast.error('Erreur lors de la génération des types de contrat');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateSkills,
    generatePricingGrid,
    generateQuoteTemplate,
    generateContractTypes,
  };
}
