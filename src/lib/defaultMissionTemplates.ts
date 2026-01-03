// Default mission templates for various project types
// These can be loaded into the quote_templates table

import { ProjectType } from './commercialTypes';

export interface MissionTemplatePhase {
  code: string;
  name: string;
  description: string;
  defaultPercentage: number;
  deliverables: string[];
  category: 'base' | 'complementary';
}

export interface MissionTemplate {
  id: string;
  name: string;
  description: string;
  projectType: ProjectType;
  phases: MissionTemplatePhase[];
}

// ==================== ARCHITECTURE ====================
export const ARCHITECTURE_TEMPLATES: MissionTemplate[] = [
  {
    id: 'archi-moe-complete',
    name: 'Mission MOE Complète',
    description: 'Mission de maîtrise d\'œuvre complète loi MOP - Construction neuve ou réhabilitation lourde',
    projectType: 'architecture',
    phases: [
      { code: 'ESQ', name: 'Esquisse', description: 'Études préliminaires et propositions architecturales', defaultPercentage: 5, deliverables: ['Plans d\'esquisse', 'Volumétrie 3D', 'Note d\'intention', 'Estimation préliminaire'], category: 'base' },
      { code: 'APS', name: 'Avant-Projet Sommaire', description: 'Définition des caractéristiques principales du projet', defaultPercentage: 10, deliverables: ['Plans APS', 'Coupes et façades', 'Notice descriptive', 'Estimation sommaire'], category: 'base' },
      { code: 'APD', name: 'Avant-Projet Définitif', description: 'Conception détaillée et arrêt des choix', defaultPercentage: 15, deliverables: ['Plans APD', 'Détails principaux', 'CCTP sommaire', 'Estimation définitive'], category: 'base' },
      { code: 'PC', name: 'Permis de Construire', description: 'Constitution du dossier de demande d\'autorisation', defaultPercentage: 5, deliverables: ['Dossier PC complet', 'Plans réglementaires', 'Insertion paysagère', 'Notice de sécurité'], category: 'base' },
      { code: 'PRO', name: 'Projet', description: 'Études de projet détaillées', defaultPercentage: 15, deliverables: ['Plans PRO', 'Détails techniques', 'CCTP détaillé', 'Quantitatif estimatif'], category: 'base' },
      { code: 'DCE', name: 'Dossier de Consultation', description: 'Documents de consultation des entreprises', defaultPercentage: 5, deliverables: ['DCE complet', 'DPGF', 'Planning prévisionnel', 'Règlement de consultation'], category: 'base' },
      { code: 'ACT', name: 'Assistance Marchés', description: 'Analyse des offres et mise au point des marchés', defaultPercentage: 5, deliverables: ['Analyse des offres', 'Rapport d\'analyse', 'Mise au point marchés', 'Ordres de service'], category: 'base' },
      { code: 'VISA', name: 'Visa', description: 'Examen et visa des études d\'exécution', defaultPercentage: 5, deliverables: ['Visa des plans EXE', 'Validation échantillons', 'Synthèse technique'], category: 'base' },
      { code: 'DET', name: 'Direction des Travaux', description: 'Direction, coordination et contrôle des travaux', defaultPercentage: 30, deliverables: ['Comptes-rendus de chantier', 'OPR', 'Suivi financier', 'Décomptes mensuels'], category: 'base' },
      { code: 'AOR', name: 'Assistance Réception', description: 'Assistance aux opérations de réception', defaultPercentage: 5, deliverables: ['PV de réception', 'Levée des réserves', 'DOE', 'DIUO'], category: 'base' },
    ]
  },
  {
    id: 'archi-conception-pc',
    name: 'Conception + Permis',
    description: 'Mission de conception jusqu\'à l\'obtention du permis de construire',
    projectType: 'architecture',
    phases: [
      { code: 'ESQ', name: 'Esquisse', description: 'Études préliminaires et propositions architecturales', defaultPercentage: 15, deliverables: ['Plans d\'esquisse', 'Volumétrie 3D', 'Note d\'intention'], category: 'base' },
      { code: 'APS', name: 'Avant-Projet Sommaire', description: 'Définition des caractéristiques principales', defaultPercentage: 25, deliverables: ['Plans APS', 'Coupes et façades', 'Notice descriptive'], category: 'base' },
      { code: 'APD', name: 'Avant-Projet Définitif', description: 'Conception détaillée', defaultPercentage: 35, deliverables: ['Plans APD', 'Détails principaux', 'Estimation définitive'], category: 'base' },
      { code: 'PC', name: 'Permis de Construire', description: 'Constitution du dossier PC', defaultPercentage: 25, deliverables: ['Dossier PC complet', 'Plans réglementaires', 'Insertion paysagère'], category: 'base' },
    ]
  },
  {
    id: 'archi-suivi-chantier',
    name: 'Suivi de Chantier Seul',
    description: 'Mission de direction et suivi des travaux uniquement',
    projectType: 'architecture',
    phases: [
      { code: 'VISA', name: 'Visa', description: 'Examen et visa des études d\'exécution', defaultPercentage: 10, deliverables: ['Visa des plans EXE', 'Validation échantillons'], category: 'base' },
      { code: 'DET', name: 'Direction des Travaux', description: 'Direction et coordination des travaux', defaultPercentage: 80, deliverables: ['Comptes-rendus', 'OPR', 'Suivi financier'], category: 'base' },
      { code: 'AOR', name: 'Assistance Réception', description: 'Assistance aux opérations de réception', defaultPercentage: 10, deliverables: ['PV de réception', 'Levée réserves', 'DOE'], category: 'base' },
    ]
  },
  {
    id: 'archi-extension',
    name: 'Extension / Surélévation',
    description: 'Mission pour extension ou surélévation de bâtiment existant',
    projectType: 'architecture',
    phases: [
      { code: 'DIAG', name: 'Diagnostic Existant', description: 'Relevé et analyse de l\'existant', defaultPercentage: 10, deliverables: ['Plans de relevé', 'Diagnostic structure', 'Rapport d\'analyse'], category: 'base' },
      { code: 'ESQ', name: 'Esquisse', description: 'Propositions d\'extension', defaultPercentage: 10, deliverables: ['Plans d\'esquisse', 'Volumétrie 3D', 'Note d\'intention'], category: 'base' },
      { code: 'APS', name: 'Avant-Projet Sommaire', description: 'Développement du projet', defaultPercentage: 15, deliverables: ['Plans APS', 'Coupes', 'Notice descriptive'], category: 'base' },
      { code: 'APD', name: 'Avant-Projet Définitif', description: 'Conception détaillée', defaultPercentage: 15, deliverables: ['Plans APD', 'Détails raccords', 'Estimation'], category: 'base' },
      { code: 'PC', name: 'Permis de Construire', description: 'Dossier d\'autorisation', defaultPercentage: 10, deliverables: ['Dossier PC', 'Plans réglementaires'], category: 'base' },
      { code: 'PRO', name: 'Projet', description: 'Études techniques détaillées', defaultPercentage: 10, deliverables: ['Plans PRO', 'CCTP', 'Quantitatif'], category: 'base' },
      { code: 'DET', name: 'Direction Travaux', description: 'Suivi de chantier', defaultPercentage: 25, deliverables: ['CR chantier', 'Suivi', 'Coordination'], category: 'base' },
      { code: 'AOR', name: 'Réception', description: 'Réception des travaux', defaultPercentage: 5, deliverables: ['PV réception', 'DOE'], category: 'base' },
    ]
  },
];

