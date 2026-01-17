// Project Categories - Commercial/Billing Model Classification
// Categories are now fully dynamic and stored in workspace_settings

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

// Default features fallback for unknown categories
export const DEFAULT_CATEGORY_FEATURES: ProjectCategoryFeatures = {
  hasBudget: true,
  hasEndDate: true,
  hasMonthlyBudget: false,
  hasAutoRenew: false,
  isBillable: true,
  hasPhases: true,
  hasDeliverables: true,
};

// Default categories for initial setup (used only when no categories exist in DB)
export const DEFAULT_CATEGORIES: ProjectCategoryConfig[] = [
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
