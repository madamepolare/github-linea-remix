import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  MOEMissionPhase, 
  MOEPaymentSchedule,
  DEFAULT_MOE_MISSION_PHASES,
  DEFAULT_MOE_PAYMENT_SCHEDULE,
  DEFAULT_MOE_CLAUSES
} from '@/lib/moeContractConfig';

export interface MOEContractConfig {
  id?: string;
  mission_phases: MOEMissionPhase[];
  payment_schedule: MOEPaymentSchedule[];
  clauses: Record<string, string>;
  insurance_company?: string;
  insurance_policy_number?: string;
  minimum_fee?: number;
  extra_meeting_rate?: number;
}

const DEFAULT_CONFIG: MOEContractConfig = {
  mission_phases: DEFAULT_MOE_MISSION_PHASES,
  payment_schedule: DEFAULT_MOE_PAYMENT_SCHEDULE,
  clauses: DEFAULT_MOE_CLAUSES,
  minimum_fee: 4000,
  extra_meeting_rate: 250
};

export function useMOEContractConfig() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['moe-contract-config', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return DEFAULT_CONFIG;

      const { data, error } = await supabase
        .from('workspace_settings')
        .select('*')
        .eq('workspace_id', activeWorkspace.id)
        .eq('setting_type', 'moe_contract')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No config found, return defaults
          return DEFAULT_CONFIG;
        }
        throw error;
      }

      const settingValue = data.setting_value as Record<string, unknown>;
      
      return {
        id: data.id,
        mission_phases: (settingValue.mission_phases as MOEMissionPhase[]) || DEFAULT_MOE_MISSION_PHASES,
        payment_schedule: (settingValue.payment_schedule as MOEPaymentSchedule[]) || DEFAULT_MOE_PAYMENT_SCHEDULE,
        clauses: (settingValue.clauses as Record<string, string>) || DEFAULT_MOE_CLAUSES,
        insurance_company: settingValue.insurance_company as string | undefined,
        insurance_policy_number: settingValue.insurance_policy_number as string | undefined,
        minimum_fee: (settingValue.minimum_fee as number) || 4000,
        extra_meeting_rate: (settingValue.extra_meeting_rate as number) || 250
      } as MOEContractConfig;
    },
    enabled: !!activeWorkspace?.id
  });

  const saveConfig = useMutation({
    mutationFn: async (newConfig: Omit<MOEContractConfig, 'id'>) => {
      if (!activeWorkspace?.id) throw new Error('No workspace selected');

      // Convert to JSON-compatible format
      const settingValue = JSON.parse(JSON.stringify({
        mission_phases: newConfig.mission_phases,
        payment_schedule: newConfig.payment_schedule,
        clauses: newConfig.clauses,
        insurance_company: newConfig.insurance_company,
        insurance_policy_number: newConfig.insurance_policy_number,
        minimum_fee: newConfig.minimum_fee,
        extra_meeting_rate: newConfig.extra_meeting_rate
      }));

      // Check if config exists
      const { data: existing } = await supabase
        .from('workspace_settings')
        .select('id')
        .eq('workspace_id', activeWorkspace.id)
        .eq('setting_type', 'moe_contract')
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('workspace_settings')
          .update({ 
            setting_value: settingValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('workspace_settings')
          .insert([{
            workspace_id: activeWorkspace.id,
            setting_type: 'moe_contract',
            setting_key: 'default',
            setting_value: settingValue,
            sort_order: 0,
            is_active: true
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moe-contract-config'] });
      toast.success('Configuration MOE sauvegardée');
    },
    onError: (error) => {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    }
  });

  return {
    config: config || DEFAULT_CONFIG,
    isLoading,
    saveConfig,
    defaultConfig: DEFAULT_CONFIG
  };
}
