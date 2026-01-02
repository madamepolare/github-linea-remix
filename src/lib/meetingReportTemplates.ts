import { ReportData } from "@/hooks/useMeetingReportData";

export interface MeetingReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  data: Partial<ReportData>;
}

export const MEETING_REPORT_TEMPLATES: MeetingReportTemplate[] = [
  {
    id: "logements-neufs",
    name: "Construction logements neufs",
    description: "Template adapté aux projets de construction neuve résidentielle",
    icon: "🏗️",
    data: {
      context: "Le présent compte rendu fait suite à la réunion de chantier hebdomadaire pour le projet de construction de logements neufs. L'ordre du jour porte sur l'avancement des travaux, le respect du planning et la coordination entre les différents corps d'état.",
      general_progress: {
        status: "on_track",
        comment: "",
      },
      planning: {
        contractual_reminder: "Planning contractuel initial validé en phase de préparation de chantier.",
        delays_noted: "",
        corrective_actions: "",
        delivery_impact: false,
      },
      financial: {
        enabled: true,
        supplementary_works: "",
        pending_quotes: "",
        service_orders: "",
      },
      sqe: {
        safety_ok: true,
        sps_observations: "Respect des consignes de sécurité à rappeler pour le port des EPI. Vérification des protections collectives.",
        cleanliness_ok: true,
        nuisances_comment: "Rappel des horaires de chantier autorisés. Gestion des poussières et du bruit.",
      },
      next_meeting: {
        date: null,
        time: "09:00",
        location_type: "site",
      },
      legal_mention: "Le présent compte rendu vaut constat contradictoire des décisions prises en réunion. À défaut de remarques écrites dans un délai de {DELAY} jours, il sera réputé accepté.",
      legal_delay_days: 8,
    },
  },
  {
    id: "rehabilitation",
    name: "Réhabilitation logement",
    description: "Template pour les projets de rénovation et réhabilitation",
    icon: "🔨",
    data: {
      context: "Le présent compte rendu fait suite à la réunion de chantier pour le projet de réhabilitation. Une attention particulière est portée à la gestion des imprévus liés à l'existant et à la coordination avec les occupants le cas échéant.",
      general_progress: {
        status: "on_track",
        comment: "",
      },
      planning: {
        contractual_reminder: "Planning adapté aux contraintes de l'existant. Phases de travaux définies pour limiter les nuisances.",
        delays_noted: "",
        corrective_actions: "",
        delivery_impact: false,
      },
      financial: {
        enabled: true,
        supplementary_works: "Travaux supplémentaires potentiels liés aux découvertes en cours de chantier.",
        pending_quotes: "",
        service_orders: "",
      },
      sqe: {
        safety_ok: true,
        sps_observations: "Attention particulière aux risques liés à l'amiante/plomb (diagnostics à jour). Sécurisation des zones de travaux.",
        cleanliness_ok: true,
        nuisances_comment: "Gestion des nuisances pour les riverains/occupants. Protection des parties non concernées par les travaux.",
      },
      next_meeting: {
        date: null,
        time: "14:00",
        location_type: "site",
      },
      legal_mention: "Le présent compte rendu vaut constat contradictoire des décisions prises en réunion. À défaut de remarques écrites dans un délai de {DELAY} jours, il sera réputé accepté.",
      legal_delay_days: 7,
    },
  },
  {
    id: "locaux-commerciaux",
    name: "Locaux commerciaux",
    description: "Template pour les aménagements de locaux commerciaux et tertiaires",
    icon: "🏢",
    data: {
      context: "Le présent compte rendu concerne l'avancement des travaux d'aménagement des locaux commerciaux. Les délais de livraison sont cruciaux pour permettre l'ouverture de l'activité dans les temps impartis.",
      general_progress: {
        status: "on_track",
        comment: "",
      },
      planning: {
        contractual_reminder: "Date d'ouverture commerciale à respecter impérativement. Planning inversé à partir de cette échéance.",
        delays_noted: "",
        corrective_actions: "",
        delivery_impact: false,
      },
      financial: {
        enabled: true,
        supplementary_works: "",
        pending_quotes: "Vérifier les demandes d'options client en cours de validation.",
        service_orders: "",
      },
      sqe: {
        safety_ok: true,
        sps_observations: "Respect des normes ERP applicables. Vérification des issues de secours et de la signalétique.",
        cleanliness_ok: true,
        nuisances_comment: "Coordination avec les commerces voisins le cas échéant. Respect des horaires d'intervention.",
      },
      next_meeting: {
        date: null,
        time: "10:00",
        location_type: "site",
      },
      legal_mention: "Le présent compte rendu vaut constat contradictoire des décisions prises en réunion. À défaut de remarques écrites dans un délai de {DELAY} jours, il sera réputé accepté.",
      legal_delay_days: 5,
    },
  },
  {
    id: "scenographie",
    name: "Scénographie",
    description: "Template pour les projets scénographiques et muséographiques",
    icon: "🎭",
    data: {
      context: "Le présent compte rendu fait suite à la réunion de suivi du projet scénographique. L'attention est portée sur la qualité des finitions, l'intégration des équipements techniques (éclairage, audiovisuel) et la cohérence artistique de l'ensemble.",
      general_progress: {
        status: "on_track",
        comment: "",
      },
      planning: {
        contractual_reminder: "Planning coordonné avec les fournisseurs d'équipements spécifiques et les phases de tests/réglages.",
        delays_noted: "",
        corrective_actions: "",
        delivery_impact: false,
      },
      financial: {
        enabled: true,
        supplementary_works: "",
        pending_quotes: "Adaptations créatives et ajustements techniques en cours de validation.",
        service_orders: "",
      },
      sqe: {
        safety_ok: true,
        sps_observations: "Vérification des équipements suspendus et des installations électriques spécifiques. Conformité des matériaux (classement au feu).",
        cleanliness_ok: true,
        nuisances_comment: "Protection des œuvres et éléments fragiles. Coordination avec les équipes artistiques.",
      },
      next_meeting: {
        date: null,
        time: "10:00",
        location_type: "site",
      },
      legal_mention: "Le présent compte rendu vaut constat contradictoire des décisions prises en réunion. À défaut de remarques écrites dans un délai de {DELAY} jours, il sera réputé accepté.",
      legal_delay_days: 5,
    },
  },
];

export function getTemplateById(id: string): MeetingReportTemplate | undefined {
  return MEETING_REPORT_TEMPLATES.find(t => t.id === id);
}
