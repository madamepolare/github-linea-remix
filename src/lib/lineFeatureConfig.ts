// Configuration des fonctionnalités de lignes par type de contrat
// Ce système permet d'activer/désactiver des fonctionnalités selon le type de document

export interface LineFeatureFlags {
  // Affichage du pourcentage d'honoraires (architecture/MOP)
  showPercentageFee: boolean;
  
  // Affichage des coûts et marges
  showCostAndMargin: boolean;
  
  // Affichage des jours estimés
  showEstimatedDays: boolean;
  
  // Affichage du prix d'achat
  showPurchasePrice: boolean;
  
  // Affichage des compétences/rôles
  showSkillAssignment: boolean;
  
  // Affichage de l'assignation membre
  showMemberAssignment: boolean;
  
  // Affichage des dates début/fin
  showDates: boolean;
  
  // Affichage de la récurrence
  showRecurrence: boolean;
  
  // Affichage du type de facturation
  showBillingType: boolean;
  
  // Affichage de la référence BPU
  showPricingRef: boolean;
  
  // Affichage des livrables
  showDeliverables: boolean;
  
  // Affichage du résumé des marges
  showMarginSummary: boolean;
  
  // Mode de calcul des montants
  amountCalculation: 'percentage' | 'quantity_price' | 'fixed';
}

// Configurations par défaut selon le type de contrat
export const DEFAULT_LINE_FEATURES: Record<string, LineFeatureFlags> = {
  // Architecture - Loi MOP avec phases en %
  ARCHI: {
    showPercentageFee: true,
    showCostAndMargin: true,
    showEstimatedDays: true,
    showPurchasePrice: true,
    showSkillAssignment: true,
    showMemberAssignment: true,
    showDates: true,
    showRecurrence: false,
    showBillingType: false,
    showPricingRef: false,
    showDeliverables: true,
    showMarginSummary: true,
    amountCalculation: 'percentage',
  },
  
  // Architecture d'intérieur - Mix phases/lignes
  INTERIOR: {
    showPercentageFee: false,
    showCostAndMargin: true,
    showEstimatedDays: true,
    showPurchasePrice: true,
    showSkillAssignment: true,
    showMemberAssignment: true,
    showDates: true,
    showRecurrence: false,
    showBillingType: true,
    showPricingRef: false,
    showDeliverables: true,
    showMarginSummary: true,
    amountCalculation: 'quantity_price',
  },
  
  // Scénographie - Production + lignes libres
  SCENO: {
    showPercentageFee: false,
    showCostAndMargin: true,
    showEstimatedDays: true,
    showPurchasePrice: true,
    showSkillAssignment: true,
    showMemberAssignment: true,
    showDates: true,
    showRecurrence: false,
    showBillingType: true,
    showPricingRef: true,
    showDeliverables: true,
    showMarginSummary: true,
    amountCalculation: 'quantity_price',
  },
  
  // Publicité - Lignes simples
  PUB: {
    showPercentageFee: false,
    showCostAndMargin: true,
    showEstimatedDays: false,
    showPurchasePrice: true,
    showSkillAssignment: false,
    showMemberAssignment: true,
    showDates: true,
    showRecurrence: false,
    showBillingType: true,
    showPricingRef: false,
    showDeliverables: true,
    showMarginSummary: true,
    amountCalculation: 'quantity_price',
  },
  
  // Branding - Lignes simples
  BRAND: {
    showPercentageFee: false,
    showCostAndMargin: true,
    showEstimatedDays: true,
    showPurchasePrice: true,
    showSkillAssignment: true,
    showMemberAssignment: true,
    showDates: false,
    showRecurrence: false,
    showBillingType: true,
    showPricingRef: false,
    showDeliverables: true,
    showMarginSummary: true,
    amountCalculation: 'quantity_price',
  },
  
  // Web/Digital - Lignes avec récurrence possible
  WEB: {
    showPercentageFee: false,
    showCostAndMargin: true,
    showEstimatedDays: true,
    showPurchasePrice: true,
    showSkillAssignment: true,
    showMemberAssignment: true,
    showDates: true,
    showRecurrence: true,
    showBillingType: true,
    showPricingRef: false,
    showDeliverables: true,
    showMarginSummary: true,
    amountCalculation: 'quantity_price',
  },
};

// Configuration par défaut si le type n'existe pas
export const FALLBACK_LINE_FEATURES: LineFeatureFlags = {
  showPercentageFee: false,
  showCostAndMargin: true,
  showEstimatedDays: true,
  showPurchasePrice: true,
  showSkillAssignment: true,
  showMemberAssignment: true,
  showDates: true,
  showRecurrence: false,
  showBillingType: true,
  showPricingRef: false,
  showDeliverables: true,
  showMarginSummary: true,
  amountCalculation: 'quantity_price',
};

// Helper pour obtenir les features d'un type de contrat
export function getLineFeatures(contractTypeCode?: string): LineFeatureFlags {
  if (!contractTypeCode) return FALLBACK_LINE_FEATURES;
  return DEFAULT_LINE_FEATURES[contractTypeCode] || FALLBACK_LINE_FEATURES;
}

// Labels pour l'interface de configuration
export const LINE_FEATURE_LABELS: Record<keyof LineFeatureFlags, string> = {
  showPercentageFee: 'Pourcentage d\'honoraires',
  showCostAndMargin: 'Coûts et marges',
  showEstimatedDays: 'Jours estimés',
  showPurchasePrice: 'Prix d\'achat',
  showSkillAssignment: 'Compétences',
  showMemberAssignment: 'Assignation membre',
  showDates: 'Dates début/fin',
  showRecurrence: 'Récurrence',
  showBillingType: 'Type de facturation',
  showPricingRef: 'Référence BPU',
  showDeliverables: 'Livrables',
  showMarginSummary: 'Résumé des marges',
  amountCalculation: 'Mode de calcul',
};

export const LINE_FEATURE_DESCRIPTIONS: Record<keyof LineFeatureFlags, string> = {
  showPercentageFee: 'Affiche le % d\'honoraires (loi MOP)',
  showCostAndMargin: 'Affiche le calcul coût/marge sur les lignes',
  showEstimatedDays: 'Affiche l\'estimation en jours',
  showPurchasePrice: 'Affiche le prix d\'achat/coût interne',
  showSkillAssignment: 'Permet d\'assigner des compétences',
  showMemberAssignment: 'Permet d\'assigner un membre',
  showDates: 'Affiche les champs date début/fin',
  showRecurrence: 'Affiche les options de récurrence',
  showBillingType: 'Affiche le type de facturation',
  showPricingRef: 'Affiche la référence au BPU',
  showDeliverables: 'Permet de définir les livrables',
  showMarginSummary: 'Affiche le résumé des marges en bas',
  amountCalculation: 'Comment les montants sont calculés',
};

export const AMOUNT_CALCULATION_OPTIONS = [
  { value: 'percentage', label: 'Pourcentage (honoraires MOP)' },
  { value: 'quantity_price', label: 'Quantité × Prix unitaire' },
  { value: 'fixed', label: 'Montant fixe' },
];
