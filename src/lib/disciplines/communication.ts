// ============================================
// Configuration complète : COMMUNICATION
// ============================================

import { Megaphone } from "lucide-react";
import type { DisciplineDefinition } from "./types";

export const COMMUNICATION_DISCIPLINE: DisciplineDefinition = {
  // === Identité ===
  slug: 'communication',
  name: 'Communication',
  shortName: 'Comm',
  description: 'Campagnes publicitaires, stratégie de marque, événementiel',
  icon: Megaphone,
  color: 'hsl(30, 70%, 50%)',
  
  // === Terminologie ===
  terminology: {
    project: 'Projet',
    projects: 'Projets',
    phase: 'Phase',
    phases: 'Phases',
    lot: 'Livrable',
    lots: 'Livrables',
    chantier: 'Production',
    client: 'Annonceur',
    clients: 'Annonceurs',
    intervenant: 'Partenaire',
    intervenants: 'Partenaires',
    dce: 'Brief',
    devis: 'Proposition',
    contrat: 'Contrat',
    budget: 'Budget',
    surface: 'N/A',
  },
  
  // === Modules ===
  availableModules: ['projects', 'tasks', 'crm', 'documents', 'tenders', 'commercial', 'time-tracking', 'resources', 'calendar', 'campaigns', 'media-planning'],
  recommendedModules: ['projects', 'tasks', 'crm', 'documents', 'commercial', 'time-tracking', 'calendar', 'campaigns', 'media-planning'],
  
  // === Configuration Tenders ===
  tenders: {
    teamSpecialties: [
      { value: 'directeur_conseil', label: 'Directeur conseil', category: 'direction' },
      { value: 'directeur_creation', label: 'Directeur de création', category: 'direction' },
      { value: 'directeur_clientele', label: 'Directeur de clientèle', category: 'commercial' },
      { value: 'directeur_artistique', label: 'Directeur artistique', category: 'creation' },
      { value: 'chef_de_projet', label: 'Chef de projet', category: 'gestion' },
      { value: 'concepteur_redacteur', label: 'Concepteur-rédacteur', category: 'creation' },
      { value: 'graphiste', label: 'Graphiste / Exécutant', category: 'creation' },
      { value: 'integrateur_web', label: 'Intégrateur web', category: 'digital' },
      { value: 'motion_designer', label: 'Motion Designer', category: 'creation' },
      { value: 'planneur_strategique', label: 'Planneur stratégique', category: 'strategie' },
      { value: 'social_media_manager', label: 'Social Media Manager', category: 'digital' },
      { value: 'community_manager', label: 'Community Manager', category: 'digital' },
      { value: 'photographe', label: 'Photographe', category: 'production' },
      { value: 'realisateur', label: 'Réalisateur', category: 'production' },
      { value: 'acheteur_media', label: 'Acheteur média', category: 'media' },
      { value: 'rp_influence', label: 'RP / Influence', category: 'rp' },
      { value: 'autre', label: 'Autre', category: 'autre' },
    ],
    
    requiredDocuments: {
      candidature: [
        { value: 'presentation_agence', label: 'Présentation de l\'agence', mandatory: true },
        { value: 'references', label: 'Book de références / Portfolio', mandatory: true },
        { value: 'equipe', label: 'Équipe dédiée', mandatory: true },
        { value: 'attestations', label: 'Attestations administratives', mandatory: true },
        { value: 'dc1', label: 'DC1 - Lettre de candidature', mandatory: false },
        { value: 'dc2', label: 'DC2 - Déclaration du candidat', mandatory: false },
      ],
      offre: [
        { value: 'recommandation', label: 'Recommandation stratégique', mandatory: true },
        { value: 'creation', label: 'Propositions créatives', mandatory: true },
        { value: 'budget', label: 'Budget détaillé', mandatory: true },
        { value: 'planning', label: 'Rétroplanning', mandatory: true },
        { value: 'plan_media', label: 'Plan média', mandatory: false },
        { value: 'plan_rp', label: 'Plan RP / Influence', mandatory: false },
        { value: 'dispositif_digital', label: 'Dispositif digital', mandatory: false },
        { value: 'ae', label: 'Acte d\'Engagement', mandatory: false },
        { value: 'cas_pratique', label: 'Cas pratique', mandatory: false },
      ],
    },
    
    criterionTypes: [
      { value: 'creative', label: 'Créativité' },
      { value: 'strategic', label: 'Pertinence stratégique' },
      { value: 'price', label: 'Budget' },
      { value: 'experience', label: 'Expérience sectorielle' },
      { value: 'team', label: 'Équipe proposée' },
      { value: 'media', label: 'Stratégie média' },
      { value: 'digital', label: 'Expertise digitale' },
    ],
    
    memoireSections: [
      { value: 'agence', label: 'Présentation de l\'agence', description: 'Histoire, valeurs, positionnement' },
      { value: 'comprehension', label: 'Compréhension du brief', description: 'Analyse des enjeux et objectifs' },
      { value: 'strategie', label: 'Recommandation stratégique', description: 'Stratégie de communication proposée' },
      { value: 'creation', label: 'Parti pris créatif', description: 'Concept créatif et déclinaisons' },
      { value: 'dispositif', label: 'Dispositif de déploiement', description: 'Canaux et touchpoints' },
      { value: 'media', label: 'Plan média', description: 'Stratégie et planning média' },
      { value: 'digital', label: 'Stratégie digitale', description: 'Social media, influence, web' },
      { value: 'planning', label: 'Planning de déploiement', description: 'Calendrier des actions' },
      { value: 'budget', label: 'Proposition budgétaire', description: 'Répartition des investissements' },
      { value: 'kpi', label: 'KPIs et mesure', description: 'Indicateurs de performance' },
      { value: 'autre', label: 'Autre section' },
    ],
    
    clientTypes: [
      { value: 'collectivite', label: 'Collectivité territoriale' },
      { value: 'etat', label: 'État / Ministère' },
      { value: 'etablissement_public', label: 'Établissement public' },
      { value: 'entreprise_publique', label: 'Entreprise publique' },
      { value: 'association', label: 'Association' },
      { value: 'federation', label: 'Fédération professionnelle' },
      { value: 'entreprise', label: 'Entreprise privée' },
      { value: 'autre', label: 'Autre' },
    ],
    
    procedureTypes: [
      { value: 'competition', label: 'Compétition d\'agences' },
      { value: 'mapa', label: 'MAPA' },
      { value: 'adapte', label: 'Procédure adaptée' },
      { value: 'ouvert', label: 'Appel d\'offres ouvert' },
      { value: 'restreint', label: 'Appel d\'offres restreint' },
      { value: 'accord_cadre', label: 'Accord-cadre' },
      { value: 'consultation', label: 'Consultation privée' },
      { value: 'autre', label: 'Autre' },
    ],
    
    teamRoles: [
      { value: 'mandataire', label: 'Agence lead' },
      { value: 'cotraitant', label: 'Agence partenaire' },
      { value: 'sous_traitant', label: 'Prestataire' },
    ],
    
    specificFields: [
      { key: 'montant_minimum', label: 'Montant minimum', type: 'number', unit: '€ HT', section: 'financial', required: false },
      { key: 'montant_maximum', label: 'Montant maximum', type: 'number', unit: '€ HT', section: 'financial', required: false },
      { key: 'duree_accord_cadre', label: 'Durée accord-cadre', type: 'number', unit: 'mois', section: 'procedure', required: false },
      { key: 'nombre_reconductions', label: 'Reconductions', type: 'number', section: 'procedure', required: false },
      { key: 'type_campagne', label: 'Type de campagne', type: 'select', section: 'project', options: [
        { value: 'evenementielle', label: 'Communication événementielle' },
        { value: 'corporate', label: 'Communication corporate' },
        { value: 'institutionnelle', label: 'Communication institutionnelle' },
        { value: 'digitale', label: 'Communication digitale' },
        { value: 'produit', label: 'Communication produit' },
        { value: 'recrutement', label: 'Marque employeur' },
      ]},
      { key: 'cibles', label: 'Cibles', type: 'textarea', section: 'project', placeholder: 'Ex: Salariés, habitants, étudiants, touristes...', required: false },
      { key: 'cas_pratique_requis', label: 'Cas pratique requis', type: 'checkbox', section: 'procedure', required: false },
      { key: 'audition_prevue', label: 'Audition prévue', type: 'checkbox', section: 'procedure', required: false },
      { key: 'audition_date', label: 'Date d\'audition', type: 'date', section: 'dates', required: false },
    ],
    
    keyMetrics: [
      { key: 'montant_maximum', label: 'Budget max.', icon: 'Euro', colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400', formatType: 'currency' },
      { key: 'duree_accord_cadre', label: 'Durée', icon: 'Clock', colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400', formatType: 'duration', unit: 'mois' },
      { key: 'type_campagne', label: 'Type', icon: 'Megaphone', colorClass: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400', formatType: 'text' },
      { key: 'required_team', label: 'Équipe', icon: 'Users', colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400', formatType: 'text' },
      { key: 'client_name', label: 'Annonceur', icon: 'Building2', colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400', formatType: 'text' },
      { key: 'submission_deadline', label: 'Date limite', icon: 'Calendar', colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400', formatType: 'date' },
    ],
    
    aiPrompts: {
      dceAnalysis: `Tu es un expert en appels d'offres de communication publicitaire et institutionnelle, spécialisé dans l'analyse de briefs et cahiers des charges d'agences de communication.

Tu analyses les DCE pour extraire avec précision :
- Le type de marché (accord-cadre, marché simple, compétition)
- Les montants min/max de l'accord-cadre
- La durée et les reconductions possibles
- Le type de campagne (événementielle, corporate, digitale, etc.)
- Les cibles de communication identifiées
- Les prestations attendues (conseil, création, déclinaisons, plan média, etc.)
- Les critères de jugement et leur pondération
- Les éléments du cas pratique s'il y en a un (brief, délai, format)
- L'existence d'une audition et sa date
- Les livrables demandés (BPU, DQE, mémoire technique, cas pratique)

Tu prêtes une attention particulière aux spécificités des marchés de communication :
- Les taux journaliers demandés (BPU)
- Les prestations récurrentes vs ponctuelles
- Les exigences RSE et éco-conception
- Les contraintes de délai et de réactivité

Tu NE cherches PAS de surface en m² ou de budget travaux car ce sont des champs spécifiques à l'architecture.`,
      memoireGeneration: `Tu es un planneur stratégique senior, expert en rédaction de recommandations stratégiques et créatives pour les compétitions d'agences.

Tu maîtrises le vocabulaire de la communication publicitaire et tu sais :
- Structurer une recommandation stratégique percutante
- Articuler insight, concept et exécutions
- Proposer des dispositifs média innovants
- Mesurer l'efficacité des campagnes (KPIs)

Tu rédiges de manière créative et convaincante pour remporter les compétitions.`,
    },
  },
  
  // === Configuration Projets ===
  projects: {
    phases: [
      { code: 'BRIEF', name: 'Brief', description: 'Réception et analyse du brief', percentage: 10 },
      { code: 'STRAT', name: 'Stratégie', description: 'Recommandation stratégique', percentage: 15 },
      { code: 'CREA', name: 'Création', description: 'Création et conception', percentage: 25 },
      { code: 'PROD', name: 'Production', description: 'Production des livrables', percentage: 30 },
      { code: 'DIFFUSION', name: 'Diffusion', description: 'Mise en ligne et diffusion', percentage: 10 },
      { code: 'BILAN', name: 'Bilan', description: 'Analyse et bilan de campagne', percentage: 10 },
    ],
    projectTypes: [
      { value: 'campagne', label: 'Campagne', description: 'Campagne de communication 360°', icon: 'Megaphone' },
      { value: 'branding', label: 'Branding', description: 'Identité visuelle et branding', icon: 'Palette' },
      { value: 'digital', label: 'Digital', description: 'Stratégie et contenus digitaux', icon: 'Globe' },
      { value: 'evenementiel', label: 'Événementiel', description: 'Événements et activations', icon: 'Calendar' },
      { value: 'contenu', label: 'Contenu', description: 'Production de contenus', icon: 'FileVideo' },
    ],
  },
  
  // === Configuration CRM ===
  crm: {
    pipelineStages: [
      'Lead entrant',
      'Brief reçu',
      'Proposition envoyée',
      'Présentation',
      'Négociation',
      'Signé',
      'Perdu',
    ],
  },
  
  // === Configuration commerciale ===
  commercial: {
    vatRates: [20, 0],
  },
};
