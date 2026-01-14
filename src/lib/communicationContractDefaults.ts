// Configuration par défaut pour les contrats de Communication
// Types de contrats, clauses et phases spécifiques aux agences de communication

import {
  MOEPaymentSchedule
} from './moeContractConfig';

// ============= Types spécifiques Communication =============

export interface CommunicationPhase {
  code: string;
  name: string;
  short_name: string;
  description: string;
  percentage: number;
  is_included: boolean;
  deliverables: string[];
  is_optional?: boolean;
}

export interface CommunicationContractConfig {
  template: 'communication_contract';
  version: number;
  phases: CommunicationPhase[];
  payment_schedule: MOEPaymentSchedule[];
  clauses: Record<string, string>;
  settings: {
    daily_rate: number;
    minimum_project: number;
    currency: string;
  };
}

// ============= Default Phases Communication =============

export const DEFAULT_COMMUNICATION_PHASES: CommunicationPhase[] = [
  {
    code: 'BRIEF',
    name: 'Brief & Cadrage',
    short_name: 'BRIEF',
    description: 'Réception du brief, analyse des besoins, définition des objectifs et du périmètre.',
    percentage: 10,
    is_included: true,
    is_optional: false,
    deliverables: ['Compte-rendu de brief', 'Note de cadrage']
  },
  {
    code: 'STRAT',
    name: 'Recommandation stratégique',
    short_name: 'STRAT',
    description: 'Analyse du contexte, définition de la stratégie de communication, positionnement et messages clés.',
    percentage: 15,
    is_included: true,
    is_optional: false,
    deliverables: ['Recommandation stratégique', 'Plateforme de marque']
  },
  {
    code: 'CREA',
    name: 'Création',
    short_name: 'CREA',
    description: 'Conception créative, direction artistique, développement des concepts et déclinaisons.',
    percentage: 25,
    is_included: true,
    is_optional: false,
    deliverables: ['Concepts créatifs', 'Maquettes', 'Charte graphique']
  },
  {
    code: 'PROD',
    name: 'Production',
    short_name: 'PROD',
    description: 'Production des livrables définitifs, exécution et déclinaisons multi-supports.',
    percentage: 30,
    is_included: true,
    is_optional: false,
    deliverables: ['Fichiers sources', 'Exports HD', 'Kit de déclinaison']
  },
  {
    code: 'MEDIA',
    name: 'Plan média',
    short_name: 'MEDIA',
    description: 'Définition et achat d\'espaces publicitaires, stratégie de diffusion.',
    percentage: 10,
    is_included: false,
    is_optional: true,
    deliverables: ['Plan média', 'Médiaplanning', 'Bilan de diffusion']
  },
  {
    code: 'DIGITAL',
    name: 'Stratégie digitale',
    short_name: 'DIGITAL',
    description: 'Stratégie réseaux sociaux, contenus digitaux, influence.',
    percentage: 15,
    is_included: false,
    is_optional: true,
    deliverables: ['Stratégie social media', 'Planning éditorial', 'Guidelines community']
  },
  {
    code: 'DEPLOY',
    name: 'Déploiement',
    short_name: 'DEPLOY',
    description: 'Mise en ligne, diffusion et déploiement des campagnes.',
    percentage: 10,
    is_included: true,
    is_optional: false,
    deliverables: ['Rapport de mise en ligne', 'Preuves de publication']
  },
  {
    code: 'BILAN',
    name: 'Bilan & Reporting',
    short_name: 'BILAN',
    description: 'Analyse des performances, reporting et recommandations d\'optimisation.',
    percentage: 10,
    is_included: true,
    is_optional: false,
    deliverables: ['Rapport de campagne', 'Analyse KPIs', 'Recommandations']
  }
];

// ============= Default Payment Schedule Communication =============