// ==================== RÉNOVATION ÉNERGÉTIQUE ====================
export const RENOVATION_ENERGETIQUE_TEMPLATES: MissionTemplate[] = [
  {
    id: 'reno-energie-complete',
    name: 'Rénovation Énergétique Globale',
    description: 'Mission complète de rénovation énergétique performante (BBC Rénovation)',
    projectType: 'architecture',
    phases: [
      { code: 'AUDIT', name: 'Audit Énergétique', description: 'Diagnostic thermique et propositions de travaux', defaultPercentage: 15, deliverables: ['Rapport d\'audit énergétique', 'DPE avant travaux', 'Scénarios de travaux', 'Simulation thermique'], category: 'base' },
      { code: 'ESQ', name: 'Esquisse', description: 'Définition du programme de travaux', defaultPercentage: 10, deliverables: ['Programme de travaux', 'Estimation préliminaire', 'Planning prévisionnel'], category: 'base' },
      { code: 'APS', name: 'Avant-Projet Sommaire', description: 'Conception des solutions techniques', defaultPercentage: 15, deliverables: ['Plans APS', 'Détails isolation', 'Choix équipements CVC', 'Simulation RT'], category: 'base' },
      { code: 'APD', name: 'Avant-Projet Définitif', description: 'Définition complète des travaux', defaultPercentage: 15, deliverables: ['Plans APD', 'CCTP énergétique', 'Estimation définitive', 'Fiches techniques'], category: 'base' },
      { code: 'DCE', name: 'Consultation Entreprises', description: 'Consultation et analyse des offres', defaultPercentage: 10, deliverables: ['DCE', 'DPGF', 'Analyse des offres', 'Dossier aides financières'], category: 'base' },
      { code: 'DET', name: 'Suivi de Chantier', description: 'Direction et suivi des travaux', defaultPercentage: 30, deliverables: ['CR de chantier', 'Suivi qualité', 'Tests étanchéité', 'Contrôles thermographie'], category: 'base' },
      { code: 'AOR', name: 'Réception', description: 'Réception et mesures de performance', defaultPercentage: 5, deliverables: ['PV de réception', 'DPE après travaux', 'Attestation BBC', 'Guide utilisateur'], category: 'base' },
    ]
  },
  {
    id: 'reno-energie-audit-seul',
    name: 'Audit Énergétique',
    description: 'Mission d\'audit énergétique et recommandations',
    projectType: 'architecture',
    phases: [
      { code: 'VISITE', name: 'Visite et Relevé', description: 'Visite sur site et relevé des caractéristiques', defaultPercentage: 30, deliverables: ['Relevé technique', 'Photos thermiques', 'Relevé équipements'], category: 'base' },
      { code: 'ANALYSE', name: 'Analyse Thermique', description: 'Modélisation et simulation thermique', defaultPercentage: 40, deliverables: ['Modèle thermique', 'Simulation consommations', 'Bilan énergétique'], category: 'base' },
      { code: 'RECO', name: 'Recommandations', description: 'Préconisations et scénarios de travaux', defaultPercentage: 30, deliverables: ['Rapport d\'audit', 'Scénarios de travaux', 'Estimation budgétaire', 'Plan d\'actions'], category: 'base' },
    ]
  },
  {
    id: 'reno-energie-accompagnement',
    name: 'AMO Rénovation Énergétique',
    description: 'Assistance à maîtrise d\'ouvrage pour rénovation énergétique',
    projectType: 'architecture',
    phases: [
      { code: 'DIAG', name: 'Diagnostic Initial', description: 'Analyse de l\'existant et des besoins', defaultPercentage: 20, deliverables: ['Rapport diagnostic', 'Programme de travaux', 'Budget prévisionnel'], category: 'base' },
      { code: 'AIDES', name: 'Recherche Aides', description: 'Identification et montage des dossiers d\'aides', defaultPercentage: 20, deliverables: ['Dossiers MaPrimeRénov\'', 'CEE', 'Aides locales', 'Tableau de financement'], category: 'base' },
      { code: 'CONSULT', name: 'Consultation', description: 'Aide à la sélection des entreprises', defaultPercentage: 30, deliverables: ['Cahier des charges', 'Analyse des devis', 'Aide négociation'], category: 'base' },
      { code: 'SUIVI', name: 'Suivi Travaux', description: 'Accompagnement pendant les travaux', defaultPercentage: 30, deliverables: ['Visites de contrôle', 'Validation conformité', 'Réception travaux'], category: 'base' },
    ]
  },
];

