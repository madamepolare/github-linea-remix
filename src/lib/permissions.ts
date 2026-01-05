// Permission catalog for the application
// Roles: owner > admin > member > viewer

export type AppRole = "owner" | "admin" | "member" | "viewer";

export type Permission =
  // Projects
  | "projects.view"
  | "projects.create"
  | "projects.edit"
  | "projects.delete"
  | "projects.archive"
  // CRM
  | "crm.view"
  | "crm.create"
  | "crm.edit"
  | "crm.delete"
  | "crm.view_sensitive" // emails, phones, notes
  // Commercial
  | "commercial.view"
  | "commercial.create"
  | "commercial.edit"
  | "commercial.delete"
  | "commercial.send"
  | "commercial.sign"
  // Invoicing
  | "invoicing.view"
  | "invoicing.create"
  | "invoicing.edit"
  | "invoicing.delete"
  | "invoicing.send"
  | "invoicing.mark_paid"
  // Documents
  | "documents.view"
  | "documents.create"
  | "documents.edit"
  | "documents.delete"
  | "documents.sign"
  // Tasks
  | "tasks.view"
  | "tasks.create"
  | "tasks.edit"
  | "tasks.delete"
  | "tasks.assign"
  // Tenders
  | "tenders.view"
  | "tenders.create"
  | "tenders.edit"
  | "tenders.delete"
  | "tenders.submit"
  // Team
  | "team.view"
  | "team.invite"
  | "team.manage_roles"
  | "team.remove"
  | "team.view_time"
  | "team.validate_time"
  | "team.manage_absences"
  | "team.manage_evaluations"
  | "team.manage_recruitment"
  // Settings
  | "settings.view"
  | "settings.edit"
  | "settings.manage_workspace"
  | "settings.manage_billing";

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<AppRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

// Permission matrix: which roles have which permissions
export const PERMISSION_MATRIX: Record<Permission, AppRole[]> = {
  // Projects
  "projects.view": ["owner", "admin", "member", "viewer"],
  "projects.create": ["owner", "admin", "member"],
  "projects.edit": ["owner", "admin", "member"],
  "projects.delete": ["owner", "admin"],
  "projects.archive": ["owner", "admin"],

  // CRM
  "crm.view": ["owner", "admin", "member", "viewer"],
  "crm.create": ["owner", "admin", "member"],
  "crm.edit": ["owner", "admin", "member"],
  "crm.delete": ["owner", "admin"],
  "crm.view_sensitive": ["owner", "admin"],

  // Commercial
  "commercial.view": ["owner", "admin", "member", "viewer"],
  "commercial.create": ["owner", "admin", "member"],
  "commercial.edit": ["owner", "admin", "member"],
  "commercial.delete": ["owner", "admin"],
  "commercial.send": ["owner", "admin", "member"],
  "commercial.sign": ["owner", "admin"],

  // Invoicing
  "invoicing.view": ["owner", "admin", "member", "viewer"],
  "invoicing.create": ["owner", "admin", "member"],
  "invoicing.edit": ["owner", "admin", "member"],
  "invoicing.delete": ["owner", "admin"],
  "invoicing.send": ["owner", "admin", "member"],
  "invoicing.mark_paid": ["owner", "admin"],

  // Documents
  "documents.view": ["owner", "admin", "member", "viewer"],
  "documents.create": ["owner", "admin", "member"],
  "documents.edit": ["owner", "admin", "member"],
  "documents.delete": ["owner", "admin"],
  "documents.sign": ["owner", "admin", "member"],

  // Tasks
  "tasks.view": ["owner", "admin", "member", "viewer"],
  "tasks.create": ["owner", "admin", "member"],
  "tasks.edit": ["owner", "admin", "member"],
  "tasks.delete": ["owner", "admin"],
  "tasks.assign": ["owner", "admin", "member"],

  // Tenders
  "tenders.view": ["owner", "admin", "member", "viewer"],
  "tenders.create": ["owner", "admin", "member"],
  "tenders.edit": ["owner", "admin", "member"],
  "tenders.delete": ["owner", "admin"],
  "tenders.submit": ["owner", "admin"],

  // Team
  "team.view": ["owner", "admin", "member", "viewer"],
  "team.invite": ["owner", "admin"],
  "team.manage_roles": ["owner", "admin"],
  "team.remove": ["owner", "admin"],
  "team.view_time": ["owner", "admin", "member"],
  "team.validate_time": ["owner", "admin"],
  "team.manage_absences": ["owner", "admin"],
  "team.manage_evaluations": ["owner", "admin"],
  "team.manage_recruitment": ["owner", "admin"],

  // Settings
  "settings.view": ["owner", "admin", "member", "viewer"],
  "settings.edit": ["owner", "admin"],
  "settings.manage_workspace": ["owner"],
  "settings.manage_billing": ["owner"],
};

// Check if a role has a specific permission
export function hasPermission(role: AppRole | null, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSION_MATRIX[permission]?.includes(role) ?? false;
}

// Check if a role has at least the level of another role
export function hasRoleOrHigher(role: AppRole | null, minRole: AppRole): boolean {
  if (!role) return false;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
}

// Get all permissions for a role
export function getPermissionsForRole(role: AppRole): Permission[] {
  return Object.entries(PERMISSION_MATRIX)
    .filter(([_, roles]) => roles.includes(role))
    .map(([permission]) => permission as Permission);
}

// Permission categories for UI display
export const PERMISSION_CATEGORIES = {
  projects: {
    label: "Projets",
    permissions: ["projects.view", "projects.create", "projects.edit", "projects.delete", "projects.archive"],
  },
  crm: {
    label: "CRM",
    permissions: ["crm.view", "crm.create", "crm.edit", "crm.delete", "crm.view_sensitive"],
  },
  commercial: {
    label: "Commercial",
    permissions: ["commercial.view", "commercial.create", "commercial.edit", "commercial.delete", "commercial.send", "commercial.sign"],
  },
  invoicing: {
    label: "Facturation",
    permissions: ["invoicing.view", "invoicing.create", "invoicing.edit", "invoicing.delete", "invoicing.send", "invoicing.mark_paid"],
  },
  documents: {
    label: "Documents",
    permissions: ["documents.view", "documents.create", "documents.edit", "documents.delete", "documents.sign"],
  },
  tasks: {
    label: "Tâches",
    permissions: ["tasks.view", "tasks.create", "tasks.edit", "tasks.delete", "tasks.assign"],
  },
  tenders: {
    label: "Appels d'offres",
    permissions: ["tenders.view", "tenders.create", "tenders.edit", "tenders.delete", "tenders.submit"],
  },
  team: {
    label: "Équipe",
    permissions: ["team.view", "team.invite", "team.manage_roles", "team.remove", "team.view_time", "team.validate_time", "team.manage_absences", "team.manage_evaluations", "team.manage_recruitment"],
  },
  settings: {
    label: "Paramètres",
    permissions: ["settings.view", "settings.edit", "settings.manage_workspace", "settings.manage_billing"],
  },
} as const;

// Role labels for UI
export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  member: "Membre",
  viewer: "Lecteur",
};

// Role descriptions for UI
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  owner: "Accès complet, gestion du workspace et de la facturation",
  admin: "Gestion des membres, suppression de données, accès aux données sensibles",
  member: "Création et modification des données, gestion des tâches",
  viewer: "Consultation uniquement, aucune modification possible",
};
