// Fee calculation based on Ordre des Architectes guidelines
// Reference: https://www.architectes.org/

export interface FeeScale {
  minBudget: number;
  maxBudget: number;
  percentageNew: number;
  percentageRenovation: number;
}

// Barème indicatif Ordre des Architectes (simplified)
export const ORDRE_FEE_SCALES: FeeScale[] = [
  { minBudget: 0, maxBudget: 50000, percentageNew: 14, percentageRenovation: 16 },
  { minBudget: 50000, maxBudget: 100000, percentageNew: 12, percentageRenovation: 14 },
  { minBudget: 100000, maxBudget: 200000, percentageNew: 11, percentageRenovation: 13 },
  { minBudget: 200000, maxBudget: 500000, percentageNew: 10, percentageRenovation: 12 },
  { minBudget: 500000, maxBudget: 1000000, percentageNew: 9, percentageRenovation: 11 },
  { minBudget: 1000000, maxBudget: 2000000, percentageNew: 8, percentageRenovation: 10 },
  { minBudget: 2000000, maxBudget: 5000000, percentageNew: 7, percentageRenovation: 9 },
  { minBudget: 5000000, maxBudget: Infinity, percentageNew: 6, percentageRenovation: 8 },
];

export type ProjectNature = "new" | "renovation" | "extension" | "rehabilitation";
export type MissionType = "complete" | "partial" | "execution" | "conception";

export const PROJECT_NATURE_LABELS: Record<ProjectNature, string> = {
  new: "Construction neuve",
  renovation: "Rénovation",
  extension: "Extension",
  rehabilitation: "Réhabilitation",
};

export const MISSION_TYPE_LABELS: Record<MissionType, string> = {
  complete: "Mission complète",
  partial: "Mission partielle",
  execution: "Mission exécution",
  conception: "Mission conception",
};

// Mission coefficients (what portion of complete fee)
export const MISSION_COEFFICIENTS: Record<MissionType, number> = {
  complete: 1.0,
  partial: 0.6,
  execution: 0.45,
  conception: 0.55,
};

// Phase breakdown for complete mission (MOP law phases)
export const PHASE_PERCENTAGES = {
  ESQ: 3, // Esquisse
  APS: 9, // Avant-Projet Sommaire
  APD: 15, // Avant-Projet Définitif
  PRO: 22, // Projet
  ACT: 6, // Assistance Contrats Travaux
  EXE: 20, // Études d'Exécution (if included)
  VISA: 10, // Visa (if EXE not included)
  DET: 25, // Direction Exécution Travaux
  AOR: 5, // Assistance Opérations Réception
} as const;

export interface FeeCalculationInput {
  constructionBudget: number;
  projectNature: ProjectNature;
  missionType: MissionType;
  includeEXE?: boolean; // Include EXE phase or just VISA
  complexity?: "simple" | "normal" | "complex"; // Complexity factor
}

export interface FeeCalculationResult {
  basePercentage: number;
  adjustedPercentage: number;
  missionCoefficient: number;
  totalFeeHT: number;
  totalFeeTTC: number;
  phaseBreakdown: { phase: string; percentage: number; amount: number }[];
  notes: string[];
}

/**
 * Calculate architectural fees based on Ordre des Architectes guidelines
 */
