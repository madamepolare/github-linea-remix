// Centralized mapping from contract type codes to valid project types
// This ensures consistency across the commercial module

import type { ProjectType } from './commercialTypes';

/**
 * Maps contract type codes to valid ProjectType values.
 * The database only accepts: 'interior' | 'architecture' | 'scenography'
 */
export const CONTRACT_CODE_TO_PROJECT_TYPE: Record<string, ProjectType> = {
  // Architecture disciplines
  'ARCHI': 'architecture',
  'ARCHITECTURE': 'architecture',
  
  // Interior design
  'INTERIOR': 'interior',
  'DECO': 'interior',
  'DECORATION': 'interior',
  
  // Scenography
  'SCENO': 'scenography',
  'SCENOGRAPHIE': 'scenography',
  'EXPO': 'scenography',
  'MUSEUM': 'scenography',
  
  // Communication disciplines -> map to 'interior' as default for now
  'PUB': 'interior',
  'BRAND': 'interior',
  'WEB': 'interior',
  'DIGITAL': 'interior',
  'COMMUNICATION': 'interior',
};

/**
 * Converts a contract type code to a valid ProjectType.
 * Falls back to 'interior' if the code is not recognized.
 */
export function getProjectTypeFromCode(code: string | undefined | null): ProjectType {
  if (!code) return 'interior';
  
  const normalizedCode = code.toUpperCase().trim();
  return CONTRACT_CODE_TO_PROJECT_TYPE[normalizedCode] || 'interior';
}

/**
 * Validates if a string is a valid ProjectType.
 * If not, returns the fallback.
 */
export function ensureValidProjectType(value: string | undefined | null): ProjectType {
  const validTypes: ProjectType[] = ['interior', 'architecture', 'scenography'];
  if (value && validTypes.includes(value as ProjectType)) {
    return value as ProjectType;
  }
  return 'interior';
}
