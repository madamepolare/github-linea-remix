import { type DisciplineSlug } from "./tenderDisciplineConfig";

// Définition des champs réels de la table tenders
export interface TenderFieldDefinition {
  key: string;
  dbColumn: string; // Colonne réelle dans la table tenders
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'textarea' | 'checkbox' | 'tags';
  section: 'general' | 'client' | 'project' | 'financial' | 'procedure' | 'dates' | 'site_visit' | 'groupement';
  placeholder?: string;
  unit?: string;
  options?: { value: string; label: string }[];
  defaultVisible?: boolean;
  defaultRequired?: boolean;
  disciplines?: DisciplineSlug[]; // Si undefined, visible pour toutes les disciplines
}

// Tous les champs possibles basés sur la table tenders réelle
export const ALL_TENDER_FIELDS: TenderFieldDefinition[] = [
  // === GÉNÉRAL ===
  { key: 'title', dbColumn: 'title', label: 'Titre', type: 'text', section: 'general', defaultVisible: true, defaultRequired: true },
  { key: 'reference', dbColumn: 'reference', label: 'Référence', type: 'text', section: 'general', defaultVisible: true, defaultRequired: true },
  { key: 'consultation_number', dbColumn: 'consultation_number', label: 'N° de consultation', type: 'text', section: 'general', defaultVisible: true },
  { key: 'description', dbColumn: 'description', label: 'Description', type: 'textarea', section: 'general', defaultVisible: true },
  { key: 'market_object', dbColumn: 'market_object', label: 'Objet du marché', type: 'textarea', section: 'general', defaultVisible: true },
  { key: 'tender_type', dbColumn: 'tender_type', label: 'Type d\'AO', type: 'select', section: 'general', defaultVisible: true },
  { key: 'status', dbColumn: 'status', label: 'Statut', type: 'select', section: 'general', defaultVisible: true },
  { key: 'pipeline_status', dbColumn: 'pipeline_status', label: 'Statut pipeline', type: 'select', section: 'general', defaultVisible: true },
  { key: 'discipline_slug', dbColumn: 'discipline_slug', label: 'Discipline', type: 'select', section: 'general', defaultVisible: true },
  { key: 'work_nature_tags', dbColumn: 'work_nature_tags', label: 'Nature des travaux', type: 'tags', section: 'general', defaultVisible: true },
  
  // === CLIENT / MOA ===
  { key: 'client_name', dbColumn: 'client_name', label: 'Nom du client', type: 'text', section: 'client', defaultVisible: true },
  { key: 'client_type', dbColumn: 'client_type', label: 'Type de client', type: 'select', section: 'client', defaultVisible: true, options: [
    { value: 'public', label: 'Public' },
    { value: 'semi_public', label: 'Semi-public' },
    { value: 'private', label: 'Privé' },
  ]},
  { key: 'client_direction', dbColumn: 'client_direction', label: 'Direction', type: 'text', section: 'client', defaultVisible: false },
  { key: 'contracting_authority', dbColumn: 'contracting_authority', label: 'Pouvoir adjudicateur', type: 'text', section: 'client', defaultVisible: true },
  { key: 'client_address', dbColumn: 'client_address', label: 'Adresse client', type: 'text', section: 'client', defaultVisible: false },
  { key: 'client_contact_name', dbColumn: 'client_contact_name', label: 'Contact client', type: 'text', section: 'client', defaultVisible: true },
  { key: 'client_contact_email', dbColumn: 'client_contact_email', label: 'Email contact', type: 'text', section: 'client', defaultVisible: true },
  { key: 'client_contact_phone', dbColumn: 'client_contact_phone', label: 'Téléphone contact', type: 'text', section: 'client', defaultVisible: false },
  
  // === PROJET ===
  { key: 'location', dbColumn: 'location', label: 'Localisation', type: 'text', section: 'project', defaultVisible: true },
  { key: 'region', dbColumn: 'region', label: 'Région', type: 'text', section: 'project', defaultVisible: true },
  { key: 'surface_area', dbColumn: 'surface_area', label: 'Surface', type: 'number', unit: 'm²', section: 'project', defaultVisible: true, disciplines: ['architecture', 'scenographie'] },
  
  // === FINANCIER ===
  { key: 'estimated_budget', dbColumn: 'estimated_budget', label: 'Budget estimé', type: 'number', unit: '€ HT', section: 'financial', defaultVisible: true },
  { key: 'budget_disclosed', dbColumn: 'budget_disclosed', label: 'Budget communiqué', type: 'checkbox', section: 'financial', defaultVisible: true },
  
  // === PROCÉDURE ===
  { key: 'procedure_type', dbColumn: 'procedure_type', label: 'Type de procédure', type: 'select', section: 'procedure', defaultVisible: true },
  { key: 'procedure_other', dbColumn: 'procedure_other', label: 'Autre procédure', type: 'text', section: 'procedure', defaultVisible: false },
  { key: 'submission_type', dbColumn: 'submission_type', label: 'Type de remise', type: 'select', section: 'procedure', defaultVisible: true, options: [
    { value: 'electronic', label: 'Électronique' },
    { value: 'paper', label: 'Papier' },
    { value: 'both', label: 'Les deux' },
  ]},
  { key: 'allows_variants', dbColumn: 'allows_variants', label: 'Variantes autorisées', type: 'checkbox', section: 'procedure', defaultVisible: true },
  { key: 'allows_negotiation', dbColumn: 'allows_negotiation', label: 'Négociation autorisée', type: 'checkbox', section: 'procedure', defaultVisible: true },
  { key: 'negotiation_method', dbColumn: 'negotiation_method', label: 'Méthode de négociation', type: 'text', section: 'procedure', defaultVisible: false },
  { key: 'negotiation_candidates_count', dbColumn: 'negotiation_candidates_count', label: 'Nb candidats négociation', type: 'number', section: 'procedure', defaultVisible: false },
  { key: 'questions_deadline_days', dbColumn: 'questions_deadline_days', label: 'Délai questions', type: 'number', unit: 'jours', section: 'procedure', defaultVisible: false },
  { key: 'offer_validity_days', dbColumn: 'offer_validity_days', label: 'Validité offre', type: 'number', unit: 'jours', section: 'procedure', defaultVisible: true },
  
  // === DATES ===
  { key: 'submission_deadline', dbColumn: 'submission_deadline', label: 'Date limite de remise', type: 'datetime', section: 'dates', defaultVisible: true, defaultRequired: true },
  { key: 'dce_delivery_deadline', dbColumn: 'dce_delivery_deadline', label: 'Date remise DCE', type: 'date', section: 'dates', defaultVisible: false },
  { key: 'dce_delivery_duration_months', dbColumn: 'dce_delivery_duration_months', label: 'Durée DCE', type: 'number', unit: 'mois', section: 'dates', defaultVisible: false },
  { key: 'jury_date', dbColumn: 'jury_date', label: 'Date du jury', type: 'datetime', section: 'dates', defaultVisible: true, disciplines: ['architecture', 'scenographie'] },
  { key: 'results_date', dbColumn: 'results_date', label: 'Date résultats', type: 'date', section: 'dates', defaultVisible: true },
  
  // === VISITE DE SITE ===
  { key: 'site_visit_required', dbColumn: 'site_visit_required', label: 'Visite obligatoire', type: 'checkbox', section: 'site_visit', defaultVisible: true },
  { key: 'site_visit_date', dbColumn: 'site_visit_date', label: 'Date de visite', type: 'datetime', section: 'site_visit', defaultVisible: true },
  { key: 'site_visit_contact_name', dbColumn: 'site_visit_contact_name', label: 'Contact visite', type: 'text', section: 'site_visit', defaultVisible: false },
  { key: 'site_visit_contact_email', dbColumn: 'site_visit_contact_email', label: 'Email visite', type: 'text', section: 'site_visit', defaultVisible: false },
  { key: 'site_visit_contact_phone', dbColumn: 'site_visit_contact_phone', label: 'Téléphone visite', type: 'text', section: 'site_visit', defaultVisible: false },
  { key: 'site_visit_notes', dbColumn: 'site_visit_notes', label: 'Notes visite', type: 'textarea', section: 'site_visit', defaultVisible: false },
  
  // === GROUPEMENT ===
  { key: 'allows_joint_venture', dbColumn: 'allows_joint_venture', label: 'Groupement autorisé', type: 'checkbox', section: 'groupement', defaultVisible: true },
  { key: 'joint_venture_type', dbColumn: 'joint_venture_type', label: 'Type de groupement', type: 'select', section: 'groupement', defaultVisible: false, options: [
    { value: 'solidaire', label: 'Solidaire' },
    { value: 'conjoint', label: 'Conjoint' },
  ]},
  { key: 'mandataire_must_be_solidary', dbColumn: 'mandataire_must_be_solidary', label: 'Mandataire solidaire obligatoire', type: 'checkbox', section: 'groupement', defaultVisible: false },
  { key: 'group_code', dbColumn: 'group_code', label: 'Code groupement', type: 'text', section: 'groupement', defaultVisible: false },
  
  // === SOURCE ===
  { key: 'source_platform', dbColumn: 'source_platform', label: 'Plateforme source', type: 'text', section: 'general', defaultVisible: false },
  { key: 'source_url', dbColumn: 'source_url', label: 'URL source', type: 'text', section: 'general', defaultVisible: false },
  { key: 'source_contact_email', dbColumn: 'source_contact_email', label: 'Email source', type: 'text', section: 'general', defaultVisible: false },
  { key: 'dce_link', dbColumn: 'dce_link', label: 'Lien DCE', type: 'text', section: 'general', defaultVisible: true },
];

