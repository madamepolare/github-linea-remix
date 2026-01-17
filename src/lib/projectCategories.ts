// Project Categories - Commercial/Billing Model Classification
// These are fixed categories that define the economic behavior of projects

export type ProjectCategory = 'standard' | 'internal' | 'monthly_fee' | 'maintenance';

export interface ProjectCategoryFeatures {
  hasBudget: boolean;
  hasEndDate: boolean;
  hasMonthlyBudget: boolean;
  hasAutoRenew: boolean;
  isBillable: boolean;
  hasPhases: boolean;
  hasDeliverables: boolean;
}

export interface ProjectCategoryConfig {
  key: ProjectCategory;
  label: string;
  labelShort: string;
  description: string;
  icon: string;
  color: string;
  features: ProjectCategoryFeatures;
}

export const PROJECT_CATEGORIES: ProjectCategoryConfig[] = [
  {
    key: 'standard',
    label: 'Projet client',
    labelShort: 'Client',
    description: 'Projet facturable avec budget et planning définis',
    icon: 'Briefcase',
    color: '#3B82F6', // blue
    features: {
      hasBudget: true,
      hasEndDate: true,
      hasMonthlyBudget: false,
      hasAutoRenew: false,
      isBillable: true,
      hasPhases: true,
      hasDeliverables: true,
    }
  },
  {
    key: 'internal',
    label: 'Projet interne',
    labelShort: 'Interne',
    description: 'Projet non facturable (R&D, admin, interne)',
    icon: 'Building',
    color: '#6B7280', // gray
    features: {
      hasBudget: false,
      hasEndDate: false,
      hasMonthlyBudget: false,
      hasAutoRenew: false,
      isBillable: false,
      hasPhases: false,
      hasDeliverables: false,
    }
  },
  {
    key: 'monthly_fee',
    label: 'Design Service',
    labelShort: 'Monthly',
    description: 'Contrat mensuel récurrent (Monthly Fee)',
    icon: 'RefreshCw',
    color: '#10B981', // emerald
    features: {
      hasBudget: false,
      hasEndDate: false,
      hasMonthlyBudget: true,
      hasAutoRenew: true,
      isBillable: true,
      hasPhases: false,
      hasDeliverables: true,
    }
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    labelShort: 'Maintenance',
    description: 'Contrat de maintenance avec interventions ponctuelles',
    icon: 'Wrench',
    color: '#F59E0B', // amber
    features: {
      hasBudget: false,
      hasEndDate: false,
      hasMonthlyBudget: true,
      hasAutoRenew: true,
      isBillable: true,
      hasPhases: false,
      hasDeliverables: false,
    }
  }
];

// Helper functions
export function getProjectCategoryConfig(category: ProjectCategory): ProjectCategoryConfig {
  return PROJECT_CATEGORIES.find(c => c.key === category) || PROJECT_CATEGORIES[0];
}

export function getProjectCategoryLabel(category: ProjectCategory): string {
  return getProjectCategoryConfig(category).label;
}

export function getProjectCategoryColor(category: ProjectCategory): string {
  return getProjectCategoryConfig(category).color;
}

export function getProjectCategoryFeatures(category: ProjectCategory): ProjectCategoryFeatures {
  return getProjectCategoryConfig(category).features;
}

// Check if a category supports a specific feature
export function categoryHasFeature(
  category: ProjectCategory, 
  feature: keyof ProjectCategoryFeatures
): boolean {
  return getProjectCategoryFeatures(category)[feature];
}
