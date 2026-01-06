// ============================================================
// Fichier centralisé pour toutes les valeurs par défaut CRM
// Ces valeurs sont utilisées quand aucun réglage n'est configuré
// ============================================================

// --- Types de contacts ---
export const DEFAULT_CONTACT_TYPES = [
  { key: "client", label: "Client", color: "#10B981" },
  { key: "particulier", label: "Particulier", color: "#6B7280" },
  { key: "partner", label: "Partenaire", color: "#8B5CF6" },
  { key: "supplier", label: "Fournisseur", color: "#3B82F6" },
  { key: "amo", label: "AMO", color: "#F59E0B" },
  { key: "bet", label: "BET", color: "#06B6D4" },
  { key: "entreprise", label: "Entreprise", color: "#EF4444" },
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

// --- Catégories d'entreprises (avec types associés) ---
export const DEFAULT_COMPANY_CATEGORIES = [
  { 
    key: "client", 
    label: "Clients", 
    color: "#10B981",
    icon: "Building2",
    types: ["client", "prospect", "client_prive", "client_public"]
  },
  { 
    key: "bet", 
    label: "BET", 
    color: "#F97316",
    icon: "Ruler",
    types: ["bet_structure", "bet_fluides", "bet_electricite", "bet_acoustique", "bet_thermique", "bet_vrd", "bet_facade", "bet_environnement"]
  },
  { 
    key: "partenaire", 
    label: "Partenaires MOE", 
    color: "#8B5CF6",
    icon: "Users",
    types: ["architecte", "urbaniste", "paysagiste", "decorateur", "economiste", "opc", "sps", "geometre", "diagnostiqueur"]
  },
  { 
    key: "entreprise", 
    label: "Entreprises", 
    color: "#EF4444",
    icon: "HardHat",
    types: ["entreprise_gros_oeuvre", "entreprise_second_oeuvre", "entreprise_generale", "artisan"]
  },
  { 
    key: "fournisseur", 
    label: "Fournisseurs", 
    color: "#3B82F6",
    icon: "Package",
    types: ["fournisseur", "fabricant", "distributeur"]
  },
  { 
    key: "conseil", 
    label: "AMO / Conseil", 
    color: "#06B6D4",
    icon: "Lightbulb",
    types: ["amo", "programmiste", "conseil"]
  },
  { 
    key: "admin", 
    label: "Administration", 
    color: "#6B7280",
    icon: "Landmark",
    types: ["administration", "notaire", "banque", "assurance"]
  },
  { 
    key: "autre", 
    label: "Autre", 
    color: "#9CA3AF",
    icon: "MoreHorizontal",
    types: ["autre"]
  },
];

// --- Types d'entreprises (tous les types avec leur configuration) ---
export const DEFAULT_COMPANY_TYPES = [
  // Clients
  { key: "client", label: "Client actif", shortLabel: "Client", category: "client", color: "#10B981" },
  { key: "prospect", label: "Prospect", shortLabel: "Prospect", category: "client", color: "#3B82F6" },
  { key: "client_prive", label: "Client privé", shortLabel: "Privé", category: "client", color: "#059669" },
  { key: "client_public", label: "Client public", shortLabel: "Public", category: "client", color: "#6366F1" },
  
  // BET
  { key: "bet_structure", label: "BET Structure", shortLabel: "Structure", category: "bet", color: "#F97316" },
  { key: "bet_fluides", label: "BET Fluides", shortLabel: "Fluides", category: "bet", color: "#06B6D4" },
  { key: "bet_electricite", label: "BET Électricité", shortLabel: "Élec", category: "bet", color: "#EAB308" },
  { key: "bet_acoustique", label: "BET Acoustique", shortLabel: "Acoustique", category: "bet", color: "#8B5CF6" },
  { key: "bet_thermique", label: "BET Thermique", shortLabel: "Thermique", category: "bet", color: "#EF4444" },
  { key: "bet_vrd", label: "BET VRD", shortLabel: "VRD", category: "bet", color: "#D97706" },
  { key: "bet_facade", label: "BET Façade", shortLabel: "Façade", category: "bet", color: "#64748B" },
  { key: "bet_environnement", label: "BET Environnement", shortLabel: "Env.", category: "bet", color: "#16A34A" },
  
  // Partenaires MOE
  { key: "architecte", label: "Architecte", shortLabel: "Archi", category: "partenaire", color: "#8B5CF6" },
  { key: "urbaniste", label: "Urbaniste", shortLabel: "Urba", category: "partenaire", color: "#14B8A6" },
  { key: "paysagiste", label: "Paysagiste", shortLabel: "Paysage", category: "partenaire", color: "#84CC16" },
  { key: "decorateur", label: "Décorateur", shortLabel: "Déco", category: "partenaire", color: "#EC4899" },
  { key: "economiste", label: "Économiste", shortLabel: "Éco", category: "partenaire", color: "#0EA5E9" },
  { key: "opc", label: "OPC", shortLabel: "OPC", category: "partenaire", color: "#D946EF" },
  { key: "sps", label: "SPS", shortLabel: "SPS", category: "partenaire", color: "#F43F5E" },
  { key: "geometre", label: "Géomètre", shortLabel: "Géo", category: "partenaire", color: "#78716C" },
  { key: "diagnostiqueur", label: "Diagnostiqueur", shortLabel: "Diag", category: "partenaire", color: "#71717A" },
  
  // Entreprises
  { key: "entreprise_gros_oeuvre", label: "Gros œuvre", shortLabel: "GO", category: "entreprise", color: "#B45309" },
  { key: "entreprise_second_oeuvre", label: "Second œuvre", shortLabel: "SO", category: "entreprise", color: "#EA580C" },
  { key: "entreprise_generale", label: "Entreprise générale", shortLabel: "EG", category: "entreprise", color: "#DC2626" },
  { key: "artisan", label: "Artisan", shortLabel: "Artisan", category: "entreprise", color: "#CA8A04" },
  
  // Fournisseurs
  { key: "fournisseur", label: "Fournisseur", shortLabel: "Fourn.", category: "fournisseur", color: "#2563EB" },
  { key: "fabricant", label: "Fabricant", shortLabel: "Fab.", category: "fournisseur", color: "#4F46E5" },
  { key: "distributeur", label: "Distributeur", shortLabel: "Dist.", category: "fournisseur", color: "#7C3AED" },
  
  // AMO / Conseil
  { key: "amo", label: "AMO", shortLabel: "AMO", category: "conseil", color: "#0891B2" },
  { key: "programmiste", label: "Programmiste", shortLabel: "Prog.", category: "conseil", color: "#0D9488" },
  { key: "conseil", label: "Conseil", shortLabel: "Conseil", category: "conseil", color: "#047857" },
  
  // Administration
  { key: "administration", label: "Administration", shortLabel: "Admin", category: "admin", color: "#4B5563" },
  { key: "notaire", label: "Notaire", shortLabel: "Notaire", category: "admin", color: "#475569" },
  { key: "banque", label: "Banque", shortLabel: "Banque", category: "admin", color: "#1D4ED8" },
  { key: "assurance", label: "Assurance", shortLabel: "Assur.", category: "admin", color: "#15803D" },
  
  // Autre
  { key: "autre", label: "Autre", shortLabel: "Autre", category: "autre", color: "#6B7280" },
];