// Sections pour l'affichage
export const FIELD_SECTIONS = [
  { key: 'general', label: 'Général', icon: 'FileText' },
  { key: 'client', label: 'Client / MOA', icon: 'Building2' },
  { key: 'project', label: 'Projet', icon: 'MapPin' },
  { key: 'financial', label: 'Financier', icon: 'Euro' },
  { key: 'procedure', label: 'Procédure', icon: 'FileCheck' },
  { key: 'dates', label: 'Dates', icon: 'Calendar' },
  { key: 'site_visit', label: 'Visite de site', icon: 'MapPin' },
  { key: 'groupement', label: 'Groupement', icon: 'Users' },
] as const;

export type FieldSection = typeof FIELD_SECTIONS[number]['key'];

// Helper pour obtenir les champs par section
export function getFieldsBySection(section: FieldSection): TenderFieldDefinition[] {
  return ALL_TENDER_FIELDS.filter(f => f.section === section);
}

// Helper pour obtenir les champs pour une discipline
export function getFieldsForDiscipline(discipline: DisciplineSlug): TenderFieldDefinition[] {
  return ALL_TENDER_FIELDS.filter(f => 
    !f.disciplines || f.disciplines.includes(discipline)
  );
}

// Configuration des champs visibles/requis par type d'AO
export interface TenderTypeFieldConfig {
  fieldKey: string;
  visible: boolean;
  required: boolean;
}