export const DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE: MOEPaymentSchedule[] = [
  { stage: 'Commande / Signature', phase_code: 'ACOMPTE', percentage: 40, description: 'Acompte à la signature' },
  { stage: 'Validation création', phase_code: 'CREA', percentage: 30, description: 'Après validation des créations' },
  { stage: 'Livraison finale', phase_code: 'PROD', percentage: 25, description: 'À la livraison des fichiers définitifs' },
  { stage: 'Bilan de campagne', phase_code: 'BILAN', percentage: 5, description: 'Solde après bilan' }
];

// ============= Default Clauses Communication =============

export const DEFAULT_COMMUNICATION_CLAUSES = {
  objet: `Le présent contrat a pour objet de définir les conditions dans lesquelles l'Agence réalise pour le Client les prestations de conseil et de création en communication décrites dans le devis annexé.`,

  propriete_intellectuelle: `Les créations restent la propriété de l'Agence jusqu'au paiement intégral de la facture. Après règlement complet, le Client acquiert les droits d'utilisation définis dans la cession de droits annexée. Les fichiers sources restent la propriété de l'Agence sauf accord contraire écrit. Toute utilisation au-delà du périmètre défini fera l'objet d'un avenant.`,

  cession_droits: `La cession de droits porte sur les droits de reproduction et de représentation des créations, pour les supports et durées définis dans le devis. Elle est accordée à titre non exclusif sauf mention contraire. Toute extension (territoire, durée, support) fera l'objet d'une négociation complémentaire.`,

  confidentialite: `L'Agence s'engage à maintenir la plus stricte confidentialité sur les informations et documents communiqués par le Client dans le cadre de la mission. Cette obligation perdure pendant 2 ans après la fin du contrat. L'Agence pourra toutefois faire mention de la collaboration dans ses références après accord du Client.`,

  validation: `Chaque étape clé fait l'objet d'une validation écrite du Client (email ou signature). L'absence de retour sous 5 jours ouvrés après présentation vaut validation tacite. Les modifications demandées après validation sont facturées en sus.`,

  modifications: `Sont incluses dans le devis les modifications mineures demandées lors de chaque étape de validation (dans la limite de 2 allers-retours). Les modifications structurelles ou les changements de direction artistique après validation donneront lieu à une facturation complémentaire au taux journalier en vigueur.`,

  delais: `L'Agence s'engage à respecter les délais convenus sous réserve : (1) de la fourniture dans les temps des éléments par le Client, (2) du respect des délais de validation par le Client, (3) de l'absence de modifications substantielles. Tout retard imputable au Client décale d'autant le planning sans pénalité pour l'Agence.`,

  responsabilite: `L'Agence met en œuvre les moyens nécessaires à la bonne exécution de sa mission. Sa responsabilité est limitée au montant des honoraires perçus. Elle ne saurait être tenue responsable des préjudices indirects (perte de chiffre d'affaires, atteinte à l'image). Le Client reste responsable de la véracité des informations fournies.`,

  sous_traitance: `L'Agence peut faire appel à des sous-traitants pour l'exécution de certaines prestations techniques (impression, développement, etc.). Elle reste garante de la qualité des prestations et du respect de la confidentialité par ses partenaires.`,

  facturation: `Les factures sont émises selon l'échéancier défini. Elles sont payables à 30 jours date de facture sauf accord particulier. Tout retard de paiement entraîne l'application de pénalités (3 fois le taux d'intérêt légal) et d'une indemnité forfaitaire de 40€ pour frais de recouvrement.`,

  resiliation: `En cas de résiliation anticipée par le Client, les prestations réalisées restent dues. Une indemnité égale à 30% des prestations restantes sera facturée. L'Agence pourra résilier le contrat en cas de non-paiement après mise en demeure restée sans effet pendant 15 jours.`,

  litiges: `En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut d'accord sous 30 jours, le litige sera porté devant les tribunaux compétents du siège de l'Agence. Le droit français est seul applicable.`,

  references: `Sauf opposition écrite du Client, l'Agence pourra faire mention de la collaboration et présenter les créations réalisées dans son portfolio et ses références commerciales.`,

  rgpd: `Les données personnelles collectées dans le cadre de la mission sont traitées conformément au RGPD. Elles sont utilisées uniquement pour l'exécution du contrat et conservées pendant la durée légale.`
};

