// ============================================================
// Fichier centralisé pour toutes les valeurs par défaut CRM
// Ces valeurs sont utilisées quand aucun réglage n'est configuré
// ============================================================

// --- Types de contacts (classification métier, pas le statut lead/confirmé) ---
export const DEFAULT_CONTACT_TYPES = [
  { key: "client", label: "Client", color: "#3B82F6", icon: "Building2" },
  { key: "prospect", label: "Prospect", color: "#F59E0B", icon: "Target" },
  { key: "partenaire", label: "Partenaire", color: "#10B981", icon: "Handshake" },
  { key: "fournisseur", label: "Fournisseur", color: "#8B5CF6", icon: "Truck" },
  { key: "particulier", label: "Particulier", color: "#EC4899", icon: "User" },
];

// --- Spécialités (génériques - à personnaliser via IA selon la discipline) ---
export const DEFAULT_BET_SPECIALTIES: { key: string; label: string; color: string }[] = [];

// --- Sources de leads ---
export const DEFAULT_LEAD_SOURCES = [
  { key: "referral", label: "Recommandation", color: "#10B981" },
  { key: "website", label: "Site web", color: "#3B82F6" },
  { key: "linkedin", label: "LinkedIn", color: "#0077B5" },
  { key: "cold_call", label: "Prospection téléphonique", color: "#F59E0B" },
  { key: "event", label: "Événement / Salon", color: "#8B5CF6" },
  { key: "tender", label: "Appel d'offres", color: "#EC4899" },
  { key: "partner", label: "Partenaire", color: "#06B6D4" },
  { key: "press", label: "Presse / Publication", color: "#84CC16" },
  { key: "other", label: "Autre", color: "#6B7280" },
];

// --- Types d'activités ---
export const DEFAULT_ACTIVITY_TYPES = [
  { key: "call", label: "Appel", color: "#10B981" },
  { key: "email", label: "Email", color: "#3B82F6" },
  { key: "meeting", label: "Réunion", color: "#8B5CF6" },
  { key: "note", label: "Note", color: "#EAB308" },
  { key: "task", label: "Tâche", color: "#F97316" },
  { key: "proposal", label: "Proposition", color: "#EC4899" },
  { key: "site_visit", label: "Visite site", color: "#14B8A6" },
  { key: "document", label: "Document", color: "#64748B" },
];

// --- Rôles/fonctions des contacts ---
export const CONTACT_ROLES = [
  { value: "directeur_general", label: "Directeur Général" },
  { value: "directeur_technique", label: "Directeur Technique" },
  { value: "directeur_commercial", label: "Directeur Commercial" },
  { value: "chef_projet", label: "Chef de Projet" },
  { value: "charge_affaires", label: "Chargé d'Affaires" },
  { value: "responsable_travaux", label: "Responsable Travaux" },
  { value: "conducteur_travaux", label: "Conducteur de Travaux" },
  { value: "ingenieur", label: "Ingénieur" },
  { value: "architecte", label: "Architecte" },
  { value: "assistant", label: "Assistant(e)" },
  { value: "comptable", label: "Comptable" },
  { value: "acheteur", label: "Acheteur" },
  { value: "responsable_achats", label: "Responsable Achats" },
  { value: "gerant", label: "Gérant" },
  { value: "president", label: "Président" },
  { value: "associe", label: "Associé" },
  { value: "autre", label: "Autre" },
];

// --- Catégories d'entreprises (vides par défaut - générées par IA selon discipline) ---
export const DEFAULT_COMPANY_CATEGORIES: { key: string; label: string; color: string }[] = [];

// --- Types d'entreprises par défaut (vides par défaut - générés par IA selon discipline) ---
export const DEFAULT_COMPANY_TYPES: { key: string; label: string; shortLabel: string; category: string; color: string }[] = [];

// ============================================================
// Pipelines Contacts par défaut (pour prospection/campagnes email)
// ============================================================

export interface DefaultContactPipelineStage {
  name: string;
  color: string;
  requires_email: boolean;
  email_template_type?: string;
  is_final?: boolean;
  probability?: number;
}

export interface DefaultContactPipeline {
  key: string;
  name: string;
  target_contact_type: string;
  color: string;
  description: string;
  stages: DefaultContactPipelineStage[];
}

