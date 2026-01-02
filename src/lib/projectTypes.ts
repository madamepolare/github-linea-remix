// Types for project configuration

export type ProjectType = "interior" | "architecture" | "scenography";

export type PhaseStatus = "pending" | "in_progress" | "completed";

export interface ProjectTypeConfig {
  value: ProjectType;
  label: string;
  icon: string;
  description: string;
}

export const PROJECT_TYPES: ProjectTypeConfig[] = [
  { 
    value: "interior", 
    label: "Intérieur", 
    icon: "Sofa",
    description: "Aménagement intérieur, design d'espace"
  },
  { 
    value: "architecture", 
    label: "Architecture", 
    icon: "Building2",
    description: "Construction, rénovation, extension"
  },
  { 
    value: "scenography", 
    label: "Scénographie", 
    icon: "Theater",
    description: "Exposition, événementiel, muséographie"
  },
];

export const DEFAULT_PHASES: Record<ProjectType, { name: string; description?: string }[]> = {
  interior: [
    { name: "Brief & Programme", description: "Définition des besoins et du programme" },
    { name: "Esquisse", description: "Premières propositions conceptuelles" },
    { name: "APS", description: "Avant-Projet Sommaire" },
    { name: "APD", description: "Avant-Projet Définitif" },
    { name: "PRO", description: "Projet - Plans d'exécution" },
    { name: "Consultation", description: "Consultation des entreprises" },
    { name: "Chantier", description: "Suivi de réalisation" },
    { name: "Réception", description: "Livraison et réception des travaux" }
  ],
  architecture: [
    { name: "Faisabilité", description: "Études préliminaires" },
    { name: "Esquisse", description: "Premières propositions" },
    { name: "APS", description: "Avant-Projet Sommaire" },
    { name: "APD", description: "Avant-Projet Définitif" },
    { name: "PC", description: "Permis de Construire" },
    { name: "PRO", description: "Projet technique" },
    { name: "DCE", description: "Dossier de Consultation des Entreprises" },
    { name: "ACT", description: "Assistance à la passation des Contrats de Travaux" },
    { name: "VISA", description: "Visa des études d'exécution" },
    { name: "DET", description: "Direction de l'Exécution des Travaux" },
    { name: "AOR", description: "Assistance aux Opérations de Réception" },
    { name: "Réception", description: "Livraison finale" }
  ],
  scenography: [
    { name: "Conception", description: "Concept et intention artistique" },
    { name: "Scénario", description: "Parcours et narration" },
    { name: "Design graphique", description: "Identité visuelle et signalétique" },
    { name: "Production", description: "Fabrication des éléments" },
    { name: "Montage", description: "Installation sur site" },
    { name: "Inauguration", description: "Ouverture au public" }
  ]
};

export const PHASE_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#F97316", // orange
  "#6366F1", // indigo
  "#14B8A6", // teal
  "#A855F7"  // purple
];

export const PHASE_STATUS_CONFIG: Record<PhaseStatus, { label: string; color: string }> = {
  pending: { label: "À venir", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "En cours", color: "bg-primary text-primary-foreground" },
  completed: { label: "Terminée", color: "bg-emerald-500 text-white" }
};

export const MOE_ROLES = [
  { value: "architecte", label: "Architecte" },
  { value: "architecte_interieur", label: "Architecte d'intérieur" },
  { value: "bet_structure", label: "BET Structure" },
  { value: "bet_fluides", label: "BET Fluides" },
  { value: "bet_electricite", label: "BET Électricité" },
  { value: "bet_thermique", label: "BET Thermique" },
  { value: "bet_acoustique", label: "BET Acoustique" },
  { value: "economiste", label: "Économiste" },
  { value: "paysagiste", label: "Paysagiste" },
  { value: "scenographe", label: "Scénographe" },
  { value: "graphiste", label: "Graphiste" },
  { value: "eclairagiste", label: "Éclairagiste" },
  { value: "opc", label: "OPC" },
  { value: "csps", label: "CSPS" },
  { value: "controle_technique", label: "Bureau de contrôle" },
  { value: "geometre", label: "Géomètre" },
  { value: "autre", label: "Autre" }
];

export const LOT_STATUS = [
  { value: "pending", label: "En attente", color: "#6B7280" },
  { value: "in_progress", label: "En cours", color: "#3B82F6" },
  { value: "completed", label: "Terminé", color: "#10B981" },
  { value: "on_hold", label: "Suspendu", color: "#F59E0B" }
];

export const OBSERVATION_PRIORITY = [
  { value: "low", label: "Faible", color: "bg-slate-500" },
  { value: "normal", label: "Normal", color: "bg-blue-500" },
  { value: "high", label: "Important", color: "bg-amber-500" },
  { value: "critical", label: "Critique", color: "bg-red-500" }
];

export const OBSERVATION_STATUS = [
  { value: "open", label: "Ouverte" },
  { value: "in_progress", label: "En cours" },
  { value: "resolved", label: "Résolue" }
];

export const DELIVERABLE_STATUS = [
  { value: "pending", label: "En attente", color: "#6B7280" },
  { value: "in_progress", label: "En cours", color: "#F59E0B" },
  { value: "delivered", label: "Livré", color: "#3B82F6" },
  { value: "validated", label: "Validé", color: "#10B981" },
];

export function getProjectTypeConfig(type: ProjectType): ProjectTypeConfig {
  return PROJECT_TYPES.find(t => t.value === type) || PROJECT_TYPES[0];
}

export function generateDefaultPhases(
  projectType: ProjectType, 
  projectId: string, 
  workspaceId: string,
  projectStartDate?: string | null,
  projectEndDate?: string | null
) {
  const phases = DEFAULT_PHASES[projectType];
  const phaseCount = phases.length;
  
  // Calculate phase dates based on project dates
  let phaseDates: { start_date: string | null; end_date: string | null }[] = [];
  
  if (projectStartDate && projectEndDate) {
    const startDate = new Date(projectStartDate);
    const endDate = new Date(projectEndDate);
    const totalDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysPerPhase = Math.floor(totalDays / phaseCount);
    
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < phaseCount; i++) {
      const phaseStart = new Date(currentDate);
      
      // Last phase extends to project end date
      const phaseEnd = i === phaseCount - 1 
        ? new Date(endDate)
        : new Date(currentDate.getTime() + daysPerPhase * 24 * 60 * 60 * 1000);
      
      phaseDates.push({
        start_date: phaseStart.toISOString().split('T')[0],
        end_date: phaseEnd.toISOString().split('T')[0],
      });
      
      // Next phase starts the day after
      currentDate = new Date(phaseEnd.getTime() + 24 * 60 * 60 * 1000);
    }
  } else {
    // No dates provided
    phaseDates = phases.map(() => ({ start_date: null, end_date: null }));
  }
  
  return phases.map((phase, index) => ({
    project_id: projectId,
    workspace_id: workspaceId,
    name: phase.name,
    description: phase.description,
    sort_order: index,
    color: PHASE_COLORS[index % PHASE_COLORS.length],
    status: index === 0 ? "in_progress" : "pending",
    start_date: phaseDates[index].start_date,
    end_date: phaseDates[index].end_date,
  }));
}