export function calculateFees(input: FeeCalculationInput): FeeCalculationResult {
  const { constructionBudget, projectNature, missionType, includeEXE = false, complexity = "normal" } = input;
  
  const notes: string[] = [];
  
  // Find applicable scale
  const scale = ORDRE_FEE_SCALES.find(
    s => constructionBudget >= s.minBudget && constructionBudget < s.maxBudget
  ) || ORDRE_FEE_SCALES[ORDRE_FEE_SCALES.length - 1];
  
  // Get base percentage based on project nature
  const isRenovation = projectNature === "renovation" || projectNature === "rehabilitation";
  const basePercentage = isRenovation ? scale.percentageRenovation : scale.percentageNew;
  
  // Apply complexity factor
  let complexityFactor = 1.0;
  if (complexity === "simple") {
    complexityFactor = 0.85;
    notes.push("Coefficient de simplicité appliqué (-15%)");
  } else if (complexity === "complex") {
    complexityFactor = 1.20;
    notes.push("Coefficient de complexité appliqué (+20%)");
  }
  
  // Apply mission coefficient
  const missionCoefficient = MISSION_COEFFICIENTS[missionType];
  if (missionType !== "complete") {
    notes.push(`Mission ${MISSION_TYPE_LABELS[missionType]} (${Math.round(missionCoefficient * 100)}% de mission complète)`);
  }
  
  // Calculate adjusted percentage
  const adjustedPercentage = basePercentage * complexityFactor * missionCoefficient;
  
  // Calculate total fee
  const totalFeeHT = constructionBudget * (adjustedPercentage / 100);
  const totalFeeTTC = totalFeeHT * 1.20; // 20% TVA
  
  // Calculate phase breakdown
  const phaseBreakdown: { phase: string; percentage: number; amount: number }[] = [];
  
  if (missionType === "complete" || missionType === "partial") {
    const phases = ["ESQ", "APS", "APD", "PRO", "ACT"];
    
    // Add EXE or VISA based on input
    if (includeEXE) {
      phases.push("EXE");
    } else {
      phases.push("VISA");
    }
    
    phases.push("DET", "AOR");
    
    // Filter phases based on mission type
    const applicablePhases = missionType === "partial" 
      ? phases.filter(p => ["ESQ", "APS", "APD", "PRO"].includes(p))
      : phases;
    
    for (const phase of applicablePhases) {
      const phasePercent = PHASE_PERCENTAGES[phase as keyof typeof PHASE_PERCENTAGES];
      const phaseAmount = totalFeeHT * (phasePercent / 100);
      phaseBreakdown.push({
        phase,
        percentage: phasePercent,
        amount: phaseAmount,
      });
    }
  }
  
  if (isRenovation) {
    notes.push("Majoration rénovation/réhabilitation appliquée");
  }
  
  return {
    basePercentage,
    adjustedPercentage,
    missionCoefficient,
    totalFeeHT,
    totalFeeTTC,
    phaseBreakdown,
    notes,
  };
}

/**
 * Get suggested fee range for a budget
 */
export function getSuggestedFeeRange(budget: number, projectNature: ProjectNature): { min: number; max: number } {
  const simpleResult = calculateFees({
    constructionBudget: budget,
    projectNature,
    missionType: "complete",
    complexity: "simple",
  });
  
  const complexResult = calculateFees({
    constructionBudget: budget,
    projectNature,
    missionType: "complete",
    complexity: "complex",
  });
  
  return {
    min: simpleResult.totalFeeHT,
    max: complexResult.totalFeeHT,
  };
}

/**
 * Format currency in French format
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Surface calculations (SHON, SHAB, SDP)
 */
export interface SurfaceCalculation {
  shon: number; // Surface Hors Œuvre Nette (deprecated but still used)
  shab: number; // Surface HABitable
  sdp: number; // Surface De Plancher (reference since 2012)
  su: number; // Surface Utile
  taxable: number; // Taxable surface for permits
}

export interface SurfaceInput {
  grossFloorArea: number; // Surface brute
  wallThickness: number; // Épaisseur murs (default ~10%)
  commonAreas: number; // Parties communes
  technicalAreas: number; // Locaux techniques
  parkingAreas: number; // Stationnement
  basementAreas: number; // Sous-sols non aménageables
  atticAreas: number; // Combles non aménageables
  terracesBalconies: number; // Terrasses/balcons (50% counted)
}

export function calculateSurfaces(input: SurfaceInput): SurfaceCalculation {
  const {
    grossFloorArea,
    wallThickness,
    commonAreas,
    technicalAreas,
    parkingAreas,
    basementAreas,
    atticAreas,
    terracesBalconies,
  } = input;
  
  // SDP = Gross - walls - parking - technical < 1.80m height
  const sdp = grossFloorArea - wallThickness - parkingAreas - technicalAreas;
  
  // SHAB = SDP - common areas - basement - attics + 50% terraces
  const shab = sdp - commonAreas - basementAreas - atticAreas + (terracesBalconies * 0.5);
  
  // SHON (legacy) ≈ SDP
  const shon = sdp;
  
  // SU = usable area (typically 85-90% of SHAB)
  const su = shab * 0.87;
  
  // Taxable = SDP for tax purposes
  const taxable = sdp;
  
  return {
    shon: Math.round(shon * 100) / 100,
    shab: Math.round(shab * 100) / 100,
    sdp: Math.round(sdp * 100) / 100,
    su: Math.round(su * 100) / 100,
    taxable: Math.round(taxable * 100) / 100,
  };
}
