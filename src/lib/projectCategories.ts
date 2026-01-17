// Project Categories - Commercial/Billing Model Classification
// Categories are now dynamic and stored in workspace_settings

// ProjectCategory is now a string type since categories are user-defined
export type ProjectCategory = string;

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
  key: string;
  label: string;
  labelShort: string;
  description: string;
  icon: string;
  color: string;
  features: ProjectCategoryFeatures;
}

// Default categories for reference (actual data comes from database)
export const PROJECT_CATEGORIES: ProjectCategoryConfig[] = [
  {
    key: 'standard',
    label: 'Projet client',
    labelShort: 'Client',
    description: 'Projet facturable avec budget et planning définis',
    icon: 'Briefcase',
    color: '#3B82F6',
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
    color: '#6B7280',
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
];

// Default features fallback
const DEFAULT_FEATURES: ProjectCategoryFeatures = {
  hasBudget: true,
  hasEndDate: true,
  hasMonthlyBudget: false,
  hasAutoRenew: false,
  isBillable: true,
  hasPhases: true,
  hasDeliverables: true,
};

// Helper functions - these now work with any string category
export function getProjectCategoryConfig(category: string): ProjectCategoryConfig {
  const found = PROJECT_CATEGORIES.find(c => c.key === category);
  return found || {
    key: category,
    label: category,
    labelShort: category,
    description: '',
    icon: 'Briefcase',
    color: '#3B82F6',
    features: DEFAULT_FEATURES,
  };
}

export function getProjectCategoryLabel(category: string): string {
  return getProjectCategoryConfig(category).label;
}

export function getProjectCategoryColor(category: string): string {
  return getProjectCategoryConfig(category).color;
}

export function getProjectCategoryFeatures(category: string): ProjectCategoryFeatures {
  return getProjectCategoryConfig(category).features;
}

// Check if a category supports a specific feature
export function categoryHasFeature(
  category: string, 
  feature: keyof ProjectCategoryFeatures
): boolean {
  return getProjectCategoryFeatures(category)[feature];
}
