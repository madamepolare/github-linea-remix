import { FolderKanban, Users, FileText, Trophy, Calendar, MessageSquare, Megaphone } from "lucide-react";

export interface ModuleFeature {
  title: string;
  description: string;
}

export interface ModuleFAQ {
  question: string;
  answer: string;
}

export interface ModuleUseCase {
  title: string;
  description: string;
  icon: string;
}

export interface ModuleBenefit {
  title: string;
  value: string;
  description: string;
}

export interface ModuleIntegration {
  module: string;
  description: string;
}

export interface ModuleData {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  icon: typeof FolderKanban;
  color: string;
  features: ModuleFeature[];
  useCases: ModuleUseCase[];
  benefits: ModuleBenefit[];
  integrations: ModuleIntegration[];
  faq: ModuleFAQ[];
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
    longDescription: `La gestion de projets est au cœur de l'activité de toute agence d'architecture. Linea Suite vous offre une solution complète pour piloter chaque projet depuis les premières esquisses jusqu'à la réception des travaux.

Grâce à notre diagramme de Gantt interactif, visualisez en un coup d'œil l'avancement de toutes vos phases : ESQ, APS, APD, PRO, DCE, ACT, VISA, DET, AOR. Chaque phase peut être associée à des livrables spécifiques, des dépendances avec d'autres phases, et des alertes automatiques à l'approche des échéances.

Notre système intelligent recalcule automatiquement les dates en cascade lorsque vous modifiez une phase, vous permettant d'anticiper les impacts sur le planning global. Exportez des plannings professionnels en PDF pour vos clients et partenaires en un seul clic.`,
    icon: FolderKanban,
    color: "from-blue-500 to-cyan-500",
    features: [
      { title: "Timeline interactive", description: "Visualisez et modifiez vos phases directement sur un diagramme de Gantt interactif avec drag & drop." },
      { title: "Gestion des livrables", description: "Associez des livrables à chaque phase et suivez leur avancement en temps réel." },
      { title: "Dépendances intelligentes", description: "Définissez les dépendances entre phases et laissez le système recalculer automatiquement les dates." },
      { title: "Export PDF automatique", description: "Générez des plannings professionnels en un clic pour vos clients et partenaires." },
    ],
    useCases: [
      { title: "Suivi multi-projets", description: "Gérez simultanément plusieurs projets avec des tableaux de bord personnalisés par client ou par type de mission.", icon: "layers" },
      { title: "Reporting client", description: "Générez des rapports d'avancement automatiques pour tenir vos clients informés sans effort supplémentaire.", icon: "file-text" },
      { title: "Planification des ressources", description: "Visualisez la charge de travail de votre équipe et anticipez les pics d'activité.", icon: "users" },
      { title: "Archivage structuré", description: "Conservez un historique complet de chaque projet avec tous les documents et versions.", icon: "archive" },
    ],
    benefits: [
      { title: "Gain de temps", value: "40%", description: "de temps gagné sur la gestion administrative des projets" },
      { title: "Respect des délais", value: "95%", description: "de projets livrés dans les temps grâce aux alertes automatiques" },
      { title: "Visibilité", value: "360°", description: "sur l'ensemble de vos projets en un seul tableau de bord" },
    ],
    integrations: [
      { module: "CRM", description: "Créez automatiquement un projet depuis une opportunité gagnée" },
      { module: "Commercial", description: "Associez devis et contrats à chaque projet" },
      { module: "Planning", description: "Synchronisez les phases de conception avec le planning chantier" },
      { module: "Collaboration", description: "Partagez l'avancement en temps réel avec votre équipe" },
    ],
    faq: [
      { question: "Puis-je personnaliser les phases de mes projets ?", answer: "Oui, vous pouvez créer vos propres modèles de phases adaptés à vos types de missions (neuf, rénovation, etc.) et les réutiliser sur tous vos projets." },
      { question: "Comment fonctionne l'export du planning ?", answer: "L'export génère un PDF professionnel avec votre logo, les phases colorées selon leur statut, et peut être configuré en format A4, A3 ou A1 pour affichage." },
      { question: "Les dépendances sont-elles gérées automatiquement ?", answer: "Oui, lorsqu'une phase dépendante est décalée, toutes les phases suivantes sont automatiquement recalculées avec possibilité de validation avant application." },
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
    longDescription: `Le CRM de Linea Suite a été conçu spécifiquement pour les agences d'architecture. Contrairement aux CRM généralistes, il comprend les spécificités de votre métier : cycles de vente longs, multiples interlocuteurs par projet, et suivi des prescripteurs.

Visualisez votre pipeline commercial avec un tableau Kanban intuitif où chaque opportunité passe par vos étapes personnalisées : premier contact, visite de site, proposition envoyée, négociation, gagné/perdu. Chaque fiche contact centralise l'historique complet des échanges, les projets associés et les documents partagés.

Programmez des relances automatiques pour ne jamais oublier un prospect, et analysez votre taux de conversion par source d'acquisition pour optimiser vos efforts commerciaux.`,
    icon: Users,
    color: "from-purple-500 to-pink-500",
    features: [
      { title: "Pipeline visuel", description: "Déplacez vos opportunités entre les étapes du pipeline par simple drag & drop." },
      { title: "Historique complet", description: "Retrouvez tous les échanges, appels et rendez-vous avec chaque contact en un coup d'œil." },
      { title: "Relances automatiques", description: "Programmez des rappels et ne manquez plus jamais une opportunité de suivi." },
      { title: "Import/Export facile", description: "Importez vos contacts existants et exportez vos données à tout moment." },
    ],
    useCases: [
      { title: "Suivi des prescripteurs", description: "Maintenez des relations privilégiées avec les architectes d'intérieur, promoteurs et entreprises qui vous recommandent.", icon: "star" },
      { title: "Gestion multi-contacts", description: "Associez plusieurs interlocuteurs à une même opportunité : maître d'ouvrage, AMO, notaire, etc.", icon: "users" },
      { title: "Analyse commerciale", description: "Mesurez votre taux de conversion par source, type de projet ou commercial pour optimiser vos efforts.", icon: "bar-chart" },
      { title: "Fidélisation client", description: "Gardez le contact avec vos anciens clients pour des missions de suivi ou de recommandation.", icon: "heart" },
    ],
    benefits: [
      { title: "Conversion", value: "+35%", description: "d'amélioration du taux de conversion prospect → client" },
      { title: "Suivi", value: "100%", description: "des opportunités suivies sans passer entre les mailles" },
      { title: "Réactivité", value: "2x", description: "plus rapide dans le traitement des demandes entrantes" },
    ],
    integrations: [
      { module: "Projets", description: "Transformez une opportunité gagnée en projet en un clic" },
      { module: "Commercial", description: "Générez un devis directement depuis une opportunité" },
      { module: "Collaboration", description: "Partagez les fiches clients avec votre équipe" },
      { module: "Planning", description: "Planifiez les rendez-vous directement depuis le CRM" },
    ],
    faq: [
      { question: "Puis-je personnaliser les étapes de mon pipeline ?", answer: "Oui, vous pouvez créer autant d'étapes que nécessaire avec des noms et couleurs personnalisés. Vous pouvez même avoir plusieurs pipelines pour différents types de missions." },
      { question: "Comment importer mes contacts existants ?", answer: "Importez vos contacts depuis un fichier Excel/CSV ou synchronisez-les avec Google Contacts. Un assistant vous guide pour mapper les champs correctement." },
      { question: "Les relances sont-elles automatisées ?", answer: "Vous définissez les règles (ex: relancer après 7 jours sans réponse) et le système vous alerte ou envoie un email automatique selon votre configuration." },
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
    longDescription: `Le module Commercial de Linea Suite révolutionne la façon dont les architectes créent et gèrent leurs propositions d'honoraires. Fini les fichiers Word mal formatés et les calculs sur tableur : tout est intégré dans une interface intuitive.

Configurez vos barèmes d'honoraires par type de mission (neuf, rénovation, permis de construire...) et laissez le système calculer automatiquement vos honoraires en fonction du montant des travaux. Chaque phase de la loi MOP peut être configurée avec son pourcentage et ses livrables associés.

Générez des propositions commerciales professionnelles avec votre charte graphique, suivez les différentes versions envoyées au client, et transformez le devis accepté en contrat en un clic. Le suivi des paiements vous permet de visualiser les factures émises et les règlements reçus.`,
    icon: FileText,
    color: "from-emerald-500 to-teal-500",
    features: [
      { title: "Générateur intelligent", description: "Créez des propositions personnalisées avec calcul automatique des honoraires selon vos barèmes." },
      { title: "Modèles personnalisables", description: "Définissez vos propres templates avec votre charte graphique et vos conditions." },
      { title: "Suivi des versions", description: "Gardez un historique complet de chaque version envoyée au client." },
      { title: "Signature électronique", description: "Faites signer vos contrats directement en ligne pour accélérer la validation." },
    ],
    useCases: [
      { title: "Proposition multi-phases", description: "Créez des devis détaillés phase par phase avec calcul automatique basé sur le montant des travaux.", icon: "calculator" },
      { title: "Variantes et options", description: "Proposez des options additionnelles que le client peut accepter ou refuser indépendamment.", icon: "toggle-right" },
      { title: "Suivi des paiements", description: "Visualisez les factures émises, les règlements reçus et les relances à effectuer.", icon: "credit-card" },
      { title: "Contrats types", description: "Utilisez des modèles de contrat conformes aux recommandations ordinales.", icon: "file-check" },
    ],
    benefits: [
      { title: "Rapidité", value: "3x", description: "plus rapide pour créer une proposition commerciale complète" },
      { title: "Professionnalisme", value: "100%", description: "de documents aux couleurs de votre agence" },
      { title: "Suivi", value: "0", description: "facture oubliée grâce au suivi automatisé des paiements" },
    ],
    integrations: [
      { module: "CRM", description: "Générez un devis depuis une opportunité commerciale" },
      { module: "Projets", description: "Associez automatiquement le devis signé au projet" },
      { module: "Planning", description: "Récupérez les dates de phase pour le planning projet" },
      { module: "Collaboration", description: "Faites valider les devis par vos associés avant envoi" },
    ],
    faq: [
      { question: "Comment sont calculés les honoraires ?", answer: "Vous définissez vos barèmes par type de mission et montant de travaux. Le système applique automatiquement le pourcentage correspondant et le répartit entre les phases selon votre configuration." },
      { question: "Puis-je personnaliser l'apparence des documents ?", answer: "Oui, uploadez votre logo, choisissez vos couleurs et polices, et personnalisez l'en-tête et le pied de page. Tous vos documents auront automatiquement votre identité visuelle." },
      { question: "La signature électronique est-elle légalement valide ?", answer: "Oui, nous utilisons une solution de signature électronique conforme au règlement eIDAS, garantissant la valeur juridique de vos contrats signés." },
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
    longDescription: `Répondre aux appels d'offres publics et privés est chronophage et complexe. Le module Appels d'offres de Linea Suite utilise l'intelligence artificielle pour vous faire gagner un temps précieux sur les tâches administratives.

Importez votre DCE et notre IA analyse automatiquement le règlement de consultation pour extraire les critères de sélection, les pièces à fournir, les délais et les points d'attention. Plus besoin de lire des dizaines de pages pour identifier les informations clés.

Le mémoire technique assisté par IA vous propose une structure de réponse basée sur les attentes identifiées dans le dossier. Vous gardez le contrôle sur le contenu technique, mais gagnez un temps précieux sur la mise en forme et la structuration de votre réponse.`,
    icon: Trophy,
    color: "from-amber-500 to-orange-500",
    features: [
      { title: "Analyse IA des DCE", description: "Notre IA extrait automatiquement les critères clés et les pièces à fournir." },
      { title: "Mémoire technique assisté", description: "Générez une structure de réponse basée sur l'analyse du dossier." },
      { title: "Suivi des deadlines", description: "Ne manquez plus jamais une date limite avec les rappels automatiques." },
      { title: "Collaboration équipe", description: "Travaillez à plusieurs sur la même réponse avec un suivi des contributions." },
    ],
    useCases: [
      { title: "Analyse rapide GO/NO-GO", description: "Évaluez rapidement si un appel d'offres correspond à votre profil et vos capacités.", icon: "check-circle" },
      { title: "Capitalisation", description: "Réutilisez les contenus de vos mémoires précédents pour gagner du temps sur les parties récurrentes.", icon: "database" },
      { title: "Coordination équipe", description: "Attribuez les différentes parties du dossier aux membres de l'équipe et suivez l'avancement.", icon: "users" },
      { title: "Veille marchés publics", description: "Recevez des alertes sur les appels d'offres correspondant à vos critères.", icon: "bell" },
    ],
    benefits: [
      { title: "Temps d'analyse", value: "-80%", description: "de temps passé à analyser les documents du DCE" },
      { title: "Taux de réponse", value: "+50%", description: "d'appels d'offres supplémentaires traités" },
      { title: "Structuration", value: "100%", description: "des réponses structurées selon les attentes du client" },
    ],
    integrations: [
      { module: "CRM", description: "Créez automatiquement une opportunité depuis un appel d'offres" },
      { module: "Projets", description: "Transformez un appel d'offres gagné en projet" },
      { module: "Commercial", description: "Générez le contrat à partir des éléments de l'offre" },
      { module: "Collaboration", description: "Coordonnez la rédaction avec vos partenaires" },
    ],
    faq: [
      { question: "Quels formats de DCE sont supportés ?", answer: "L'IA analyse les fichiers PDF, Word et Excel. Les plans en format DWG ou PDF sont également pris en charge pour l'extraction des surfaces et quantités." },
      { question: "L'IA rédige-t-elle le mémoire à ma place ?", answer: "L'IA vous propose une structure et peut suggérer des formulations basées sur vos réponses précédentes, mais vous gardez le contrôle total sur le contenu technique et la rédaction finale." },
      { question: "Puis-je travailler avec mes partenaires (BET, économiste) ?", answer: "Oui, invitez vos partenaires à collaborer sur la réponse. Chacun peut travailler sur sa partie avec un suivi des modifications et des versions." },
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
    longDescription: `La coordination de chantier est une mission à part entière qui demande rigueur et organisation. Le module Planning de Linea Suite vous offre tous les outils pour piloter efficacement cette phase cruciale.

Créez votre planning multi-lots avec une vue claire de toutes les interventions : gros œuvre, charpente, couverture, menuiseries, plomberie, électricité... Chaque lot est associé à une entreprise et visualisé avec un code couleur distinct sur le planning.

Envoyez les convocations aux réunions de chantier en un clic avec ordre du jour et planning joint. Après chaque réunion, générez un compte-rendu structuré avec les points d'attention, les observations par lot et les photos prises sur site. Le suivi des actions permet de ne rien laisser passer.`,
    icon: Calendar,
    color: "from-rose-500 to-red-500",
    features: [
      { title: "Planning multi-lots", description: "Visualisez toutes les entreprises sur un même planning avec codes couleur." },
      { title: "Convocations automatiques", description: "Envoyez les convocations par email en un clic avec pièces jointes." },
      { title: "Comptes-rendus structurés", description: "Générez des CR de chantier avec points d'attention et photos." },
      { title: "Export grand format", description: "Exportez vos plannings en A1 ou A3 pour affichage sur chantier." },
    ],
    useCases: [
      { title: "Suivi d'avancement", description: "Visualisez le pourcentage d'avancement de chaque lot par rapport au planning prévisionnel.", icon: "trending-up" },
      { title: "Gestion des retards", description: "Identifiez immédiatement les lots en retard et leur impact sur les lots suivants.", icon: "alert-triangle" },
      { title: "Photos chantier", description: "Associez des photos à chaque point du compte-rendu pour un suivi visuel précis.", icon: "camera" },
      { title: "Historique complet", description: "Retrouvez tous les CR précédents et l'évolution des points d'attention.", icon: "history" },
    ],
    benefits: [
      { title: "Temps de rédaction", value: "-60%", description: "de temps passé à rédiger les comptes-rendus de chantier" },
      { title: "Communication", value: "100%", description: "des entreprises informées automatiquement" },
      { title: "Traçabilité", value: "∞", description: "historique complet conservé pour chaque projet" },
    ],
    integrations: [
      { module: "Projets", description: "Synchronisez la phase chantier avec le planning global" },
      { module: "CRM", description: "Accédez aux coordonnées des entreprises depuis le CRM" },
      { module: "Collaboration", description: "Partagez les CR avec le maître d'ouvrage" },
      { module: "Commercial", description: "Suivez les situations de travaux et DGD" },
    ],
    faq: [
      { question: "Puis-je importer un planning existant ?", answer: "Oui, importez votre planning depuis Excel ou Microsoft Project. Les lots et dates sont automatiquement récupérés et vous pouvez les ajuster dans l'interface." },
      { question: "Les entreprises reçoivent-elles un accès ?", answer: "Les entreprises reçoivent les convocations et CR par email. Elles n'ont pas besoin de créer de compte, mais peuvent consulter les documents via un lien sécurisé." },
      { question: "Puis-je prendre des photos sur mobile ?", answer: "Oui, l'application mobile vous permet de prendre des photos sur chantier et de les associer directement aux observations. Elles sont automatiquement synchronisées." },
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
    longDescription: `L'architecture est un métier collaboratif. Que vous travailliez avec des associés, des collaborateurs, des stagiaires ou des partenaires externes, la coordination est essentielle. Le module Collaboration de Linea Suite centralise tous vos échanges.

Créez des espaces de travail par projet ou par équipe avec des droits d'accès granulaires : qui peut voir, modifier ou administrer chaque espace. Les commentaires contextuels vous permettent de discuter directement sur une phase, une tâche ou un document plutôt que de perdre l'information dans des emails.

Les notifications en temps réel vous alertent des changements qui vous concernent : nouvelle tâche assignée, commentaire sur un document, modification de planning... Personnalisez vos préférences pour ne recevoir que les alertes importantes et rester concentré sur votre travail.`,
    icon: MessageSquare,
    color: "from-indigo-500 to-violet-500",
    features: [
      { title: "Espaces partagés", description: "Créez des espaces de travail par projet ou par équipe avec accès personnalisés." },
      { title: "Commentaires contextuels", description: "Commentez directement sur les tâches, phases ou documents concernés." },
      { title: "Notifications temps réel", description: "Soyez alerté instantanément des changements qui vous concernent." },
      { title: "Gestion des rôles", description: "Définissez qui peut voir, modifier ou administrer chaque espace." },
    ],
    useCases: [
      { title: "Équipe multi-sites", description: "Travaillez avec des collaborateurs répartis sur plusieurs bureaux sans perdre en coordination.", icon: "globe" },
      { title: "Partenaires externes", description: "Invitez BET, économistes ou paysagistes à collaborer sur des projets spécifiques.", icon: "user-plus" },
      { title: "Suivi d'équipe", description: "Visualisez la charge de travail et les tâches de chaque membre de l'équipe.", icon: "activity" },
      { title: "Validation hiérarchique", description: "Mettez en place des workflows de validation pour les documents importants.", icon: "check-square" },
    ],
    benefits: [
      { title: "Emails internes", value: "-90%", description: "de réduction des emails entre collaborateurs" },
      { title: "Réactivité", value: "5x", description: "plus rapide pour trouver une information projet" },
      { title: "Transparence", value: "100%", description: "de visibilité sur l'avancement de chaque projet" },
    ],
    integrations: [
      { module: "Projets", description: "Commentez directement sur les phases et livrables" },
      { module: "CRM", description: "Partagez les informations clients avec l'équipe" },
      { module: "Commercial", description: "Faites valider les devis avant envoi" },
      { module: "Planning", description: "Coordonnez-vous sur les observations chantier" },
    ],
    faq: [
      { question: "Combien d'utilisateurs puis-je inviter ?", answer: "Le nombre d'utilisateurs dépend de votre forfait. Le plan Pro permet un nombre illimité d'utilisateurs. Vous pouvez aussi inviter des partenaires externes en accès limité." },
      { question: "Comment fonctionnent les notifications ?", answer: "Vous pouvez personnaliser vos préférences : notifications push, email récapitulatif quotidien ou hebdomadaire, ou désactivation par type d'événement." },
      { question: "Puis-je créer des groupes d'utilisateurs ?", answer: "Oui, créez des groupes (ex: 'Équipe Lyon', 'Partenaires BIM') pour faciliter les attributions de droits et les mentions dans les commentaires." },
    ],
    testimonial: {
      quote: "On travaille avec 3 bureaux différents et tout le monde a enfin accès aux mêmes infos à jour.",
      author: "Claire Durand",
      role: "Responsable BIM",
      company: "Groupe ArchiTech",
    },
  },
  campagnes: {
    slug: "campagnes",
    title: "Campagnes",
    subtitle: "Gérez vos campagnes de communication",
    description: "Pilotez vos campagnes de A à Z : brief, objectifs, planning média, budget et KPIs. Un hub central pour coordonner toutes vos actions de communication.",
    longDescription: `Le module Campagnes de LINEA est conçu spécifiquement pour les agences de communication. Il vous permet de gérer l'ensemble de vos campagnes clients avec une vision à 360°.

Chaque campagne dispose de son espace dédié regroupant le brief client, les objectifs, le planning des sorties, le budget alloué et le suivi des KPIs. Visualisez en un coup d'œil le statut de chaque campagne : en planification, en production, live ou terminée.

Gérez les livrables associés à chaque campagne (visuels, vidéos, contenus) avec un workflow de validation intégré. Suivez les performances en temps réel et générez des rapports automatiques pour vos clients.`,
    icon: Megaphone,
    color: "from-emerald-500 to-teal-500",
    features: [
      { title: "Brief centralisé", description: "Stockez le brief client, les objectifs et les cibles dans un espace structuré." },
      { title: "Planning média intégré", description: "Planifiez les sorties sur tous les canaux avec une vue calendrier unifiée." },
      { title: "Suivi budget", description: "Suivez le budget alloué vs dépensé par canal et par campagne." },
      { title: "Reporting automatique", description: "Générez des rapports de performance pour vos clients en un clic." },
    ],
    useCases: [
      { title: "Campagne multi-canal", description: "Coordonnez les sorties TV, radio, print, digital et réseaux sociaux sur une même timeline.", icon: "layers" },
      { title: "Validation créative", description: "Gérez le workflow de validation des visuels entre l'agence et le client.", icon: "check-circle" },
      { title: "Suivi ROI", description: "Mesurez les performances de chaque canal pour optimiser les prochaines campagnes.", icon: "trending-up" },
      { title: "Gestion multi-clients", description: "Pilotez simultanément plusieurs campagnes pour différents clients.", icon: "briefcase" },
    ],
    benefits: [
      { title: "Visibilité", value: "100%", description: "sur l'ensemble de vos campagnes actives" },
      { title: "Coordination", value: "3x", description: "plus efficace entre les équipes créa et média" },
      { title: "Reporting", value: "-75%", description: "de temps passé à préparer les bilans clients" },
    ],
    integrations: [
      { module: "CRM", description: "Liez les campagnes à vos clients et opportunités" },
      { module: "Planning Média", description: "Synchronisez avec le planning des publications" },
      { module: "Commercial", description: "Suivez la facturation liée à chaque campagne" },
      { module: "Équipe", description: "Attribuez les tâches aux membres de l'équipe" },
    ],
    faq: [
      { question: "Puis-je gérer des campagnes multi-clients ?", answer: "Oui, chaque campagne est liée à un client et vous pouvez filtrer la vue par client pour gérer facilement plusieurs comptes simultanément." },
      { question: "Comment fonctionne le suivi des KPIs ?", answer: "Définissez vos KPIs cibles lors de la création de la campagne et mettez à jour les résultats réels. Le système calcule automatiquement les écarts et les taux de réalisation." },
      { question: "Les rapports sont-ils personnalisables ?", answer: "Oui, vous pouvez configurer les sections à inclure, ajouter votre charte graphique et choisir le format d'export (PDF, PowerPoint)." },
    ],
    testimonial: {
      quote: "La gestion centralisée de nos campagnes a transformé notre organisation. On gagne un temps précieux sur la coordination.",
      author: "Julie Martin",
      role: "Directrice de clientèle",
      company: "Agence Média+",
    },
  },
  "planning-media": {
    slug: "planning-media",
    title: "Planning Média",
    subtitle: "Orchestrez vos sorties sur tous les canaux",
    description: "Planifiez et suivez toutes vos publications et insertions média. Vue calendrier, rappels automatiques et suivi de production pour ne jamais manquer une deadline.",
    longDescription: `Le Planning Média de LINEA centralise toutes vos publications sur une timeline unique. Réseaux sociaux, presse, TV, radio, affichage : visualisez l'ensemble de vos sorties prévues et passées.

Chaque élément du planning est associé à une campagne et contient toutes les informations nécessaires : canal, format, date de publication, brief créatif et statut de production. Suivez l'avancement de chaque contenu de la création à la publication.

Les rappels automatiques vous alertent des deadlines approchantes et le workflow de validation assure que chaque contenu est approuvé avant publication. Exportez votre planning pour le partager avec vos clients ou partenaires médias.`,
    icon: Calendar,
    color: "from-blue-500 to-indigo-500",
    features: [
      { title: "Vue calendrier", description: "Visualisez toutes vos sorties sur une timeline mensuelle ou hebdomadaire." },
      { title: "Multi-canaux", description: "Gérez tous les canaux sur un seul planning : social, presse, TV, radio, digital." },
      { title: "Rappels automatiques", description: "Recevez des alertes pour les deadlines de livraison et de publication." },
      { title: "Export partageable", description: "Exportez le planning pour vos clients et partenaires médias." },
    ],
    useCases: [
      { title: "Social media planning", description: "Planifiez vos posts Instagram, LinkedIn, Facebook et TikTok avec prévisualisation.", icon: "instagram" },
      { title: "Plan média presse", description: "Gérez vos insertions presse avec dates de remise et parutions.", icon: "newspaper" },
      { title: "Coordination multi-équipes", description: "Synchronisez création, production et achat média sur la même timeline.", icon: "users" },
      { title: "Reporting client", description: "Partagez le planning avec vos clients pour validation et suivi.", icon: "share" },
    ],
    benefits: [
      { title: "Organisation", value: "100%", description: "des sorties planifiées et suivies" },
      { title: "Deadlines", value: "0", description: "deadline manquée grâce aux rappels" },
      { title: "Efficacité", value: "2x", description: "plus rapide pour coordonner les sorties" },
    ],
    integrations: [
      { module: "Campagnes", description: "Chaque publication est liée à sa campagne" },
      { module: "CRM", description: "Accédez aux contacts médias et clients" },
      { module: "Équipe", description: "Attribuez la production à vos créatifs" },
      { module: "Commercial", description: "Suivez les coûts médias par placement" },
    ],
    faq: [
      { question: "Puis-je intégrer mon calendrier Google ?", answer: "Oui, synchronisez votre planning LINEA avec Google Calendar ou Outlook pour retrouver vos deadlines dans votre agenda habituel." },
      { question: "Comment gérer les formats différents par canal ?", answer: "Chaque canal a ses propres formats prédéfinis. Sélectionnez le format adapté et le système vous rappelle les spécifications techniques." },
      { question: "Les publications sont-elles automatiques ?", answer: "Le module est un outil de planning et non de publication automatique. Vous pouvez cependant exporter vers des outils de scheduling comme Buffer ou Hootsuite." },
    ],
    testimonial: {
      quote: "Finies les feuilles Excel pour gérer nos sorties. Tout est clair et l'équipe ne rate plus aucune deadline.",
      author: "Marc Lefebvre",
      role: "Responsable Social Media",
      company: "Digital Factory",
    },
  },
};

export const getModuleBySlug = (slug: string): ModuleData | undefined => {
  return MODULES_DATA[slug];
};

export const getAllModules = (): ModuleData[] => {
  return Object.values(MODULES_DATA);
};
