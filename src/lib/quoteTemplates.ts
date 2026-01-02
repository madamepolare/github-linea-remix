// Quote/Devis Templates and Line Item Types

import { ProjectType } from './commercialTypes';

export type LineItemType = 'phase' | 'prestation' | 'option' | 'expense' | 'discount' | 'provision';

export interface QuoteLineItem {
  id: string;
  type: LineItemType;
  code?: string;
  designation: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  isOptional: boolean;
  phaseId?: string; // For grouping items under a phase
  deliverables: string[];
  sortOrder: number;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  projectType: ProjectType;
  lineItems: Omit<QuoteLineItem, 'id'>[];
}

export const LINE_ITEM_TYPE_LABELS: Record<LineItemType, string> = {
  phase: 'Phase mission',
  prestation: 'Prestation',
  option: 'Option',
  expense: 'Frais',
  discount: 'Remise',
  provision: 'Provision'
};

export const LINE_ITEM_UNITS = [
  { value: 'forfait', label: 'Forfait' },
  { value: 'h', label: 'Heure' },
  { value: 'j', label: 'Jour' },
  { value: 'm2', label: 'm²' },
  { value: 'ml', label: 'ml' },
  { value: 'u', label: 'Unité' },
  { value: '%', label: '%' },
];

// Default templates by project type
export const QUOTE_TEMPLATES: QuoteTemplate[] = [
  // Interior Design Templates
  {
    id: 'interior-full',
    name: 'Mission complète',
    description: 'Mission complète de maîtrise d\'œuvre en architecture d\'intérieur',
    projectType: 'interior',
    lineItems: [
      {
        type: 'phase',
        code: 'BRIEF',
        designation: 'Brief & Programme',
        description: 'Analyse des besoins et définition du programme',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Cahier des charges', 'Programme fonctionnel', 'Moodboard'],
        sortOrder: 0
      },
      {
        type: 'phase',
        code: 'ESQ',
        designation: 'Esquisse',
        description: 'Premières propositions d\'aménagement',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans d\'aménagement', 'Planche d\'ambiance', 'Estimation budgétaire'],
        sortOrder: 1
      },
      {
        type: 'phase',
        code: 'APS',
        designation: 'Avant-Projet Sommaire',
        description: 'Développement du concept retenu',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans APS', 'Élévations murales', 'Palette matériaux'],
        sortOrder: 2
      },
      {
        type: 'phase',
        code: 'APD',
        designation: 'Avant-Projet Définitif',
        description: 'Définition complète du projet',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans APD', 'Perspectives 3D', 'Carnet de finitions'],
        sortOrder: 3
      },
      {
        type: 'phase',
        code: 'PRO',
        designation: 'Projet d\'Exécution',
        description: 'Plans d\'exécution détaillés',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans techniques', 'Détails menuiserie', 'Descriptif quantitatif'],
        sortOrder: 4
      },
      {
        type: 'phase',
        code: 'CONSULT',
        designation: 'Consultation Entreprises',
        description: 'Consultation et sélection des entreprises',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['DCE', 'Analyse des devis', 'Tableaux comparatifs'],
        sortOrder: 5
      },
      {
        type: 'phase',
        code: 'CHANTIER',
        designation: 'Suivi de Chantier',
        description: 'Direction et suivi des travaux',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Comptes-rendus', 'Suivi des commandes', 'Coordination'],
        sortOrder: 6
      },
      {
        type: 'phase',
        code: 'RECEP',
        designation: 'Réception',
        description: 'Réception des travaux et livraison',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['PV de réception', 'Levée des réserves', 'DOE'],
        sortOrder: 7
      }
    ]
  },
  {
    id: 'interior-conseil',
    name: 'Mission conseil',
    description: 'Mission de conseil et conception sans suivi de chantier',
    projectType: 'interior',
    lineItems: [
      {
        type: 'phase',
        code: 'BRIEF',
        designation: 'Brief & Programme',
        description: 'Analyse des besoins et définition du programme',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Cahier des charges', 'Programme fonctionnel'],
        sortOrder: 0
      },
      {
        type: 'phase',
        code: 'ESQ',
        designation: 'Esquisse',
        description: 'Propositions d\'aménagement',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans d\'aménagement', 'Planche d\'ambiance'],
        sortOrder: 1
      },
      {
        type: 'phase',
        code: 'APS',
        designation: 'Avant-Projet',
        description: 'Projet développé avec prescriptions',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans développés', 'Carnet de prescriptions', 'Shopping list'],
        sortOrder: 2
      },
      {
        type: 'prestation',
        designation: 'Accompagnement shopping',
        description: 'Accompagnement pour sélection mobilier et déco',
        quantity: 4,
        unit: 'h',
        unitPrice: 120,
        amount: 480,
        isOptional: true,
        deliverables: [],
        sortOrder: 3
      }
    ]
  },
  // Architecture Templates
  {
    id: 'archi-full',
    name: 'Mission complète loi MOP',
    description: 'Mission de base complète selon la loi MOP',
    projectType: 'architecture',
    lineItems: [
      {
        type: 'phase',
        code: 'ESQ',
        designation: 'Esquisse',
        description: 'Études préliminaires et esquisse',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans d\'esquisse', 'Volumétrie 3D', 'Note d\'intention'],
        sortOrder: 0
      },
      {
        type: 'phase',
        code: 'APS',
        designation: 'Avant-Projet Sommaire',
        description: 'Définition des caractéristiques principales',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans APS', 'Coupes et façades', 'Notice descriptive'],
        sortOrder: 1
      },
      {
        type: 'phase',
        code: 'APD',
        designation: 'Avant-Projet Définitif',
        description: 'Conception détaillée du projet',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans APD', 'CCTP sommaire', 'Estimation définitive'],
        sortOrder: 2
      },
      {
        type: 'phase',
        code: 'PC',
        designation: 'Permis de Construire',
        description: 'Dossier de permis de construire',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Dossier PC complet', 'Plans réglementaires', 'Insertion paysagère'],
        sortOrder: 3
      },
      {
        type: 'phase',
        code: 'PRO',
        designation: 'Projet',
        description: 'Études de projet détaillées',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans PRO', 'Détails techniques', 'CCTP détaillé'],
        sortOrder: 4
      },
      {
        type: 'phase',
        code: 'DCE',
        designation: 'Dossier de Consultation',
        description: 'Documents de consultation entreprises',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['DCE complet', 'Quantitatif', 'Planning prévisionnel'],
        sortOrder: 5
      },
      {
        type: 'phase',
        code: 'ACT',
        designation: 'Assistance Marchés',
        description: 'Analyse des offres et passation des marchés',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Analyse des offres', 'Rapport d\'analyse', 'Mise au point marchés'],
        sortOrder: 6
      },
      {
        type: 'phase',
        code: 'VISA',
        designation: 'Visa',
        description: 'Examen et visa des études d\'exécution',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Visa des plans EXE', 'Validation échantillons'],
        sortOrder: 7
      },
      {
        type: 'phase',
        code: 'DET',
        designation: 'Direction des Travaux',
        description: 'Direction et coordination des travaux',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Comptes-rendus de chantier', 'OPR', 'Suivi financier'],
        sortOrder: 8
      },
      {
        type: 'phase',
        code: 'AOR',
        designation: 'Réception',
        description: 'Assistance aux opérations de réception',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['PV de réception', 'Levée des réserves', 'DOE', 'DIUO'],
        sortOrder: 9
      }
    ]
  },
  {
    id: 'archi-conception',
    name: 'Mission conception + PC',
    description: 'Mission de conception jusqu\'au permis de construire',
    projectType: 'architecture',
    lineItems: [
      {
        type: 'phase',
        code: 'ESQ',
        designation: 'Esquisse',
        description: 'Études préliminaires et esquisse',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans d\'esquisse', 'Volumétrie 3D'],
        sortOrder: 0
      },
      {
        type: 'phase',
        code: 'APS',
        designation: 'Avant-Projet Sommaire',
        description: 'Définition des caractéristiques principales',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans APS', 'Notice descriptive'],
        sortOrder: 1
      },
      {
        type: 'phase',
        code: 'APD',
        designation: 'Avant-Projet Définitif',
        description: 'Conception détaillée',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans APD', 'Estimation définitive'],
        sortOrder: 2
      },
      {
        type: 'phase',
        code: 'PC',
        designation: 'Permis de Construire',
        description: 'Dossier de permis de construire',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Dossier PC complet'],
        sortOrder: 3
      }
    ]
  },
  // Scenography Templates
  {
    id: 'sceno-full',
    name: 'Mission scénographie complète',
    description: 'Mission complète de scénographie d\'exposition',
    projectType: 'scenography',
    lineItems: [
      {
        type: 'phase',
        code: 'CONCEPT',
        designation: 'Conception',
        description: 'Développement du concept scénographique',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Note d\'intention', 'Parcours visiteur', 'Scénario muséographique'],
        sortOrder: 0
      },
      {
        type: 'phase',
        code: 'SCENARIO',
        designation: 'Scénario Détaillé',
        description: 'Écriture du scénario et séquençage',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Scénario détaillé', 'Storyboard', 'Brief multimédia'],
        sortOrder: 1
      },
      {
        type: 'phase',
        code: 'DESIGN',
        designation: 'Design Scénographique',
        description: 'Conception graphique et spatiale',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans scénographiques', 'Perspectives 3D', 'Design graphique'],
        sortOrder: 2
      },
      {
        type: 'phase',
        code: 'TECH',
        designation: 'Études Techniques',
        description: 'Plans techniques et dossiers fabrication',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Plans techniques', 'Dossiers de fabrication', 'CCTP'],
        sortOrder: 3
      },
      {
        type: 'phase',
        code: 'PROD',
        designation: 'Suivi de Production',
        description: 'Suivi de la fabrication',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Validation prototypes', 'Suivi fabrication', 'Contrôle qualité'],
        sortOrder: 4
      },
      {
        type: 'phase',
        code: 'MONTAGE',
        designation: 'Montage',
        description: 'Installation sur site',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Coordination montage', 'Tests multimédia'],
        sortOrder: 5
      },
      {
        type: 'phase',
        code: 'INAUG',
        designation: 'Inauguration',
        description: 'Finalisation et inauguration',
        quantity: 1,
        unit: 'forfait',
        unitPrice: 0,
        amount: 0,
        isOptional: false,
        deliverables: ['Réception finale', 'Formation exploitants'],
        sortOrder: 6
      }
    ]
  }
];