// ==================== ARCHITECTURE D'INTÉRIEUR ====================
export const INTERIOR_TEMPLATES: MissionTemplate[] = [
  {
    id: 'interior-complete',
    name: 'Mission Complète Intérieur',
    description: 'Mission complète de maîtrise d\'œuvre en architecture d\'intérieur',
    projectType: 'interior',
    phases: [
      { code: 'BRIEF', name: 'Brief & Programme', description: 'Analyse des besoins et définition du programme', defaultPercentage: 5, deliverables: ['Cahier des charges', 'Programme fonctionnel', 'Moodboard'], category: 'base' },
      { code: 'ESQ', name: 'Esquisse', description: 'Premières propositions d\'aménagement', defaultPercentage: 15, deliverables: ['Plans d\'aménagement', 'Planche d\'ambiance', 'Estimation budgétaire'], category: 'base' },
      { code: 'APS', name: 'Avant-Projet Sommaire', description: 'Développement du concept retenu', defaultPercentage: 15, deliverables: ['Plans APS', 'Élévations murales', 'Palette matériaux', 'Sélection mobilier'], category: 'base' },
      { code: 'APD', name: 'Avant-Projet Définitif', description: 'Définition complète du projet', defaultPercentage: 20, deliverables: ['Plans APD', 'Perspectives 3D', 'Carnet de finitions', 'Budget définitif'], category: 'base' },
      { code: 'PRO', name: 'Projet d\'Exécution', description: 'Plans d\'exécution détaillés', defaultPercentage: 15, deliverables: ['Plans techniques', 'Détails menuiserie', 'CCTP', 'Quantitatif'], category: 'base' },
      { code: 'CONSULT', name: 'Consultation', description: 'Consultation et sélection des entreprises', defaultPercentage: 5, deliverables: ['DCE', 'Analyse des devis', 'Tableaux comparatifs'], category: 'base' },
      { code: 'CHANTIER', name: 'Suivi de Chantier', description: 'Direction et suivi des travaux', defaultPercentage: 20, deliverables: ['Comptes-rendus', 'Suivi des commandes', 'Coordination'], category: 'base' },
      { code: 'RECEP', name: 'Réception', description: 'Réception et installation', defaultPercentage: 5, deliverables: ['PV de réception', 'Installation décoration', 'Styling'], category: 'base' },
    ]
  },
  {
    id: 'interior-conseil',
    name: 'Mission Conseil',
    description: 'Mission de conseil et conception sans suivi de chantier',
    projectType: 'interior',
    phases: [
      { code: 'BRIEF', name: 'Brief & Programme', description: 'Analyse des besoins', defaultPercentage: 10, deliverables: ['Cahier des charges', 'Programme fonctionnel'], category: 'base' },
      { code: 'ESQ', name: 'Esquisse', description: 'Propositions d\'aménagement', defaultPercentage: 30, deliverables: ['Plans d\'aménagement', 'Planche d\'ambiance'], category: 'base' },
      { code: 'APS', name: 'Avant-Projet', description: 'Projet développé avec prescriptions', defaultPercentage: 40, deliverables: ['Plans développés', 'Carnet de prescriptions', 'Shopping list'], category: 'base' },
      { code: 'SHOPPING', name: 'Accompagnement Shopping', description: 'Accompagnement pour sélection mobilier et déco', defaultPercentage: 20, deliverables: ['Liste achats finalisée', 'Fournisseurs validés'], category: 'complementary' },
    ]
  },
  {
    id: 'interior-residentiel-luxe',
    name: 'Résidentiel Haut de Gamme',
    description: 'Mission pour appartement ou maison de prestige',
    projectType: 'interior',
    phases: [
      { code: 'IMMER', name: 'Immersion Client', description: 'Découverte approfondie du mode de vie', defaultPercentage: 5, deliverables: ['Rapport d\'immersion', 'Livre d\'inspirations personnalisé'], category: 'base' },
      { code: 'CONCEPT', name: 'Concept Design', description: 'Création du concept sur-mesure', defaultPercentage: 15, deliverables: ['Concept book', 'Moodboards par pièce', 'Direction artistique'], category: 'base' },
      { code: 'DESIGN', name: 'Design Détaillé', description: 'Développement complet du design', defaultPercentage: 25, deliverables: ['Plans détaillés', 'Perspectives 3D photoréalistes', 'Sélection artisans'], category: 'base' },
      { code: 'TECH', name: 'Études Techniques', description: 'Plans techniques et coordination', defaultPercentage: 15, deliverables: ['Plans techniques', 'Coordination BET', 'Domotique'], category: 'base' },
      { code: 'CUSTO', name: 'Sur-Mesure', description: 'Design des pièces sur-mesure', defaultPercentage: 10, deliverables: ['Dessins mobilier', 'Prototypes', 'Suivi fabrication'], category: 'base' },
      { code: 'CHANTIER', name: 'Direction de Chantier', description: 'Suivi et coordination des travaux', defaultPercentage: 25, deliverables: ['CR chantier', 'Coordination livraisons', 'Contrôle qualité'], category: 'base' },
      { code: 'INSTALL', name: 'Installation & Styling', description: 'Installation finale et décoration', defaultPercentage: 5, deliverables: ['Installation mobilier', 'Styling', 'Reportage photo'], category: 'base' },
    ]
  },
  {
    id: 'interior-retail',
    name: 'Retail / Commerce',
    description: 'Aménagement de boutique ou espace commercial',
    projectType: 'interior',
    phases: [
      { code: 'STRAT', name: 'Stratégie & Concept', description: 'Définition du concept retail', defaultPercentage: 10, deliverables: ['Brief retail', 'Concept commercial', 'Parcours client'], category: 'base' },
      { code: 'DESIGN', name: 'Design Spatial', description: 'Conception de l\'espace de vente', defaultPercentage: 25, deliverables: ['Plans d\'aménagement', 'Merchandising', 'Identité spatiale'], category: 'base' },
      { code: 'SIGNA', name: 'Signalétique', description: 'Design de la signalétique', defaultPercentage: 10, deliverables: ['Charte signalétique', 'PLV', 'Enseigne'], category: 'base' },
      { code: 'TECH', name: 'Études Techniques', description: 'Plans d\'exécution', defaultPercentage: 15, deliverables: ['Plans techniques', 'Détails agencement', 'CCTP'], category: 'base' },
      { code: 'CONSULT', name: 'Consultation', description: 'Sélection des entreprises', defaultPercentage: 5, deliverables: ['DCE', 'Analyse des offres'], category: 'base' },
      { code: 'CHANTIER', name: 'Réalisation', description: 'Suivi de la réalisation', defaultPercentage: 30, deliverables: ['CR chantier', 'Coordination', 'Installation mobilier'], category: 'base' },
      { code: 'OPENING', name: 'Ouverture', description: 'Préparation à l\'ouverture', defaultPercentage: 5, deliverables: ['Check-list ouverture', 'Styling', 'Photos'], category: 'base' },
    ]
  },
  {
    id: 'interior-bureau',
    name: 'Aménagement Bureaux',
    description: 'Aménagement d\'espaces de travail et bureaux',
    projectType: 'interior',
    phases: [
      { code: 'PROG', name: 'Programmation', description: 'Analyse des besoins et programmation', defaultPercentage: 10, deliverables: ['Programme fonctionnel', 'Space planning', 'Budget prévisionnel'], category: 'base' },
      { code: 'CONCEPT', name: 'Concept', description: 'Conception de l\'environnement de travail', defaultPercentage: 15, deliverables: ['Concept design', 'Typologies espaces', 'Charte mobilier'], category: 'base' },
      { code: 'DESIGN', name: 'Design Développé', description: 'Développement du design', defaultPercentage: 20, deliverables: ['Plans détaillés', 'Sélection mobilier', 'Perspectives 3D'], category: 'base' },
      { code: 'TECH', name: 'Études Techniques', description: 'Coordination technique', defaultPercentage: 15, deliverables: ['Plans techniques', 'Coordination CVC/Élec', 'CCTP'], category: 'base' },
      { code: 'CONSULT', name: 'Consultation', description: 'Consultation entreprises et fournisseurs', defaultPercentage: 5, deliverables: ['DCE', 'Comparatifs', 'Négociation'], category: 'base' },
      { code: 'CHANTIER', name: 'Réalisation', description: 'Suivi des travaux et installations', defaultPercentage: 30, deliverables: ['CR chantier', 'Coordination', 'Réception'], category: 'base' },
      { code: 'INSTALL', name: 'Installation', description: 'Installation et déménagement', defaultPercentage: 5, deliverables: ['Coordination déménagement', 'Installation', 'Remise des clés'], category: 'base' },
    ]
  },
  {
    id: 'interior-hotellerie',
    name: 'Hôtellerie & Restauration',
    description: 'Aménagement hôtel, restaurant ou établissement d\'accueil',
    projectType: 'interior',
    phases: [
      { code: 'CONCEPT', name: 'Concept & Identité', description: 'Création du concept d\'établissement', defaultPercentage: 15, deliverables: ['Concept book', 'Identité visuelle', 'Expérience client'], category: 'base' },
      { code: 'PROG', name: 'Programmation', description: 'Programme fonctionnel et technique', defaultPercentage: 10, deliverables: ['Programme', 'Zoning', 'Flux'], category: 'base' },
      { code: 'DESIGN', name: 'Design', description: 'Conception des espaces', defaultPercentage: 20, deliverables: ['Plans d\'aménagement', 'Design chambres/salles', 'Sélection FF&E'], category: 'base' },
      { code: 'TECH', name: 'Études Techniques', description: 'Coordination avec les BET', defaultPercentage: 15, deliverables: ['Plans techniques', 'Cuisine pro', 'CCTP'], category: 'base' },
      { code: 'DCE', name: 'Consultation', description: 'Consultation des entreprises', defaultPercentage: 5, deliverables: ['DCE', 'OS&E', 'Analyse offres'], category: 'base' },
      { code: 'CHANTIER', name: 'Direction Travaux', description: 'Suivi de réalisation', defaultPercentage: 30, deliverables: ['CR chantier', 'Suivi livraisons', 'Coordination'], category: 'base' },
      { code: 'OPENING', name: 'Pré-ouverture', description: 'Préparation à l\'ouverture', defaultPercentage: 5, deliverables: ['Installation', 'Styling', 'Punch list'], category: 'base' },
    ]
  },
];

