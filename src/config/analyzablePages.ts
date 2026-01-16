export interface AnalyzablePage {
  id: string;
  name: string;
  route: string;
  description: string;
  expectedFeatures: string[];
  styleGuide: string[];
}

export const analyzablePages: AnalyzablePage[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    route: '/',
    description: 'Page d\'accueil avec widgets de statistiques, tâches récentes et projets',
    expectedFeatures: [
      'Widgets statistiques avec données temps réel',
      'Liste des tâches du jour',
      'Projets récents avec progression',
      'Graphiques de performance',
      'États de chargement (skeleton)',
      'États vides avec messages explicites',
    ],
    styleGuide: [
      'Padding uniforme sur les widgets (p-4 ou p-6)',
      'Espacements cohérents entre les sections',
      'Typographie hiérarchique claire',
      'Couleurs sémantiques pour les statuts',
    ],
  },
  {
    id: 'crm',
    name: 'CRM',
    route: '/crm',
    description: 'Gestion des contacts, entreprises et pipelines commerciaux',
    expectedFeatures: [
      'Vue Kanban des pipelines',
      'Liste des contacts avec filtres',
      'Fiches entreprises détaillées',
      'Historique des interactions',
      'Recherche et filtrage avancés',
    ],
    styleGuide: [
      'Cartes uniformes pour contacts/entreprises',
      'Badges de statut cohérents',
      'Colonnes Kanban avec espacements égaux',
      'Avatars et initiales stylés uniformément',
    ],
  },
  {
    id: 'projects',
    name: 'Projets',
    route: '/projects',
    description: 'Liste et gestion des projets avec phases et tâches',
    expectedFeatures: [
      'Grille ou liste de projets',
      'Indicateurs de progression',
      'Filtres par statut/client',
      'Actions rapides (archiver, dupliquer)',
      'Vue détaillée du projet',
    ],
    styleGuide: [
      'Cartes projet avec informations clés visibles',
      'Barres de progression uniformes',
      'Badges de phase cohérents',
      'Espacements entre cartes réguliers',
    ],
  },
  {
    id: 'tasks',
    name: 'Tâches',
    route: '/tasks',
    description: 'Gestion des tâches avec vues liste et Kanban',
    expectedFeatures: [
      'Vue Kanban par statut',
      'Vue liste avec tri/filtres',
      'Drag & drop entre colonnes',
      'Assignation de membres',
      'Dates d\'échéance avec alertes',
    ],
    styleGuide: [
      'Cartes tâches compactes et lisibles',
      'Indicateurs de priorité colorés',
      'Avatars des assignés cohérents',
      'Colonnes avec compteurs',
    ],
  },
  {
    id: 'commercial',
    name: 'Commercial',
    route: '/commercial',
    description: 'Gestion des devis, contrats et documents commerciaux',
    expectedFeatures: [
      'Liste des documents avec statuts',
      'Création/édition de devis',
      'Génération PDF',
      'Suivi des signatures',
      'Calculs automatiques (HT/TTC)',
    ],
    styleGuide: [
      'Tableaux avec colonnes alignées',
      'Montants formatés uniformément',
      'Statuts avec codes couleur',
      'Actions groupées visibles',
    ],
  },
  {
    id: 'invoicing',
    name: 'Facturation',
    route: '/invoicing',
    description: 'Gestion des factures et suivi des paiements',
    expectedFeatures: [
      'Liste des factures avec filtres',
      'Statuts de paiement',
      'Génération et envoi de factures',
      'Rappels automatiques',
      'Statistiques de facturation',
    ],
    styleGuide: [
      'Montants alignés à droite',
      'Couleurs pour retards de paiement',
      'Dates formatées uniformément',
      'Actions contextuelles claires',
    ],
  },
  {
    id: 'tenders',
    name: 'Appels d\'offres',
    route: '/tenders',
    description: 'Gestion des appels d\'offres et réponses',
    expectedFeatures: [
      'Liste des AO avec deadlines',
      'Analyse de documents DCE',
      'Génération de réponses',
      'Suivi des soumissions',
      'Calendrier des échéances',
    ],
    styleGuide: [
      'Cartes AO avec urgence visible',
      'Indicateurs de deadline colorés',
      'Progress bars pour avancement',
      'Tags de catégorie cohérents',
    ],
  },
  {
    id: 'calendar',
    name: 'Calendrier',
    route: '/calendar',
    description: 'Calendrier avec événements et tâches',
    expectedFeatures: [
      'Vues jour/semaine/mois',
      'Événements par type (réunion, deadline, etc.)',
      'Drag & drop d\'événements',
      'Création rapide d\'événements',
      'Synchronisation calendriers externes',
    ],
    styleGuide: [
      'Couleurs par type d\'événement',
      'Police lisible dans les cellules',
      'Hover states sur les événements',
      'Navigation intuitive entre vues',
    ],
  },
  {
    id: 'team',
    name: 'Équipe',
    route: '/team',
    description: 'Gestion de l\'équipe et des absences',
    expectedFeatures: [
      'Liste des membres',
      'Calendrier des absences',
      'Suivi du temps',
      'Compétences et rôles',
      'Charge de travail',
    ],
    styleGuide: [
      'Cartes membres uniformes',
      'Avatars de taille cohérente',
      'Badges de rôle stylés',
      'Indicateurs de disponibilité',
    ],
  },
  {
    id: 'settings',
    name: 'Paramètres',
    route: '/settings',
    description: 'Configuration du workspace et préférences',
    expectedFeatures: [
      'Navigation claire entre sections',
      'Formulaires de configuration',
      'Sauvegarde avec feedback',
      'Gestion des permissions',
      'Personnalisation du workspace',
    ],
    styleGuide: [
      'Sidebar navigation cohérente',
      'Labels de formulaire alignés',
      'Boutons d\'action positionnés uniformément',
      'Messages de succès/erreur stylés',
    ],
  },
];

export function getPageById(id: string): AnalyzablePage | undefined {
  return analyzablePages.find(page => page.id === id);
}