// Common additional items
export const COMMON_ADDITIONAL_ITEMS: Omit<QuoteLineItem, 'id' | 'sortOrder'>[] = [
  {
    type: 'prestation',
    designation: 'Perspectives 3D supplémentaires',
    description: 'Rendus photo-réalistes supplémentaires',
    quantity: 1,
    unit: 'u',
    unitPrice: 350,
    amount: 350,
    isOptional: true,
    deliverables: []
  },
  {
    type: 'prestation',
    designation: 'Visite de chantier supplémentaire',
    description: 'Visite de chantier hors planning',
    quantity: 1,
    unit: 'u',
    unitPrice: 250,
    amount: 250,
    isOptional: true,
    deliverables: []
  },
  {
    type: 'prestation',
    designation: 'Réunion client supplémentaire',
    description: 'Réunion de travail supplémentaire',
    quantity: 1,
    unit: 'u',
    unitPrice: 180,
    amount: 180,
    isOptional: true,
    deliverables: []
  },
  {
    type: 'expense',
    designation: 'Frais de déplacement',
    description: 'Frais kilométriques et déplacements',
    quantity: 1,
    unit: 'forfait',
    unitPrice: 0,
    amount: 0,
    isOptional: false,
    deliverables: []
  },
  {
    type: 'expense',
    designation: 'Frais de reprographie',
    description: 'Impressions et tirages plans',
    quantity: 1,
    unit: 'forfait',
    unitPrice: 0,
    amount: 0,
    isOptional: false,
    deliverables: []
  },
  {
    type: 'provision',
    designation: 'Provision pour aléas',
    description: 'Provision pour modifications et aléas',
    quantity: 1,
    unit: 'forfait',
    unitPrice: 0,
    amount: 0,
    isOptional: false,
    deliverables: []
  },
  {
    type: 'discount',
    designation: 'Remise commerciale',
    description: 'Remise exceptionnelle',
    quantity: 1,
    unit: 'forfait',
    unitPrice: 0,
    amount: 0,
    isOptional: false,
    deliverables: []
  }
];

export function getTemplatesForProjectType(projectType: ProjectType): QuoteTemplate[] {
  return QUOTE_TEMPLATES.filter(t => t.projectType === projectType);
}