// ==================== SCÉNOGRAPHIE ====================
export const SCENOGRAPHY_TEMPLATES: MissionTemplate[] = [
  {
    id: 'sceno-exposition-permanente',
    name: 'Exposition Permanente',
    description: 'Scénographie d\'exposition permanente de musée',
    projectType: 'scenography',
    phases: [
      { code: 'PSC', name: 'Projet Scientifique et Culturel', description: 'Participation à la définition du PSC', defaultPercentage: 5, deliverables: ['Contribution PSC', 'Parti pris scénographique', 'Référencement'], category: 'base' },
      { code: 'PROG', name: 'Programme Muséographique', description: 'Développement du programme détaillé', defaultPercentage: 10, deliverables: ['Programme muséographique', 'Scénario', 'Parcours visiteur'], category: 'base' },
      { code: 'ESQ', name: 'Esquisse Scénographique', description: 'Première proposition scénographique', defaultPercentage: 15, deliverables: ['Plans d\'esquisse', 'Ambiances', 'Concept multimédia'], category: 'base' },
      { code: 'AVP', name: 'Avant-Projet', description: 'Développement du projet scénographique', defaultPercentage: 20, deliverables: ['Plans AVP', 'Design graphique', 'Storyboards multimédia', 'Estimation'], category: 'base' },
      { code: 'PRO', name: 'Projet', description: 'Études de projet détaillées', defaultPercentage: 15, deliverables: ['Plans PRO', 'Dossiers de fabrication', 'Cahiers des charges multimédia'], category: 'base' },
      { code: 'DCE', name: 'Consultation', description: 'Consultation des entreprises', defaultPercentage: 5, deliverables: ['DCE scénographie', 'DCE multimédia', 'Analyse offres'], category: 'base' },
      { code: 'PROD', name: 'Suivi Production', description: 'Suivi de la fabrication', defaultPercentage: 15, deliverables: ['Validation prototypes', 'Suivi fabrication', 'Recette multimédia'], category: 'base' },
      { code: 'MONTAGE', name: 'Montage', description: 'Installation sur site', defaultPercentage: 10, deliverables: ['Coordination montage', 'Accrochage œuvres', 'Mise au point éclairage'], category: 'base' },
      { code: 'OUVERTURE', name: 'Ouverture', description: 'Préparation à l\'ouverture', defaultPercentage: 5, deliverables: ['Tests visiteurs', 'Ajustements', 'Documentation'], category: 'base' },
    ]
  },
  {
    id: 'sceno-exposition-temporaire',
    name: 'Exposition Temporaire',
    description: 'Scénographie d\'exposition temporaire (6-12 mois)',
    projectType: 'scenography',
    phases: [
      { code: 'CONCEPT', name: 'Conception', description: 'Développement du concept', defaultPercentage: 20, deliverables: ['Note d\'intention', 'Parcours visiteur', 'Concept scénographique'], category: 'base' },
      { code: 'DESIGN', name: 'Design', description: 'Conception graphique et spatiale', defaultPercentage: 25, deliverables: ['Plans scénographiques', 'Perspectives 3D', 'Design graphique', 'Brief multimédia'], category: 'base' },
      { code: 'TECH', name: 'Études Techniques', description: 'Plans techniques et fabrication', defaultPercentage: 20, deliverables: ['Plans techniques', 'Dossiers fabrication', 'Conservation préventive'], category: 'base' },
      { code: 'PROD', name: 'Production', description: 'Suivi de fabrication', defaultPercentage: 15, deliverables: ['Suivi fabrication', 'Production multimédia', 'Contrôle qualité'], category: 'base' },
      { code: 'MONTAGE', name: 'Montage', description: 'Installation et accrochage', defaultPercentage: 15, deliverables: ['Coordination montage', 'Accrochage', 'Éclairage'], category: 'base' },
      { code: 'DEMONTAGE', name: 'Démontage', description: 'Fin d\'exposition', defaultPercentage: 5, deliverables: ['Coordination démontage', 'Reconditionnement', 'Bilan'], category: 'complementary' },
    ]
  },
  {
    id: 'sceno-centre-interpretation',
    name: 'Centre d\'Interprétation',
    description: 'Scénographie de centre d\'interprétation ou espace découverte',
    projectType: 'scenography',
    phases: [
      { code: 'PROG', name: 'Programmation', description: 'Définition du contenu et des objectifs', defaultPercentage: 10, deliverables: ['Programme', 'Contenus', 'Parcours'], category: 'base' },
      { code: 'CONCEPT', name: 'Concept', description: 'Conception scénographique', defaultPercentage: 20, deliverables: ['Concept', 'Scénario', 'Interactifs'], category: 'base' },
      { code: 'DESIGN', name: 'Design', description: 'Design spatial et graphique', defaultPercentage: 20, deliverables: ['Plans', 'Design graphique', 'Design interactifs'], category: 'base' },
      { code: 'TECH', name: 'Technique', description: 'Études de réalisation', defaultPercentage: 15, deliverables: ['Plans techniques', 'Cahiers des charges', 'Prototypes'], category: 'base' },
      { code: 'PROD', name: 'Production', description: 'Fabrication et développement', defaultPercentage: 20, deliverables: ['Suivi production', 'Développement multimédia', 'Tests'], category: 'base' },
      { code: 'INSTALL', name: 'Installation', description: 'Montage et mise en service', defaultPercentage: 15, deliverables: ['Montage', 'Mise au point', 'Formation médiateurs'], category: 'base' },
    ]
  },
  {
    id: 'sceno-evenement',
    name: 'Événement / Salon',
    description: 'Scénographie d\'événement ou stand de salon',
    projectType: 'scenography',
    phases: [
      { code: 'BRIEF', name: 'Brief', description: 'Analyse du brief et objectifs', defaultPercentage: 10, deliverables: ['Analyse brief', 'Contraintes techniques', 'Budget'], category: 'base' },
      { code: 'CONCEPT', name: 'Concept', description: 'Proposition créative', defaultPercentage: 30, deliverables: ['Concept créatif', 'Plans 3D', 'Perspectives'], category: 'base' },
      { code: 'TECH', name: 'Technique', description: 'Plans d\'exécution', defaultPercentage: 20, deliverables: ['Plans techniques', 'Élec/Lumière', 'Multimédia'], category: 'base' },
      { code: 'PROD', name: 'Production', description: 'Fabrication', defaultPercentage: 20, deliverables: ['Suivi fabrication', 'Coordination prestataires'], category: 'base' },
      { code: 'MONTAGE', name: 'Montage', description: 'Installation sur site', defaultPercentage: 15, deliverables: ['Coordination montage', 'Mise au point', 'Recette'], category: 'base' },
      { code: 'EXPLOIT', name: 'Exploitation', description: 'Support pendant l\'événement', defaultPercentage: 5, deliverables: ['Astreinte', 'Maintenance', 'Bilan'], category: 'complementary' },
    ]
  },
  {
    id: 'sceno-parcours-visite',
    name: 'Parcours de Visite',
    description: 'Scénographie de parcours de visite patrimonial ou touristique',
    projectType: 'scenography',
    phases: [
      { code: 'DIAG', name: 'Diagnostic', description: 'Analyse du site et du patrimoine', defaultPercentage: 10, deliverables: ['Diagnostic patrimonial', 'Analyse des publics', 'Potentiel'], category: 'base' },
      { code: 'PROG', name: 'Programmation', description: 'Définition du parcours', defaultPercentage: 15, deliverables: ['Programme', 'Scénario de visite', 'Stations'], category: 'base' },
      { code: 'CONCEPT', name: 'Conception', description: 'Design du parcours', defaultPercentage: 25, deliverables: ['Concept scénographique', 'Signalétique', 'Supports de médiation'], category: 'base' },
      { code: 'TECH', name: 'Technique', description: 'Études de réalisation', defaultPercentage: 15, deliverables: ['Plans techniques', 'Cahiers des charges', 'Conservation'], category: 'base' },
      { code: 'PROD', name: 'Production', description: 'Fabrication des éléments', defaultPercentage: 20, deliverables: ['Suivi fabrication', 'Contenus', 'Outils numériques'], category: 'base' },
      { code: 'INSTALL', name: 'Installation', description: 'Mise en place', defaultPercentage: 15, deliverables: ['Installation', 'Formation', 'Inauguration'], category: 'base' },
    ]
  },
];

// ==================== ALL TEMPLATES ====================
export const ALL_MISSION_TEMPLATES: MissionTemplate[] = [
  ...ARCHITECTURE_TEMPLATES,
  ...RENOVATION_ENERGETIQUE_TEMPLATES,
  ...INTERIOR_TEMPLATES,
  ...SCENOGRAPHY_TEMPLATES,
];

// Get templates by project type
export function getMissionTemplatesByType(projectType: ProjectType): MissionTemplate[] {
  return ALL_MISSION_TEMPLATES.filter(t => t.projectType === projectType);
}

// Get all unique categories
export function getMissionCategories(): { type: ProjectType; label: string; templates: MissionTemplate[] }[] {
  return [
    { type: 'architecture', label: 'Architecture', templates: [...ARCHITECTURE_TEMPLATES, ...RENOVATION_ENERGETIQUE_TEMPLATES] },
    { type: 'interior', label: 'Architecture d\'Intérieur', templates: INTERIOR_TEMPLATES },
    { type: 'scenography', label: 'Scénographie', templates: SCENOGRAPHY_TEMPLATES },
  ];
}
