// Default deliverables per phase type

export interface DefaultDeliverable {
  name: string;
  description?: string;
}

export const DEFAULT_DELIVERABLES: Record<string, DefaultDeliverable[]> = {
  // Interior Design phases
  "Brief & Programme": [
    { name: "Cahier des charges", description: "Document de synthèse des besoins client" },
    { name: "Programme fonctionnel", description: "Liste détaillée des espaces et fonctions" },
  ],
  "Esquisse": [
    { name: "Planches d'ambiance", description: "Moodboards et références visuelles" },
    { name: "Plans d'esquisse", description: "Premiers plans d'aménagement" },
    { name: "Estimatif préliminaire", description: "Première estimation budgétaire" },
  ],
  "APS": [
    { name: "Plans APS", description: "Plans d'avant-projet sommaire" },
    { name: "Coupes et élévations APS", description: "Vues en coupe principales" },
    { name: "Estimatif APS", description: "Estimation détaillée par lot" },
  ],
  "APD": [
    { name: "Plans APD", description: "Plans d'avant-projet définitif" },
    { name: "Coupes et élévations APD", description: "Vues détaillées" },
    { name: "Carnets de détails", description: "Détails d'exécution" },
    { name: "Estimatif APD", description: "Chiffrage définitif" },
  ],
  "PRO": [
    { name: "Plans d'exécution", description: "Plans techniques détaillés" },
    { name: "CCTP", description: "Cahier des clauses techniques particulières" },
    { name: "Quantitatif", description: "Métrés et quantités" },
  ],
  "Consultation": [
    { name: "DCE", description: "Dossier de consultation des entreprises" },
    { name: "Analyse des offres", description: "Comparatif des devis" },
    { name: "Marchés", description: "Contrats entreprises" },
  ],
  "Chantier": [
    { name: "Planning travaux", description: "Planning d'exécution" },
    { name: "Comptes-rendus de chantier", description: "CR des réunions de chantier" },
    { name: "Situations de travaux", description: "Avancements et facturations" },
  ],
  "Réception": [
    { name: "PV de réception", description: "Procès-verbal de réception" },
    { name: "DOE", description: "Dossier des ouvrages exécutés" },
    { name: "DIUO", description: "Dossier d'intervention ultérieure" },
  ],
  
  // Architecture phases
  "Faisabilité": [
    { name: "Étude de faisabilité", description: "Analyse des contraintes" },
    { name: "Note de synthèse", description: "Conclusions et recommandations" },
  ],
  "PC": [
    { name: "Dossier PC", description: "Dossier complet permis de construire" },
    { name: "Notice architecturale", description: "Description du projet" },
    { name: "Plans PC", description: "Plans réglementaires" },
    { name: "Récépissé de dépôt", description: "Confirmation de dépôt en mairie" },
  ],
  "DCE": [
    { name: "DCE complet", description: "Dossier de consultation" },
    { name: "CCTP tous lots", description: "Cahiers des charges techniques" },
    { name: "Planning prévisionnel", description: "Planning général" },
  ],
  "ACT": [
    { name: "Analyse des offres", description: "Comparatif des entreprises" },
    { name: "Rapport d'analyse", description: "Recommandations" },
    { name: "Contrats de travaux", description: "Marchés signés" },
  ],
  "VISA": [
    { name: "Visas études", description: "Validation des études d'exécution" },
    { name: "Plans de synthèse", description: "Synthèse tous corps d'état" },
  ],
  "DET": [
    { name: "Comptes-rendus", description: "CR réunions de chantier" },
    { name: "OPR", description: "Opérations préalables à la réception" },
    { name: "Réserves", description: "Liste des réserves" },
  ],
  "AOR": [
    { name: "PV de réception", description: "Procès-verbal" },
    { name: "Levée de réserves", description: "Suivi des réserves" },
    { name: "DOE/DIUO", description: "Dossiers ouvrages exécutés" },
  ],
  
  // Scenography phases
  "Conception": [
    { name: "Note d'intention", description: "Concept et parti pris" },
    { name: "Références visuelles", description: "Moodboard et inspirations" },
  ],
  "Scénario": [
    { name: "Scénario de visite", description: "Parcours et narration" },
    { name: "Plan de parcours", description: "Circulation visiteur" },
  ],
  "Design graphique": [
    { name: "Charte graphique", description: "Identité visuelle" },
    { name: "Signalétique", description: "Plan de signalétique" },
  ],
  "Production": [
    { name: "Plans de fabrication", description: "Plans techniques" },
    { name: "Fiches produits", description: "Spécifications techniques" },
  ],
  "Montage": [
    { name: "Planning montage", description: "Planning d'installation" },
    { name: "PV de montage", description: "Validation du montage" },
  ],
  "Inauguration": [
    { name: "Dossier de presse", description: "Communication" },
    { name: "Photos finales", description: "Reportage photographique" },
  ],
};

export function getDefaultDeliverablesForPhase(phaseName: string): DefaultDeliverable[] {
  return DEFAULT_DELIVERABLES[phaseName] || [];
}
