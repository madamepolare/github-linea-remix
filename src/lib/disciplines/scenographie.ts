// ============================================
// Configuration complète : SCÉNOGRAPHIE
// ============================================

import { Theater } from "lucide-react";
import type { DisciplineDefinition } from "./types";

export const SCENOGRAPHIE_DISCIPLINE: DisciplineDefinition = {
  // === Identité ===
  slug: 'scenographie',
  name: 'Scénographie',
  shortName: 'Scéno',
  description: 'Expositions, muséographie, événementiel',
  icon: Theater,
  color: 'hsl(340, 70%, 50%)',
  
  // === Terminologie ===
  terminology: {
    project: 'Projet',
    projects: 'Projets',
    phase: 'Étape',
    phases: 'Étapes',
    lot: 'Lot',
    lots: 'Lots',
    chantier: 'Montage',
    client: 'Commanditaire',
    clients: 'Commanditaires',
    intervenant: 'Prestataire',
    intervenants: 'Prestataires',
    dce: 'Cahier des charges',
    devis: 'Proposition',
    contrat: 'Contrat',
    budget: 'Budget scénographie',
    surface: 'Surface d\'exposition',
  },
  
  // === Modules ===
  availableModules: ['projects', 'tasks', 'crm', 'documents', 'tenders', 'commercial', 'time-tracking', 'resources', 'calendar', 'references', 'objects'],
  recommendedModules: ['projects', 'tasks', 'crm', 'documents', 'tenders', 'commercial', 'references'],
  
  // === Configuration Tenders ===
  tenders: {
    teamSpecialties: [
      { value: 'scenographe', label: 'Scénographe', category: 'creation' },
      { value: 'graphiste', label: 'Graphiste', category: 'creation' },
      { value: 'architecte_interieur', label: 'Architecte d\'intérieur', category: 'creation' },
      { value: 'eclairagiste', label: 'Éclairagiste', category: 'technique' },
      { value: 'sonorisateur', label: 'Ingénieur son', category: 'technique' },
      { value: 'multimedia', label: 'Concepteur multimédia', category: 'technique' },
      { value: 'signaletique', label: 'Signalétique', category: 'creation' },
      { value: 'conservateur', label: 'Conservateur / Commissaire', category: 'conseil' },
      { value: 'menuisier_agenceur', label: 'Menuisier / Agenceur', category: 'fabrication' },
      { value: 'bet_structure', label: 'BET Structure', category: 'technique' },
      { value: 'economiste', label: 'Économiste', category: 'moe' },
      { value: 'autre', label: 'Autre', category: 'autre' },
    ],
    
    requiredDocuments: {
      candidature: [
        { value: 'dc1', label: 'DC1 - Lettre de candidature', mandatory: true },
        { value: 'dc2', label: 'DC2 - Déclaration du candidat', mandatory: true },
        { value: 'references', label: 'Book de références', mandatory: true },
        { value: 'attestations', label: 'Attestations administratives', mandatory: true },
        { value: 'cv_equipe', label: 'CV de l\'équipe dédiée', mandatory: true },
        { value: 'moyens_techniques', label: 'Moyens techniques', mandatory: false },
      ],
      offre: [
        { value: 'ae', label: 'Acte d\'Engagement', mandatory: true },
        { value: 'note_intention', label: 'Note d\'intention scénographique', mandatory: true },
        { value: 'esquisse', label: 'Esquisses / Planches graphiques', mandatory: true },
        { value: 'dpgf', label: 'DPGF / Chiffrage détaillé', mandatory: true },
        { value: 'planning', label: 'Planning de réalisation', mandatory: false },
        { value: 'memoire_technique', label: 'Mémoire technique', mandatory: false },
      ],
    },
    
    criterionTypes: [
      { value: 'artistic', label: 'Qualité artistique' },
      { value: 'scenographic', label: 'Pertinence scénographique' },
      { value: 'price', label: 'Prix' },
      { value: 'technical', label: 'Faisabilité technique' },
      { value: 'experience', label: 'Expérience muséographique' },
      { value: 'delay', label: 'Délais' },
    ],
    
    memoireSections: [
      { value: 'presentation', label: 'Présentation de l\'équipe', description: 'Présentation du groupement' },
      { value: 'intention', label: 'Intention scénographique', description: 'Parti pris artistique et narratif' },
      { value: 'references', label: 'Références', description: 'Expositions et projets similaires' },
      { value: 'parcours', label: 'Parcours visiteur', description: 'Scénario de visite et expérience' },
      { value: 'technique', label: 'Dispositifs techniques', description: 'Éclairage, multimédia, son' },
      { value: 'planning', label: 'Planning', description: 'Calendrier de conception et réalisation' },
      { value: 'budget', label: 'Approche budgétaire', description: 'Répartition des coûts' },
      { value: 'autre', label: 'Autre section' },
    ],
    
    clientTypes: [
      { value: 'musee_national', label: 'Musée national' },
      { value: 'musee_territorial', label: 'Musée territorial' },
      { value: 'collectivite', label: 'Collectivité territoriale' },
      { value: 'fondation', label: 'Fondation' },
      { value: 'etablissement_culturel', label: 'Établissement culturel' },
      { value: 'entreprise', label: 'Entreprise privée' },
      { value: 'autre', label: 'Autre' },
    ],
    
    procedureTypes: [
      { value: 'concours', label: 'Concours de scénographie' },
      { value: 'mapa', label: 'MAPA' },
      { value: 'adapte', label: 'Procédure adaptée' },
      { value: 'restreint', label: 'Appel d\'offres restreint' },
      { value: 'dialogue', label: 'Dialogue compétitif' },
      { value: 'consultation', label: 'Consultation privée' },
      { value: 'autre', label: 'Autre' },
    ],
    
    teamRoles: [
      { value: 'mandataire', label: 'Mandataire' },
      { value: 'cotraitant', label: 'Cotraitant' },
      { value: 'sous_traitant', label: 'Sous-traitant' },
    ],
    
    specificFields: [
      { key: 'estimated_budget', label: 'Budget scénographie', type: 'number', unit: '€ HT', section: 'financial', required: false },
      { key: 'surface_area', label: 'Surface d\'exposition', type: 'number', unit: 'm²', section: 'project', required: false },
      { key: 'location', label: 'Lieu', type: 'text', section: 'project', required: false },
      { key: 'exposition_type', label: 'Type d\'exposition', type: 'select', section: 'project', options: [
        { value: 'permanente', label: 'Exposition permanente' },
        { value: 'temporaire', label: 'Exposition temporaire' },
        { value: 'itinerante', label: 'Exposition itinérante' },
      ]},
      { key: 'exposition_duration', label: 'Durée d\'exposition', type: 'number', unit: 'mois', section: 'project', required: false },
      { key: 'opening_date', label: 'Date d\'ouverture', type: 'date', section: 'dates', required: false },
    ],
    
    keyMetrics: [
      { key: 'estimated_budget', label: 'Budget', icon: 'Euro', colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400', formatType: 'currency' },
      { key: 'surface_area', label: 'Surface', icon: 'Ruler', colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400', formatType: 'number', unit: 'm²' },
      { key: 'location', label: 'Lieu', icon: 'MapPin', colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400', formatType: 'text' },
      { key: 'exposition_type', label: 'Type', icon: 'Frame', colorClass: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400', formatType: 'text' },
      { key: 'required_team', label: 'Équipe', icon: 'Users', colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400', formatType: 'text' },
      { key: 'client_name', label: 'Commanditaire', icon: 'Building2', colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400', formatType: 'text' },
      { key: 'site_visit_date', label: 'Visite', icon: 'Calendar', colorClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400', formatType: 'date' },
    ],
    
    aiPrompts: {
      dceAnalysis: `Tu es un expert en marchés publics culturels, spécialisé dans les appels d'offres de scénographie, muséographie et expositions.

Tu analyses les DCE pour extraire avec précision :
- Le type d'exposition (permanente, temporaire, itinérante)
- La surface d'exposition en m²
- Le budget alloué à la scénographie
- Le lieu / établissement (musée, centre d'exposition, etc.)
- La thématique ou le sujet de l'exposition
- Les prestations demandées (conception, réalisation, installation)
- La durée de l'exposition
- La date d'ouverture prévue
- Les dispositifs techniques attendus (éclairage, multimédia, son, interactif)
- La composition de l'équipe requise (scénographe, graphiste, éclairagiste, etc.)
- Les critères de jugement et leur pondération
- Les contraintes de conservation et de préservation des œuvres

Tu prêtes une attention particulière aux exigences muséographiques, à l'accessibilité et à l'expérience visiteur.`,
      memoireGeneration: `Tu es un rédacteur expert en scénographie d'exposition, spécialisé dans la rédaction de notes d'intention et mémoires techniques pour les concours culturels.

Tu maîtrises le vocabulaire de la muséographie et tu sais mettre en valeur :
- L'intention artistique et narrative du projet
- Le parcours visiteur et l'expérience proposée
- Les dispositifs scénographiques innovants
- L'intégration des contraintes de conservation
- La cohérence entre le propos et la mise en espace

Tu rédiges de manière évocatrice et convaincante pour séduire les jurys culturels.`,
    },
  },
  
  // === Configuration Projets ===
  projects: {
    phases: [
      { code: 'BRIEF', name: 'Brief', description: 'Analyse du brief et intentions', percentage: 5 },
      { code: 'CONCEPT', name: 'Concept', description: 'Concept scénographique', percentage: 20 },
      { code: 'DEV', name: 'Développement', description: 'Développement du projet', percentage: 25 },
      { code: 'PROD', name: 'Production', description: 'Suivi de production', percentage: 20 },
      { code: 'MONTAGE', name: 'Montage', description: 'Montage sur site', percentage: 25 },
      { code: 'EXPLOIT', name: 'Exploitation', description: 'Suivi d\'exploitation', percentage: 5 },
    ],
    projectTypes: [
      { value: 'exposition', label: 'Exposition', description: 'Exposition temporaire ou permanente', icon: 'Frame' },
      { value: 'musee', label: 'Muséographie', description: 'Parcours muséographique', icon: 'Landmark' },
      { value: 'evenement', label: 'Événement', description: 'Scénographie événementielle', icon: 'PartyPopper' },
      { value: 'stand', label: 'Stand', description: 'Stand de salon professionnel', icon: 'Box' },
      { value: 'spectacle', label: 'Spectacle', description: 'Décor de spectacle', icon: 'Sparkles' },
    ],
  },
  
  // === Configuration CRM ===
  crm: {
    pipelineStages: [
      'Appel d\'offres reçu',
      'Visite',
      'Proposition envoyée',
      'Présentation',
      'Négociation',
      'Lauréat',
      'Non retenu',
    ],
  },
  
  // === Configuration commerciale ===
  commercial: {
    vatRates: [20, 10, 5.5, 0],
  },
};
