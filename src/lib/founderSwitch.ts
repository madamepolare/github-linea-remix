// Configuration du switch instantané fondateur
// Mappage workspace slug → email du compte associé

export const FOUNDER_WORKSPACE_EMAIL_MAP: Record<string, string> = {
  // Workspace slug → email associé
  "domini": "gt@domini.archi",
  "madamepolare": "giacomo@madamepolare.com",
};

// Emails autorisés pour le switch fondateur
export const ALLOWED_FOUNDER_EMAILS = Object.values(FOUNDER_WORKSPACE_EMAIL_MAP).map(e => e.toLowerCase());

// Vérifie si un email est un compte fondateur
export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_FOUNDER_EMAILS.includes(email.toLowerCase());
}

// Récupère l'email associé à un workspace (par slug ou name)
export function getEmailForWorkspace(workspaceSlugOrName: string): string | null {
  const key = workspaceSlugOrName.toLowerCase();
  return FOUNDER_WORKSPACE_EMAIL_MAP[key] || null;
}

// Storage keys
export const PENDING_WORKSPACE_KEY = "linea_pending_workspace";
export const LINKED_SESSIONS_KEY = "linea_linked_sessions";

// Stocke l'intention de changer de workspace après le switch d'auth
export function setPendingWorkspace(workspaceId: string): void {
  localStorage.setItem(PENDING_WORKSPACE_KEY, workspaceId);
}

// Récupère et supprime l'intention de changement de workspace
export function consumePendingWorkspace(): string | null {
  const pending = localStorage.getItem(PENDING_WORKSPACE_KEY);
  if (pending) {
    localStorage.removeItem(PENDING_WORKSPACE_KEY);
  }
  return pending;
}