// ============= Default Contract Types Communication =============

export const DEFAULT_COMMUNICATION_CONTRACT_TYPES = [
  {
    name: 'Campagne 360°',
    code: 'CAMP360',
    description: 'Campagne de communication multi-canal',
    icon: 'Megaphone',
    color: '#EC4899',
    default_fields: { budget: true },
    builder_tabs: ['general', 'fees', 'lines', 'terms'],
    default_clauses: {
      template: 'communication_contract',
      version: 1,
      phases: DEFAULT_COMMUNICATION_PHASES,
      payment_schedule: DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE,
      clauses: DEFAULT_COMMUNICATION_CLAUSES
    }
  },
  {
    name: 'Branding / Identité',
    code: 'BRAND',
    description: 'Création ou refonte d\'identité visuelle',
    icon: 'Palette',
    color: '#8B5CF6',
    default_fields: { budget: true },
    builder_tabs: ['general', 'fees', 'lines', 'terms'],
    default_clauses: {
      template: 'communication_contract',
      version: 1,
      phases: DEFAULT_COMMUNICATION_PHASES.filter(p => ['BRIEF', 'STRAT', 'CREA', 'PROD'].includes(p.code)),
      payment_schedule: DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE,
      clauses: DEFAULT_COMMUNICATION_CLAUSES
    }
  },
  {
    name: 'Digital / Social Media',
    code: 'DIGITAL',
    description: 'Stratégie digitale et réseaux sociaux',
    icon: 'Globe',
    color: '#06B6D4',
    default_fields: { budget: true },
    builder_tabs: ['general', 'fees', 'lines', 'terms'],
    default_clauses: {
      template: 'communication_contract',
      version: 1,
      phases: [
        ...DEFAULT_COMMUNICATION_PHASES.filter(p => ['BRIEF', 'STRAT', 'CREA'].includes(p.code)),
        { ...DEFAULT_COMMUNICATION_PHASES.find(p => p.code === 'DIGITAL')!, is_included: true, is_optional: false },
        DEFAULT_COMMUNICATION_PHASES.find(p => p.code === 'BILAN')!
      ],
      payment_schedule: DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE,
      clauses: DEFAULT_COMMUNICATION_CLAUSES
    }
  },
  {
    name: 'Événementiel',
    code: 'EVENT',
    description: 'Conception et production d\'événements',
    icon: 'Calendar',
    color: '#F59E0B',
    default_fields: { budget: true },
    builder_tabs: ['general', 'fees', 'lines', 'planning', 'terms'],
    default_clauses: {
      template: 'communication_contract',
      version: 1,
      phases: DEFAULT_COMMUNICATION_PHASES.filter(p => ['BRIEF', 'CREA', 'PROD', 'DEPLOY', 'BILAN'].includes(p.code)),
      payment_schedule: [
        { stage: 'Commande', percentage: 50, description: 'Acompte à la signature' },
        { stage: 'Validation créa', percentage: 30, description: 'Avant production' },
        { stage: 'J-7 événement', percentage: 15, description: 'Avant l\'événement' },
        { stage: 'Post-event', percentage: 5, description: 'Solde après bilan' }
      ],
      clauses: DEFAULT_COMMUNICATION_CLAUSES
    }
  },
  {
    name: 'Production audiovisuelle',
    code: 'VIDEO',
    description: 'Films, vidéos et contenus audiovisuels',
    icon: 'Video',
    color: '#EF4444',
    default_fields: { budget: true },
    builder_tabs: ['general', 'fees', 'lines', 'terms'],
    default_clauses: {
      template: 'communication_contract',
      version: 1,
      phases: [
        { code: 'BRIEF', name: 'Brief & écriture', short_name: 'BRIEF', description: 'Définition du concept et écriture', percentage: 15, is_included: true, is_optional: false, deliverables: ['Note d\'intention', 'Script/Scénario'] },
        { code: 'PREPROD', name: 'Pré-production', short_name: 'PREPROD', description: 'Casting, repérages, planning de tournage', percentage: 20, is_included: true, is_optional: false, deliverables: ['Plan de tournage', 'Storyboard'] },
        { code: 'PROD', name: 'Tournage', short_name: 'PROD', description: 'Tournage et captation', percentage: 30, is_included: true, is_optional: false, deliverables: ['Rushes'] },
        { code: 'POSTPROD', name: 'Post-production', short_name: 'POSTPROD', description: 'Montage, étalonnage, sound design', percentage: 30, is_included: true, is_optional: false, deliverables: ['Montage offline', 'Master HD'] },
        { code: 'LIVRAISON', name: 'Livraison', short_name: 'LIVRAISON', description: 'Export multi-formats', percentage: 5, is_included: true, is_optional: false, deliverables: ['Fichiers finaux multi-formats'] }
      ],
      payment_schedule: [
        { stage: 'Commande', percentage: 40, description: 'Acompte signature' },
        { stage: 'Tournage', percentage: 30, description: 'Avant tournage' },
        { stage: 'Livraison', percentage: 30, description: 'À la livraison' }
      ],
      clauses: {
        ...DEFAULT_COMMUNICATION_CLAUSES,
        droits_video: `Les droits d'exploitation audiovisuelle sont cédés pour les usages définis (supports, territoires, durée). L'utilisation en tant que publicité TV ou cinéma requiert une cession de droits spécifique. Les droits sur la musique, les comédiens et les images d'archives sont négociés séparément.`
      }
    }
  },
  {
    name: 'Accord-cadre',
    code: 'ACCORD',
    description: 'Contrat annuel à bons de commande',
    icon: 'FileText',
    color: '#10B981',
    default_fields: { budget: true },
    builder_tabs: ['general', 'fees', 'terms'],
    default_clauses: {
      template: 'communication_contract',
      version: 1,
      phases: [],
      payment_schedule: [
        { stage: 'Mensuel', percentage: 100, description: 'Facturation mensuelle sur prestations réalisées' }
      ],
      clauses: {
        ...DEFAULT_COMMUNICATION_CLAUSES,
        accord_cadre: `Le présent accord-cadre est conclu pour une durée d'un an renouvelable par tacite reconduction. Les prestations sont commandées par bons de commande successifs selon le barème annexé (taux journaliers par profil). L'engagement minimum est de X jours/an. Chaque bon de commande précise le périmètre, le planning et le budget.`
      }
    }
  }
];

// ============= Helper Functions =============

export function getDefaultCommunicationConfig(): CommunicationContractConfig {
  return {
    template: 'communication_contract',
    version: 1,
    phases: DEFAULT_COMMUNICATION_PHASES,
    payment_schedule: DEFAULT_COMMUNICATION_PAYMENT_SCHEDULE,
    clauses: DEFAULT_COMMUNICATION_CLAUSES,
    settings: {
      daily_rate: 800,
      minimum_project: 5000,
      currency: 'EUR'
    }
  };
}

export function isCommunicationContractType(code: string): boolean {
  const communicationCodes = ['CAMP360', 'BRAND', 'DIGITAL', 'EVENT', 'VIDEO', 'ACCORD', 'PUB', 'COM', 'COMMUNICATION'];
  return communicationCodes.includes(code?.toUpperCase());
}

export function parseCommunicationConfig(generalConditions: string | null): Partial<CommunicationContractConfig> | null {
  if (!generalConditions) return null;
  try {
    const parsed = JSON.parse(generalConditions);
    if (parsed.template === 'communication_contract') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
