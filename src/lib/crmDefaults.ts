// ============================================================
// Fichier centralisé pour toutes les valeurs par défaut CRM
// Ces valeurs sont utilisées quand aucun réglage n'est configuré
// ============================================================

// --- Types de contacts ---
export const DEFAULT_CONTACT_TYPES = [
  { key: "contact", label: "Contact", color: "#3B82F6", icon: "User" },
  { key: "lead", label: "Lead", color: "#F59E0B", icon: "Target" },
];

// --- Spécialités BET ---
export const DEFAULT_BET_SPECIALTIES = [
  { key: "structure", label: "Structure", color: "#F97316" },
  { key: "fluides", label: "Fluides (CVC)", color: "#06B6D4" },
  { key: "electricite", label: "Électricité", color: "#EAB308" },
  { key: "acoustique", label: "Acoustique", color: "#8B5CF6" },
  { key: "thermique", label: "Thermique / RE2020", color: "#EF4444" },
  { key: "vrd", label: "VRD", color: "#D97706" },
  { key: "facade", label: "Façades", color: "#64748B" },
  { key: "environnement", label: "Environnement / HQE", color: "#16A34A" },
  { key: "economie", label: "Économie", color: "#3B82F6" },
  { key: "securite", label: "Sécurité incendie", color: "#F43F5E" },
  { key: "geotechnique", label: "Géotechnique", color: "#78716C" },
];

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

// --- Catégories d'entreprises (valeurs par défaut - générées par IA selon discipline) ---
export const DEFAULT_COMPANY_CATEGORIES = [
  { key: "client", label: "Clients", color: "#10B981" },
  { key: "partenaire", label: "Partenaires", color: "#8B5CF6" },
  { key: "fournisseur", label: "Fournisseurs", color: "#3B82F6" },
  { key: "autre", label: "Autre", color: "#6B7280" },
];

