import { Building2, Palette, Theater, Megaphone, LucideIcon } from "lucide-react";

export interface SolutionChallenge {
  title: string;
  description: string;
}

export interface SolutionFeature {
  module: string;
  description: string;
}

export interface SolutionTestimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

export interface SolutionData {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  challenges: SolutionChallenge[];
  features: SolutionFeature[];
  benefits: { value: string; label: string }[];
  testimonial: SolutionTestimonial;
}

export const SOLUTIONS_DATA: Record<string, SolutionData> = {
  architectes: {
    slug: "architectes",
    title: "LINEA pour les Architectes",
    subtitle: "La plateforme pensée pour les architectes DPLG/DE/HMONP",
    description:
      "Simplifiez la gestion de vos projets d'architecture, de l'esquisse à la réception des travaux. LINEA vous accompagne dans toutes les phases de la loi MOP avec des outils adaptés à votre métier.",
    icon: Building2,
    color: "from-blue-500 to-indigo-600",
    challenges: [
      {
        title: "Gestion administrative chronophage",
        description:
          "Entre les devis, les avenants, les situations de travaux et les rapports de réunion, vous passez plus de temps sur la paperasse que sur la conception.",
      },
      {
        title: "Suivi multi-projets complexe",
        description:
          "Jongler entre plusieurs projets à différentes phases (ESQ, APS, APD, PRO, DCE, ACT, VISA, DET, AOR) devient vite un casse-tête.",
      },
      {
        title: "Réponses aux appels d'offres",
        description:
          "Préparer des candidatures et offres dans des délais serrés tout en maintenant la qualité de vos références.",
      },
      {
        title: "Coordination de chantier",
        description:
          "Suivre les interventions des entreprises, rédiger les comptes-rendus et gérer les observations demande une organisation sans faille.",
      },
    ],
    features: [
      {
        module: "Projets",
        description:
          "Gérez toutes les phases MOP de vos projets avec un planning Gantt intégré et des livrables par phase.",
      },
      {
        module: "Commercial",
        description:
          "Générez des honoraires basés sur le coût de construction, créez des contrats conformes et suivez vos paiements.",
      },
      {
        module: "Appels d'offres",
        description:
          "Analysez les DCE avec l'IA, structurez vos mémoires techniques et gérez vos références projets.",
      },
      {
        module: "Planning",
        description:
          "Planifiez les interventions des lots, créez des plannings de chantier et envoyez des convocations automatiques.",
      },
      {
        module: "CRM",
        description:
          "Centralisez vos contacts (maîtres d'ouvrage, bureaux d'études, entreprises) et suivez vos opportunités.",
      },
    ],
    benefits: [
      { value: "-40%", label: "de temps administratif" },
      { value: "2x", label: "plus d'appels d'offres traités" },
      { value: "100%", label: "des projets à jour" },
    ],
    testimonial: {
      quote:
        "LINEA a transformé notre façon de travailler. Nous avons enfin une vision claire de tous nos projets et le suivi de chantier n'a jamais été aussi simple.",
      author: "Marie Dubois",
      role: "Architecte DPLG, Directrice associée",
      company: "Studio 42 Architecture",
    },
  },
  "architectes-interieur": {
    slug: "architectes-interieur",
    title: "LINEA pour les Architectes d'intérieur",
    subtitle: "Sublimez chaque espace avec une gestion optimisée",
    description:
      "De la conception à la livraison, gérez vos projets de décoration et d'aménagement intérieur avec des outils pensés pour votre créativité et votre exigence.",
    icon: Palette,
    color: "from-pink-500 to-rose-600",
    challenges: [
      {
        title: "Suivi des commandes fournisseurs",
        description:
          "Gérer les délais de livraison du mobilier, des luminaires et des matériaux de différents fournisseurs est un défi constant.",
      },
      {
        title: "Coordination des artisans",
        description:
          "Menuisiers, ébénistes, tapissiers, électriciens... Coordonner tous ces intervenants sur un même chantier demande une organisation rigoureuse.",
      },
      {
        title: "Devis multiples par pièce",
        description:
          "Établir des devis détaillés par espace tout en gérant les options et variantes demandées par les clients.",
      },
      {
        title: "Clients exigeants",
        description:
          "Vos clients attendent un suivi personnalisé et une communication régulière sur l'avancement de leur projet.",
      },
    ],
    features: [
      {
        module: "CRM",
        description:
          "Gérez votre carnet d'adresses de fournisseurs, artisans et clients avec un historique complet des échanges.",
      },
      {
        module: "Commercial",
        description:
          "Créez des devis par pièce ou par prestation, gérez les options et générez des factures professionnelles.",
      },
      {
        module: "Projets",
        description:
          "Suivez chaque projet avec un planning visuel, des photos avant/après et un suivi des livrables.",
      },
      {
        module: "Planning",
        description:
          "Coordonnez les interventions des artisans avec un planning partagé et des notifications automatiques.",
      },
      {
        module: "Collaboration",
        description:
          "Partagez des moodboards, plans et photos avec vos clients pour validation en temps réel.",
      },
    ],
    benefits: [
      { value: "-50%", label: "de temps en suivi fournisseurs" },
      { value: "3x", label: "plus de projets gérés simultanément" },
      { value: "98%", label: "de clients satisfaits" },
    ],
    testimonial: {
      quote:
        "Grâce à LINEA, je peux enfin me concentrer sur la créativité plutôt que sur l'administratif. Mes clients adorent le suivi en temps réel de leur projet.",
      author: "Sophie Leroux",
      role: "Architecte d'intérieur, Fondatrice",
      company: "Archi+ Design Studio",
    },
  },
  scenographes: {
    slug: "scenographes",
    title: "LINEA pour les Scénographes",
    subtitle: "Du concept à l'installation, maîtrisez chaque projet",
    description:
      "Que ce soit pour des expositions, des événements ou des espaces commerciaux, gérez vos projets scénographiques avec des outils adaptés aux contraintes du secteur.",
    icon: Theater,
    color: "from-purple-500 to-violet-600",
    challenges: [
      {
        title: "Délais événementiels courts",
        description:
          "Les vernissages, inaugurations et événements imposent des deadlines serrées et non négociables.",
      },
      {
        title: "Équipes temporaires",
        description:
          "Constituer et coordonner des équipes projet par projet avec des freelances et prestataires variés.",
      },
      {
        title: "Multi-sites simultanés",
        description:
          "Gérer plusieurs installations en parallèle dans différents lieux géographiques.",
      },
      {
        title: "Montage et démontage planifiés",
        description:
          "Respecter les créneaux d'accès aux lieux et coordonner les phases de montage avec précision.",
      },
    ],
    features: [
      {
        module: "Projets",
        description:
          "Créez des fiches projet complètes avec brief, planning de production et suivi des étapes clés.",
      },
      {
        module: "Planning",
        description:
          "Planifiez le montage, l'exploitation et le démontage avec des créneaux horaires précis par équipe.",
      },
      {
        module: "Collaboration",
        description:
          "Partagez les plans techniques, les fiches de montage et les consignes de sécurité avec vos équipes.",
      },
      {
        module: "CRM",
        description:
          "Gérez vos relations avec les musées, galeries, agences événementielles et fournisseurs techniques.",
      },
      {
        module: "Commercial",
        description:
          "Établissez des devis détaillés par poste (conception, fabrication, installation) et suivez la facturation.",
      },
    ],
    benefits: [
      { value: "-60%", label: "de retards sur les montages" },
      { value: "5x", label: "meilleure coordination d'équipe" },
      { value: "100%", label: "des deadlines respectées" },
    ],
    testimonial: {
      quote:
        "Dans notre métier, le timing est crucial. LINEA nous permet de coordonner nos équipes sur plusieurs sites simultanément sans perdre une minute.",
      author: "Jean-Pierre Blanc",
      role: "Directeur de production",
      company: "Cabinet BPM Scénographie",
    },
  },
  "agences-communication": {
    slug: "agences-communication",
    title: "LINEA pour les Agences de Communication",
    subtitle: "Orchestrez vos campagnes avec précision",
    description:
      "Gérez vos projets de communication, du brief à la diffusion, avec des outils pensés pour les agences créatives : suivi de campagnes, planning média, production et reporting.",
    icon: Megaphone,
    color: "from-orange-500 to-amber-600",
    challenges: [
      {
        title: "Gestion multi-clients",
        description:
          "Jongler entre plusieurs clients avec des identités, des deadlines et des exigences différentes demande une organisation sans faille.",
      },
      {
        title: "Deadlines créatives serrées",
        description:
          "Les campagnes ont des dates de sortie non négociables. Coordonner création, production et validation dans les temps est crucial.",
      },
      {
        title: "Suivi de production complexe",
        description:
          "Shooting photo, montage vidéo, création graphique, rédaction... Suivre tous les livrables et leurs validations est un défi quotidien.",
      },
      {
        title: "Reporting client",
        description:
          "Vos clients attendent des bilans de campagne détaillés avec KPIs et analyses de performance.",
      },
    ],
    features: [
      {
        module: "Campagnes",
        description:
          "Créez des fiches campagne complètes avec brief, objectifs, KPIs cibles et timeline de diffusion.",
      },
      {
        module: "Planning Média",
        description:
          "Planifiez vos sorties par canal (réseaux sociaux, presse, TV, affichage) avec des rappels automatiques.",
      },
      {
        module: "Projets",
        description:
          "Suivez chaque projet client avec des phases adaptées : brief, stratégie, création, production, diffusion, bilan.",
      },
      {
        module: "Time Tracking",
        description:
          "Mesurez le temps passé par projet et par client pour optimiser votre rentabilité.",
      },
      {
        module: "CRM",
        description:
          "Centralisez vos contacts clients, médias et partenaires avec un historique complet des échanges.",
      },
    ],
    benefits: [
      { value: "-30%", label: "de temps en coordination" },
      { value: "4x", label: "plus de campagnes simultanées" },
      { value: "100%", label: "des deadlines respectées" },
    ],
    testimonial: {
      quote:
        "LINEA a révolutionné notre workflow. Le planning média intégré nous permet de visualiser toutes nos sorties et de ne jamais rater une deadline.",
      author: "Camille Martin",
      role: "Directrice de production",
      company: "Agence Créative 360",
    },
  },
};

export const getSolutionBySlug = (slug: string): SolutionData | undefined => {
  return SOLUTIONS_DATA[slug];
};

export const getAllSolutions = (): SolutionData[] => {
  return Object.values(SOLUTIONS_DATA);
};
