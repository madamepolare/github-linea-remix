// Default MOE Contract configuration for Contract Types
// This configuration is used to initialize architecture contract types

import {
  MOEMissionPhase,
  MOEPaymentSchedule,
  DEFAULT_MOE_MISSION_PHASES,
  DEFAULT_MOE_PAYMENT_SCHEDULE,
  DEFAULT_MOE_CLAUSES
} from './moeContractConfig';

export interface MOEDefaultConfig {
  template: 'moe_architecture_contract';
  version: number;
  mission_phases: MOEMissionPhase[];
  payment_schedule: MOEPaymentSchedule[];
  clauses: Record<string, string>;
  settings: {
    minimum_fee: number;
    extra_meeting_rate: number;
    insurance_company: string;
    insurance_policy_number: string;
  };
}

/**
 * Get the default MOE configuration for architecture contracts
 */
export function getDefaultMOEConfig(): MOEDefaultConfig {
  return {
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
}

/**
 * Check if a contract type has MOE configuration
 */
export function hasMOEConfig(defaultClauses: any): boolean {
  return defaultClauses?.template === 'moe_architecture_contract' ||
         defaultClauses?.mission_phases?.length > 0;
}

/**
 * Merge existing configuration with MOE defaults
 */
export function mergeMOEConfig(existingConfig: any): MOEDefaultConfig {
  const defaults = getDefaultMOEConfig();
  
  if (!existingConfig) {
    return defaults;
  }
  
  return {
    template: 'moe_architecture_contract',
    version: existingConfig.version || defaults.version,
    mission_phases: existingConfig.mission_phases?.length > 0 
      ? existingConfig.mission_phases 
      : defaults.mission_phases,
    payment_schedule: existingConfig.payment_schedule?.length > 0 
      ? existingConfig.payment_schedule 
      : defaults.payment_schedule,
    clauses: {
      ...defaults.clauses,
      ...(existingConfig.clauses || {})
    },
    settings: {
      ...defaults.settings,
      ...(existingConfig.settings || {})
    }
  };
}

/**
 * Architecture-based contract type codes
 */
export const ARCHITECTURE_CONTRACT_CODES = ['ARCHI', 'MOE', 'INTERIOR', 'SCENO'];

/**
 * Communication-based contract type codes
 */
export const COMMUNICATION_CONTRACT_CODES = ['CAMP360', 'BRAND', 'DIGITAL', 'EVENT', 'VIDEO', 'ACCORD', 'PUB', 'COM'];

/**
 * Check if a contract type code is architecture-based
 */
export function isArchitectureContractType(code: string): boolean {
  return ARCHITECTURE_CONTRACT_CODES.includes(code?.toUpperCase());
}

/**
 * Convert MOE config to quote lines for the editor
 */
export function moeConfigToQuoteLines(config: MOEDefaultConfig, totalHT: number): Array<{
  id: string;
  phase_code: string;
  phase_name: string;
  description: string;
  percentage: number;
  amount: number;
  is_included: boolean;
  is_optional: boolean;
  deliverables: string[];
}> {
  return config.mission_phases.map((phase, index) => ({
    id: `phase-${index}-${Date.now()}`,
    phase_code: phase.code,
    phase_name: phase.name,
    description: phase.description,
    percentage: phase.percentage,
    amount: (phase.percentage / 100) * totalHT,
    is_included: phase.is_included,
    is_optional: phase.is_optional || false,
    deliverables: phase.deliverables
  }));
}

/**
 * Convert document general_conditions JSON back to MOE config
 */
export function parseDocumentMOEConfig(generalConditions: string | null): Partial<MOEDefaultConfig> | null {
  if (!generalConditions) return null;
  
  try {
    const parsed = JSON.parse(generalConditions);
    return parsed;
  } catch {
    return null;
  }
}