// Pipelines génériques - peuvent être personnalisés par discipline via l'IA
export const DEFAULT_CONTACT_PIPELINES: DefaultContactPipeline[] = [
  {
    key: "client_prospection",
    name: "Clients",
    target_contact_type: "client",
    color: "#10B981",
    description: "Pipeline de prospection pour les clients potentiels",
    stages: [
      { name: "Identifié", color: "#6B7280", requires_email: false, probability: 0 },
      { name: "Premier contact", color: "#3B82F6", requires_email: true, email_template_type: "contact_first_client", probability: 20 },
      { name: "Qualification", color: "#8B5CF6", requires_email: false, probability: 40 },
      { name: "Présentation", color: "#F59E0B", requires_email: false, probability: 60 },
      { name: "Proposition", color: "#EC4899", requires_email: false, probability: 75 },
      { name: "Client actif", color: "#22C55E", requires_email: false, is_final: true, probability: 100 },
      { name: "Perdu", color: "#EF4444", requires_email: false, is_final: true, probability: 0 },
    ]
  },
  {
    key: "partenaire_prospection",
    name: "Partenaires",
    target_contact_type: "partenaire",
    color: "#8B5CF6",
    description: "Pipeline de prospection pour les partenaires",
    stages: [
      { name: "Identifié", color: "#6B7280", requires_email: false, probability: 0 },
      { name: "Contact initial", color: "#3B82F6", requires_email: true, email_template_type: "contact_first_partner", probability: 20 },
      { name: "Proposition collaboration", color: "#8B5CF6", requires_email: true, email_template_type: "contact_partnership_proposal", probability: 40 },
      { name: "Négociation", color: "#F59E0B", requires_email: false, probability: 60 },
      { name: "Partenaire actif", color: "#22C55E", requires_email: false, is_final: true, probability: 100 },
      { name: "Décliné", color: "#EF4444", requires_email: false, is_final: true, probability: 0 },
    ]
  },
];

// Templates email par défaut pour les pipelines contacts
export const DEFAULT_CONTACT_PIPELINE_EMAIL_TEMPLATES = [
  {
    template_type: "contact_first_partner",
    name: "Premier contact Partenaire",
    subject: "Proposition de collaboration - {{agency_name}}",
    body_html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Bonjour {{contact_name}},</p>
  <p>Nous avons découvert votre travail et souhaitons vous proposer une collaboration sur nos futurs projets.</p>
  <p><strong>{{agency_name}}</strong> intervient sur des projets variés où votre expertise serait précieuse.</p>
  <p>Seriez-vous intéressé par un échange pour en discuter ?</p>
  <p>Cordialement,<br/>{{sender_name}}</p>
</body>
</html>`,
    variables: ["contact_name", "agency_name", "sender_name"],
  },
  {
    template_type: "contact_first_supplier",
    name: "Premier contact Fournisseur",
    subject: "Demande d'information - {{agency_name}}",
    body_html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Bonjour {{contact_name}},</p>
  <p>L'entreprise <strong>{{agency_name}}</strong> souhaite référencer de nouveaux fournisseurs.</p>
  <p>Pourriez-vous nous transmettre votre catalogue et conditions tarifaires ?</p>
  <p>Cordialement,<br/>{{sender_name}}</p>
</body>
</html>`,
    variables: ["contact_name", "agency_name", "sender_name"],
  },
  {
    template_type: "contact_followup_1",
    name: "Relance 1 - Générique",
    subject: "Relance - {{agency_name}}",
    body_html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Bonjour {{contact_name}},</p>
  <p>Je me permets de revenir vers vous suite à mon précédent message.</p>
  <p>Avez-vous eu l'occasion de considérer ma proposition ?</p>
  <p>Je reste disponible pour en discuter.</p>
  <p>Cordialement,<br/>{{sender_name}}<br/>{{agency_name}}</p>
</body>
</html>`,
    variables: ["contact_name", "agency_name", "sender_name"],
  },
  {
    template_type: "contact_followup_2",
    name: "Relance 2 - Générique",
    subject: "Dernier suivi - {{agency_name}}",
    body_html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Bonjour {{contact_name}},</p>
  <p>Je vous contacte une dernière fois concernant notre éventuelle collaboration.</p>
  <p>Si vous n'êtes pas intéressé, je le comprends parfaitement. N'hésitez pas à me contacter si votre situation évolue.</p>
  <p>Cordialement,<br/>{{sender_name}}<br/>{{agency_name}}</p>
</body>
</html>`,
    variables: ["contact_name", "agency_name", "sender_name"],
  },
  {
    template_type: "contact_partnership_proposal",
    name: "Proposition de partenariat",
    subject: "Proposition de partenariat - {{agency_name}}",
    body_html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Bonjour {{contact_name}},</p>
  <p>Suite à nos échanges, je vous propose de formaliser notre collaboration.</p>
  <p>Nous pourrions travailler ensemble sur nos prochains projets {{project_types}}.</p>
  <p>Seriez-vous disponible pour une rencontre afin de définir les modalités ?</p>
  <p>Cordialement,<br/>{{sender_name}}<br/>{{agency_name}}</p>
</body>
</html>`,
    variables: ["contact_name", "agency_name", "project_types", "sender_name"],
  },
];
