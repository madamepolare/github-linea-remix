// ============================================
// Configuration complète : ARCHITECTURE
// ============================================

import { Building2 } from "lucide-react";
import type { DisciplineDefinition } from "./types";

export const ARCHITECTURE_DISCIPLINE: DisciplineDefinition = {
  // === Identité ===
  slug: 'architecture',
  name: 'Architecture',
  shortName: 'Archi',
  description: 'Projets de construction, réhabilitation, aménagement',
  icon: Building2,
  color: 'hsl(220, 70%, 50%)',
  
  // === Terminologie ===
  terminology: {
    project: 'Projet',
    projects: 'Projets',
    phase: 'Phase',
    phases: 'Phases',
    lot: 'Lot',
    lots: 'Lots',
    chantier: 'Chantier',
    client: 'Maître d\'ouvrage',
    clients: 'Maîtres d\'ouvrage',
    intervenant: 'Intervenant',
    intervenants: 'Intervenants',
    dce: 'DCE',
    devis: 'Honoraires',
    contrat: 'Contrat de maîtrise d\'œuvre',
    budget: 'Budget travaux',
    surface: 'Surface',
  },
  
  // === Modules ===
  availableModules: ['projects', 'tasks', 'crm', 'documents', 'tenders', 'commercial', 'construction', 'time-tracking', 'resources', 'calendar', 'references'],
  recommendedModules: ['projects', 'tasks', 'crm', 'documents', 'tenders', 'commercial', 'construction'],
  
  // === Configuration Tenders ===
  tenders: {
    // === ONGLETS ARCHITECTURE ===
    tabs: [
      { key: 'synthese', label: 'Synthèse', icon: 'LayoutDashboard', component: 'TenderSyntheseTab', visible: true, order: 1 },
      { key: 'equipe', label: 'Honoraires & Équipe', icon: 'Users', component: 'TenderEquipeTab', visible: true, order: 2 },
      { key: 'calendrier', label: 'Calendrier', icon: 'Calendar', component: 'TenderCalendarTab', visible: true, order: 3 },
      { key: 'tasks', label: 'Tâches', icon: 'CheckSquare', component: 'EntityTasksList', visible: true, order: 4 },
      { key: 'documents', label: 'DCE', icon: 'FolderOpen', component: 'TenderDocumentsTab', visible: true, order: 5 },
      { key: 'emails', label: 'Emails', icon: 'Mail', component: 'EntityEmailsTab', visible: true, order: 6 },
      { key: 'livrables', label: 'Livrables', icon: 'ListTodo', component: 'TenderLivrablesTab', visible: true, order: 7 },
      { key: 'memoire', label: 'Mémoire', icon: 'PenTool', component: 'TenderMemoireTab', visible: true, order: 8 },
    ],
    
    // === BLOCS SYNTHÈSE ARCHITECTURE ===
    synthesisBlocks: [
      { key: 'budget', label: 'Budget travaux', component: 'BudgetBlock', visible: true, order: 1 },
      { key: 'honoraires', label: 'Honoraires MOE', component: 'HonorairesBlock', visible: true, order: 2 },
      { key: 'missions', label: 'Missions', component: 'MissionsBlock', visible: true, order: 3 },
      { key: 'surface', label: 'Surface', component: 'SurfaceBlock', visible: true, order: 4 },
      { key: 'criteres', label: 'Critères', component: 'CriteresBlock', visible: true, order: 5 },
      { key: 'equipe_requise', label: 'Équipe requise', component: 'EquipeRequisBlock', visible: true, order: 6 },
      { key: 'visite', label: 'Visite de site', component: 'VisiteBlock', visible: true, order: 7 },
    ],
    
    // === SECTIONS FORMULAIRE ARCHITECTURE ===
    formSections: [
      { key: 'general', label: 'Informations générales', fields: ['title', 'reference', 'description', 'tender_type'], visible: true, order: 1 },
      { key: 'client', label: 'Maître d\'ouvrage', fields: ['client_name', 'client_type', 'client_address', 'client_contact_name', 'client_contact_email'], visible: true, order: 2 },
      { key: 'projet', label: 'Projet', fields: ['location', 'surface_area', 'project_type', 'work_nature_tags'], visible: true, order: 3 },
      { key: 'financial', label: 'Budget & Honoraires', fields: ['estimated_budget', 'moe_fee_percentage', 'moe_fee_amount', 'moe_phases'], visible: true, order: 4 },
      { key: 'procedure', label: 'Procédure', fields: ['procedure_type', 'submission_type', 'allows_variants', 'allows_joint_venture'], visible: true, order: 5 },
      { key: 'dates', label: 'Dates', fields: ['submission_deadline', 'site_visit_date', 'jury_date', 'results_date'], visible: true, order: 6 },
    ],
    
    teamSpecialties: [
      { value: 'architecte', label: 'Architecte', category: 'moe' },
      { value: 'bet_structure', label: 'BET Structure', category: 'bet' },
      { value: 'bet_fluides', label: 'BET Fluides', category: 'bet' },
      { value: 'bet_electricite', label: 'BET Électricité', category: 'bet' },
      { value: 'thermicien', label: 'Thermicien / RE2020', category: 'bet' },
      { value: 'economiste', label: 'Économiste', category: 'moe' },
      { value: 'acousticien', label: 'Acousticien', category: 'bet' },
      { value: 'paysagiste', label: 'Paysagiste', category: 'moe' },
      { value: 'vrd', label: 'VRD', category: 'bet' },
      { value: 'opc', label: 'OPC', category: 'moe' },
      { value: 'ssi', label: 'SSI', category: 'bet' },
      { value: 'cuisiniste', label: 'Cuisiniste', category: 'bet' },
      { value: 'bet_facade', label: 'BET Façade', category: 'bet' },
      { value: 'geometre', label: 'Géomètre', category: 'bet' },
      { value: 'geotechnicien', label: 'Géotechnicien', category: 'bet' },
      { value: 'scenographe', label: 'Scénographe', category: 'moe' },
      { value: 'eclairagiste', label: 'Éclairagiste', category: 'bet' },
      { value: 'signaletique', label: 'Signalétique', category: 'moe' },
      { value: 'autre', label: 'Autre', category: 'autre' },
    ],
    
    requiredDocuments: {
      candidature: [
        { value: 'dc1', label: 'DC1 - Lettre de candidature', mandatory: true },
        { value: 'dc2', label: 'DC2 - Déclaration du candidat', mandatory: true },
        { value: 'attestation_assurance', label: 'Attestation d\'assurance', mandatory: true },
        { value: 'attestation_urssaf', label: 'Attestation URSSAF', mandatory: true },
        { value: 'attestation_fiscale', label: 'Attestation fiscale', mandatory: true },
        { value: 'kbis', label: 'Extrait Kbis', mandatory: true },
        { value: 'references', label: 'Références', mandatory: true },
        { value: 'moyens_humains', label: 'Moyens humains', mandatory: false },
        { value: 'moyens_techniques', label: 'Moyens techniques', mandatory: false },
        { value: 'cv_equipe', label: 'CV de l\'équipe', mandatory: false },
      ],
      offre: [
        { value: 'ae', label: 'Acte d\'Engagement', mandatory: true },
        { value: 'memoire_technique', label: 'Mémoire technique', mandatory: true },
        { value: 'dpgf', label: 'DPGF / BPU', mandatory: true },
        { value: 'planning', label: 'Planning prévisionnel', mandatory: false },
        { value: 'note_methodologique', label: 'Note méthodologique', mandatory: false },
        { value: 'dc4', label: 'DC4 - Sous-traitance', mandatory: false },
        { value: 'attestation_visite', label: 'Attestation de visite', mandatory: false },
        { value: 'pieces_graphiques', label: 'Pièces graphiques', mandatory: false },
      ],
    },
    
    criterionTypes: [
      { value: 'price', label: 'Prix' },
      { value: 'technical', label: 'Valeur technique' },
      { value: 'delay', label: 'Délais' },
      { value: 'environmental', label: 'Environnement' },
      { value: 'social', label: 'Social' },
    ],
    
    memoireSections: [
      { value: 'presentation', label: 'Présentation de l\'équipe', description: 'Présentation du groupement et des compétences' },
      { value: 'references', label: 'Références et expériences', description: 'Projets similaires réalisés' },
      { value: 'methodologie', label: 'Note méthodologique', description: 'Organisation et méthode de travail' },
      { value: 'equipe', label: 'Moyens humains', description: 'Équipe dédiée au projet' },
      { value: 'planning', label: 'Planning prévisionnel', description: 'Calendrier d\'intervention' },
      { value: 'qualite', label: 'Démarche qualité', description: 'Contrôle qualité et suivi' },
      { value: 'environnement', label: 'Approche environnementale', description: 'Démarche RE2020, matériaux, énergie' },
      { value: 'autre', label: 'Autre section' },
    ],
    
    clientTypes: [
      { value: 'client_public', label: 'MOA Public' },
      { value: 'bailleur_social', label: 'Bailleur social' },
      { value: 'collectivite', label: 'Collectivité territoriale' },
      { value: 'etat', label: 'État / Ministère' },
      { value: 'hopital', label: 'Établissement de santé' },
      { value: 'universite', label: 'Université / Enseignement' },
      { value: 'etablissement_public', label: 'Établissement public' },
      { value: 'prive', label: 'Client privé' },
      { value: 'autre', label: 'Autre' },
    ],
    
    procedureTypes: [
      { value: 'ouvert', label: 'Appel d\'offres ouvert' },
      { value: 'restreint', label: 'Appel d\'offres restreint' },
      { value: 'adapte', label: 'Procédure adaptée' },
      { value: 'mapa', label: 'MAPA' },
      { value: 'concours', label: 'Concours' },
      { value: 'dialogue', label: 'Dialogue compétitif' },
      { value: 'partenariat', label: 'Partenariat d\'innovation' },
      { value: 'ppp', label: 'Partenariat Public-Privé' },
      { value: 'conception_realisation', label: 'Conception-Réalisation' },
      { value: 'autre', label: 'Autre' },
    ],
    
    teamRoles: [
      { value: 'mandataire', label: 'Mandataire' },
      { value: 'cotraitant', label: 'Cotraitant' },
      { value: 'sous_traitant', label: 'Sous-traitant' },
    ],
    
    specificFields: [
      { key: 'estimated_budget', label: 'Budget travaux estimé', type: 'number', unit: '€ HT', section: 'financial', required: false },
      { key: 'surface_area', label: 'Surface', type: 'number', unit: 'm²', section: 'project', required: false },
      { key: 'location', label: 'Localisation du projet', type: 'text', section: 'project', required: false },
      { key: 'project_type', label: 'Type de projet', type: 'select', section: 'project', options: [
        { value: 'neuf', label: 'Construction neuve' },
        { value: 'rehabilitation', label: 'Réhabilitation' },
        { value: 'extension', label: 'Extension' },
        { value: 'renovation', label: 'Rénovation' },
      ]},
    ],
    
    keyMetrics: [
      { key: 'estimated_budget', label: 'Budget travaux', icon: 'Euro', colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400', formatType: 'currency' },
      { key: 'surface_area', label: 'Surface', icon: 'Ruler', colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400', formatType: 'number', unit: 'm²' },
      { key: 'location', label: 'Localisation', icon: 'MapPin', colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400', formatType: 'text' },
      { key: 'required_team', label: 'Équipe', icon: 'Users', colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400', formatType: 'text' },
      { key: 'client_name', label: 'Maître d\'ouvrage', icon: 'Building2', colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400', formatType: 'text' },
      { key: 'site_visit_date', label: 'Visite de site', icon: 'Calendar', colorClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400', formatType: 'date' },
    ],
    
    aiPrompts: {
      dceAnalysis: `Tu es un expert senior en marchés publics français, spécialisé dans les concours d'architecture et les missions de maîtrise d'œuvre (MOE).

Tu analyses les DCE pour extraire avec précision :
- Le budget travaux estimé ou l'enveloppe financière
- La surface totale du projet (m² SHON, SDP, ou autre)
- La localisation précise du projet
- Les missions MOE demandées (ESQ, APS, APD, PRO, DCE, ACT, VISA, DET, AOR, OPC, etc.)
- La composition de l'équipe requise (BET Structure, BET Fluides, Économiste, etc.)
- Le type de marché (MOE, Conception-Réalisation, Concours)
- Les critères de jugement et leur pondération
- Les dates clés (remise candidature, remise offre, jury, visite de site)

Tu prêtes une attention particulière aux spécificités des marchés de maîtrise d'œuvre et aux exigences techniques RE2020, environnementales et de performance énergétique.`,
      memoireGeneration: `Tu es un rédacteur expert en marchés publics de maîtrise d'œuvre, spécialisé dans la rédaction de mémoires techniques pour les concours d'architecture.

Tu maîtrises le vocabulaire technique de l'architecture et de la construction, et tu sais mettre en valeur :
- L'expérience du groupement sur des projets similaires
- La méthodologie de travail et l'organisation de la mission
- Les engagements environnementaux (RE2020, matériaux biosourcés, etc.)
- La démarche qualité et le respect des délais

Tu rédiges de manière claire, structurée et convaincante pour répondre aux critères du jury.`,
    },
  },
  
  // === Configuration Projets ===
  projects: {
    phases: [
      { code: 'ESQ', name: 'Esquisse', description: 'Études préliminaires et esquisse', percentage: 10 },
      { code: 'APS', name: 'Avant-Projet Sommaire', description: 'Études d\'avant-projet sommaire', percentage: 10 },
      { code: 'APD', name: 'Avant-Projet Définitif', description: 'Études d\'avant-projet définitif', percentage: 15 },
      { code: 'PRO', name: 'Projet', description: 'Études de projet', percentage: 20 },
      { code: 'DCE', name: 'DCE', description: 'Dossier de consultation des entreprises', percentage: 10 },
      { code: 'ACT', name: 'Passation des marchés', description: 'Assistance aux contrats de travaux', percentage: 5 },
      { code: 'VISA', name: 'Visa', description: 'Visa des études d\'exécution', percentage: 5 },
      { code: 'DET', name: 'Direction travaux', description: 'Direction de l\'exécution des travaux', percentage: 20 },
      { code: 'AOR', name: 'Réception', description: 'Assistance aux opérations de réception', percentage: 5 },
    ],
    projectTypes: [
      { value: 'construction', label: 'Construction neuve', description: 'Projet de construction neuve', icon: 'Building2' },
      { value: 'renovation', label: 'Rénovation', description: 'Réhabilitation et rénovation', icon: 'Hammer' },
      { value: 'extension', label: 'Extension', description: 'Extension de bâtiment existant', icon: 'Maximize2' },
      { value: 'permis', label: 'Permis de construire', description: 'Dépôt de permis uniquement', icon: 'FileCheck' },
      { value: 'urbanisme', label: 'Urbanisme', description: 'Projet d\'urbanisme', icon: 'Map' },
    ],
  },
  
  // === Configuration CRM ===
  crm: {
    pipelineStages: [
      'Premier contact',
      'Visite',
      'Programme défini',
      'Proposition envoyée',
      'Négociation',
      'Signé',
      'Perdu',
    ],
  },
  
  // === Configuration commerciale ===
  commercial: {
    vatRates: [20, 10, 5.5, 0],
  },
};