// Defaults par type d'AO
export const DEFAULT_TYPE_FIELD_CONFIGS: Record<string, TenderTypeFieldConfig[]> = {
  moe: [
    { fieldKey: 'title', visible: true, required: true },
    { fieldKey: 'reference', visible: true, required: true },
    { fieldKey: 'estimated_budget', visible: true, required: false },
    { fieldKey: 'surface_area', visible: true, required: false },
    { fieldKey: 'submission_deadline', visible: true, required: true },
    { fieldKey: 'jury_date', visible: false, required: false },
  ],
  concours: [
    { fieldKey: 'title', visible: true, required: true },
    { fieldKey: 'reference', visible: true, required: true },
    { fieldKey: 'estimated_budget', visible: true, required: false },
    { fieldKey: 'surface_area', visible: true, required: false },
    { fieldKey: 'submission_deadline', visible: true, required: true },
    { fieldKey: 'jury_date', visible: true, required: false },
  ],
  conception_realisation: [
    { fieldKey: 'title', visible: true, required: true },
    { fieldKey: 'reference', visible: true, required: true },
    { fieldKey: 'estimated_budget', visible: true, required: false },
    { fieldKey: 'surface_area', visible: true, required: false },
    { fieldKey: 'submission_deadline', visible: true, required: true },
  ],
};
