import { FolderKanban, Users, FileText, Trophy, Calendar, MessageSquare } from "lucide-react";

export interface ModuleFeature {
  title: string;
  description: string;
}

export interface ModuleData {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof FolderKanban;
  color: string;
  features: ModuleFeature[];
  testimonial: {
    quote: string;
    author: string;
    role: string;
    company: string;
  };
}

export const MODULES_DATA: Record<string, ModuleData> = {
  projets: {
    slug: "projets",
    title: "Gestion de projets",
    subtitle: "De l'esquisse à la réception",
    description: "Suivez vos projets de A à Z avec une vue complète sur les phases, les livrables et les échéances. Gérez les dépendances entre phases et exportez automatiquement vos plannings.",
    icon: FolderKanban,
    color: "from-blue-500 to-cyan-500",
    features: [
      { title: "Timeline interactive", description: "Visualisez et modifiez vos phases directement sur un diagramme de Gantt interactif avec drag & drop." },
      { title: "Gestion des livrables", description: "Associez des livrables à chaque phase et suivez leur avancement en temps réel." },
      { title: "Dépendances intelligentes", description: "Définissez les dépendances entre phases et laissez le système recalculer automatiquement les dates." },
      { title: "Export PDF automatique", description: "Générez des plannings professionnels en un clic pour vos clients et partenaires." },
    ],
    testimonial: {
      quote: "La gestion des phases avec les dépendances automatiques nous a fait gagner des heures chaque semaine. On ne reviendrait pas en arrière.",
      author: "Marie Dubois",
      role: "Directrice de projet",
      company: "Studio 42",
    },
  },
  crm: {
    slug: "crm",
    title: "CRM intégré",
    subtitle: "Gérez vos relations clients",
    description: "Un CRM pensé pour les architectes. Suivez vos prospects, gérez vos contacts et transformez vos opportunités en projets concrets avec un pipeline visuel.",
    icon: Users,
    color: "from-purple-500 to-pink-500",
    features: [
      { title: "Pipeline visuel", description: "Déplacez vos opportunités entre les étapes du pipeline par simple drag & drop." },
      { title: "Historique complet", description: "Retrouvez tous les échanges, appels et rendez-vous avec chaque contact en un coup d'œil." },
      { title: "Relances automatiques", description: "Programmez des rappels et ne manquez plus jamais une opportunité de suivi." },
      { title: "Import/Export facile", description: "Importez vos contacts existants et exportez vos données à tout moment." },
    ],
    testimonial: {
      quote: "Avant, on perdait des prospects dans les emails. Maintenant, tout est centralisé et on a doublé notre taux de conversion.",
      author: "Thomas Martin",
      role: "Associé fondateur",
      company: "Atelier TM",
    },
  },
  commercial: {
    slug: "commercial",
    title: "Devis & Facturation",
    subtitle: "De la proposition à l'encaissement",
    description: "Créez des propositions commerciales professionnelles en quelques clics. Suivez vos devis, gérez les versions et transformez-les en contrats.",
    icon: FileText,
    color: "from-emerald-500 to-teal-500",
    features: [
      { title: "Générateur intelligent", description: "Créez des propositions personnalisées avec calcul automatique des honoraires selon vos barèmes." },
      { title: "Modèles personnalisables", description: "Définissez vos propres templates avec votre charte graphique et vos conditions." },
      { title: "Suivi des versions", description: "Gardez un historique complet de chaque version envoyée au client." },
      { title: "Signature électronique", description: "Faites signer vos contrats directement en ligne pour accélérer la validation." },
    ],
    testimonial: {
      quote: "On génère nos propositions 3x plus vite et elles sont beaucoup plus professionnelles. Les clients le remarquent.",
      author: "Sophie Leroux",
      role: "Gérante",
      company: "Archi+ Design",
    },
  },
  "appels-offres": {
    slug: "appels-offres",
    title: "Appels d'offres",
    subtitle: "Analysez et répondez efficacement",
    description: "L'IA analyse vos DCE et vous aide à structurer vos réponses. Gagnez du temps sur l'administratif pour vous concentrer sur le fond technique.",
    icon: Trophy,
    color: "from-amber-500 to-orange-500",
    features: [
      { title: "Analyse IA des DCE", description: "Notre IA extrait automatiquement les critères clés et les pièces à fournir." },
      { title: "Mémoire technique assisté", description: "Générez une structure de réponse basée sur l'analyse du dossier." },
      { title: "Suivi des deadlines", description: "Ne manquez plus jamais une date limite avec les rappels automatiques." },
      { title: "Collaboration équipe", description: "Travaillez à plusieurs sur la même réponse avec un suivi des contributions." },
    ],
    testimonial: {
      quote: "L'analyse automatique des DCE nous fait gagner une journée par appel d'offres. C'est un game-changer.",
      author: "Jean-Pierre Blanc",
      role: "Chef de projet",
      company: "Cabinet BPM",
    },
  },
  planning: {
    slug: "planning",
    title: "Planning chantier",
    subtitle: "Coordonnez vos intervenants",
    description: "Planifiez les interventions de chaque lot, envoyez des convocations automatiques et générez des comptes-rendus de chantier professionnels.",
    icon: Calendar,
    color: "from-rose-500 to-red-500",
    features: [
      { title: "Planning multi-lots", description: "Visualisez toutes les entreprises sur un même planning avec codes couleur." },
      { title: "Convocations automatiques", description: "Envoyez les convocations par email en un clic avec pièces jointes." },
      { title: "Comptes-rendus structurés", description: "Générez des CR de chantier avec points d'attention et photos." },
      { title: "Export grand format", description: "Exportez vos plannings en A1 ou A3 pour affichage sur chantier." },
    ],
    testimonial: {
      quote: "Les convocations automatiques et les CR structurés nous font gagner 2h par réunion de chantier.",
      author: "Nicolas Petit",
      role: "Architecte DPLG",
      company: "NP Architecture",
    },
  },
  collaboration: {
    slug: "collaboration",
    title: "Collaboration",
    subtitle: "Travaillez en équipe efficacement",
    description: "Espaces de travail partagés, commentaires contextuels et notifications en temps réel. Toute votre équipe synchronisée sur chaque projet.",
    icon: MessageSquare,
    color: "from-indigo-500 to-violet-500",
    features: [
      { title: "Espaces partagés", description: "Créez des espaces de travail par projet ou par équipe avec accès personnalisés." },
      { title: "Commentaires contextuels", description: "Commentez directement sur les tâches, phases ou documents concernés." },
      { title: "Notifications temps réel", description: "Soyez alerté instantanément des changements qui vous concernent." },
      { title: "Gestion des rôles", description: "Définissez qui peut voir, modifier ou administrer chaque espace." },
    ],
    testimonial: {
      quote: "On travaille avec 3 bureaux différents et tout le monde a enfin accès aux mêmes infos à jour.",
      author: "Claire Durand",
      role: "Responsable BIM",
      company: "Groupe ArchiTech",
    },
  },
};

export const getModuleBySlug = (slug: string): ModuleData | undefined => {
  return MODULES_DATA[slug];
};

export const getAllModules = (): ModuleData[] => {
  return Object.values(MODULES_DATA);
};