// --- Types d'entreprises par défaut (sous-catégories) ---
export const DEFAULT_COMPANY_TYPES = [
  // Clients
  { key: "client_actif", label: "Client actif", shortLabel: "Client", category: "client", color: "#10B981" },
  { key: "prospect", label: "Prospect", shortLabel: "Prospect", category: "client", color: "#3B82F6" },
  
  // Partenaires
  { key: "partenaire_moe", label: "Partenaire MOE", shortLabel: "MOE", category: "partenaire", color: "#8B5CF6" },
  { key: "prestataire", label: "Prestataire", shortLabel: "Presta", category: "partenaire", color: "#EC4899" },
  
  // Fournisseurs
  { key: "fournisseur", label: "Fournisseur", shortLabel: "Fourn.", category: "fournisseur", color: "#3B82F6" },
  
  // Autre
  { key: "autre", label: "Autre", shortLabel: "Autre", category: "autre", color: "#6B7280" },
];

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
    key: "promoteur_prospection",
    name: "Promoteurs",
    target_contact_type: "promoteur",
    color: "#6366F1",
    description: "Pipeline de prospection pour les promoteurs immobiliers",
    stages: [
      { name: "Cible identifiée", color: "#6B7280", requires_email: false, probability: 0 },
      { name: "Prise de contact", color: "#3B82F6", requires_email: true, email_template_type: "contact_first_promoteur", probability: 15 },
      { name: "RDV planifié", color: "#8B5CF6", requires_email: false, probability: 30 },
      { name: "Présentation agence", color: "#F59E0B", requires_email: false, probability: 50 },
      { name: "En veille projet", color: "#EC4899", requires_email: false, probability: 60 },
      { name: "Collaboration active", color: "#22C55E", requires_email: false, is_final: true, probability: 100 },
      { name: "Non retenu", color: "#EF4444", requires_email: false, is_final: true, probability: 0 },
    ]
  },
  {
    key: "amenageur_prospection",
    name: "Aménageurs",
    target_contact_type: "amenageur",
    color: "#0EA5E9",
    description: "Pipeline de prospection pour les aménageurs",
    stages: [
      { name: "Identifié", color: "#6B7280", requires_email: false, probability: 0 },
      { name: "Premier contact", color: "#3B82F6", requires_email: true, email_template_type: "contact_first_amenageur", probability: 20 },
      { name: "Qualification projet", color: "#8B5CF6", requires_email: false, probability: 35 },
      { name: "Présentation", color: "#F59E0B", requires_email: false, probability: 50 },
      { name: "Négociation", color: "#EC4899", requires_email: false, probability: 70 },
      { name: "Partenaire", color: "#22C55E", requires_email: false, is_final: true, probability: 100 },
      { name: "Non retenu", color: "#EF4444", requires_email: false, is_final: true, probability: 0 },
    ]
  },
  {
    key: "bet_prospection",
    name: "BET",
    target_contact_type: "bet",
    color: "#F97316",
    description: "Pipeline de prospection pour les Bureaux d'Études Techniques",
    stages: [
      { name: "À contacter", color: "#6B7280", requires_email: false, probability: 0 },
      { name: "Premier contact", color: "#3B82F6", requires_email: true, email_template_type: "contact_first_bet", probability: 20 },
      { name: "Relance 1", color: "#8B5CF6", requires_email: true, email_template_type: "contact_followup_1", probability: 30 },
      { name: "Relance 2", color: "#EC4899", requires_email: true, email_template_type: "contact_followup_2", probability: 40 },
      { name: "En discussion", color: "#F59E0B", requires_email: false, probability: 60 },
      { name: "Partenariat établi", color: "#22C55E", requires_email: false, is_final: true, probability: 100 },
      { name: "Non intéressé", color: "#EF4444", requires_email: false, is_final: true, probability: 0 },
    ]
  },
  {
    key: "partenaire_prospection",
    name: "Partenaires MOE",
    target_contact_type: "partenaire",
    color: "#8B5CF6",
    description: "Pipeline de prospection pour architectes, paysagistes, économistes...",
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
    template_type: "contact_first_bet",
    name: "Premier contact BET",
    subject: "Collaboration potentielle - {{agency_name}}",
    body_html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Bonjour {{contact_name}},</p>
  <p>Je me permets de vous contacter au nom de <strong>{{agency_name}}</strong>, agence d'architecture basée à {{agency_city}}.</p>
  <p>Nous recherchons des partenaires BET {{specialty}} pour nos projets et votre expertise a retenu notre attention.</p>
  <p>Seriez-vous disponible pour un échange téléphonique afin de discuter d'une éventuelle collaboration ?</p>
  <p>Cordialement,<br/>{{sender_name}}<br/>{{agency_name}}</p>
</body>
</html>`,
    variables: ["contact_name", "agency_name", "agency_city", "specialty", "sender_name"],
  },
  {
    template_type: "contact_first_societe",
    name: "Premier contact Société",
    subject: "Partenariat travaux - {{agency_name}}",
    body_html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Bonjour {{contact_name}},</p>
  <p>L'agence <strong>{{agency_name}}</strong> développe son réseau de sociétés partenaires.</p>
  <p>Nous intervenons principalement sur des projets de {{project_types}} et cherchons des entreprises fiables pour nos chantiers.</p>
  <p>Pourriez-vous nous transmettre votre plaquette et références ?</p>
  <p>Cordialement,<br/>{{sender_name}}</p>
</body>
</html>`,
    variables: ["contact_name", "agency_name", "project_types", "sender_name"],
  },
  {
    template_type: "contact_first_partner",
    name: "Premier contact Partenaire MOE",
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
    subject: "Demande d'information produits - {{agency_name}}",
    body_html: `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Bonjour {{contact_name}},</p>
  <p>L'agence <strong>{{agency_name}}</strong> souhaite référencer de nouveaux fournisseurs.</p>
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
