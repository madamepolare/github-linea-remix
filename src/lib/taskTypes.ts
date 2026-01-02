export type TaskModule = 'general' | 'admin' | 'concours' | 'project' | 'hr' | 'finance' | 'commercial';
export type RelatedEntityType = 'contact' | 'lead' | 'project' | 'company' | 'invoice' | 'quote';

export const TASK_MODULES = [
  { id: 'general', label: 'Général' },
  { id: 'admin', label: 'Admin' },
  { id: 'concours', label: 'Concours' },
  { id: 'project', label: 'Projet' },
  { id: 'hr', label: 'RH' },
  { id: 'finance', label: 'Finance' },
  { id: 'commercial', label: 'Commercial' },
] as const;

export const TASK_STATUSES = [
  { id: 'todo', label: 'À faire', color: '#6b7280', dotClass: 'bg-gray-400' },
  { id: 'in_progress', label: 'En cours', color: '#3b82f6', dotClass: 'bg-blue-500' },
  { id: 'review', label: 'En révision', color: '#f59e0b', dotClass: 'bg-amber-500' },
  { id: 'done', label: 'Terminée', color: '#22c55e', dotClass: 'bg-green-500' },
  { id: 'archived', label: 'Archivée', color: '#9ca3af', dotClass: 'bg-gray-400' },
] as const;

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Basse', color: 'bg-slate-500/20 text-slate-700 dark:text-slate-300' },
  { id: 'medium', label: 'Moyenne', color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' },
  { id: 'high', label: 'Haute', color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300' },
  { id: 'urgent', label: 'Urgente', color: 'bg-red-500/20 text-red-700 dark:text-red-300' },
] as const;

export const RELATED_ENTITY_TYPES = [
  { id: 'project', label: 'Projet', icon: 'FolderKanban' },
  { id: 'lead', label: 'Lead', icon: 'Target' },
  { id: 'company', label: 'Entreprise', icon: 'Building2' },
  { id: 'contact', label: 'Contact', icon: 'User' },
] as const;

export const ENTITY_TABS = [
  { id: 'all', label: 'Toutes' },
  { id: 'project', label: 'Projets' },
  { id: 'lead', label: 'Leads' },
  { id: 'company', label: 'Entreprises' },
  { id: 'contact', label: 'Contacts' },
] as const;
