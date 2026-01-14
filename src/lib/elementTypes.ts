import {
  Link,
  File,
  Mail,
  StickyNote,
  ShoppingCart,
  FileText,
  Folder,
  FileText as FileTextIcon,
  Wrench,
  Briefcase,
  Scale,
  BookOpen,
  Key,
  Image,
  LucideIcon,
} from "lucide-react";

export type ElementType = 'link' | 'file' | 'email' | 'note' | 'order' | 'letter' | 'credential' | 'image_ref' | 'other';
export type ElementVisibility = 'all' | 'admin' | 'owner';

export interface ElementTypeConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

export interface ElementCategoryConfig {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const ELEMENT_TYPE_CONFIG: Record<ElementType, ElementTypeConfig> = {
  link: {
    label: "Lien",
    icon: Link,
    color: "blue",
    description: "Lien vers une ressource externe",
  },
  file: {
    label: "Fichier",
    icon: File,
    color: "gray",
    description: "Document, image, PDF...",
  },
  email: {
    label: "Email",
    icon: Mail,
    color: "purple",
    description: "Email important à conserver",
  },
  note: {
    label: "Note",
    icon: StickyNote,
    color: "yellow",
    description: "Note textuelle ou mémo",
  },
  order: {
    label: "Bon de commande",
    icon: ShoppingCart,
    color: "green",
    description: "Bon de commande ou devis fournisseur",
  },
  letter: {
    label: "Courrier",
    icon: FileText,
    color: "orange",
    description: "Courrier scanné ou document officiel",
  },
  credential: {
    label: "Code d'accès",
    icon: Key,
    color: "amber",
    description: "Identifiants, mots de passe, codes",
  },
  image_ref: {
    label: "Référence",
    icon: Image,
    color: "pink",
    description: "Image de référence ou inspiration",
  },
  other: {
    label: "Autre",
    icon: Folder,
    color: "gray",
    description: "Autre type d'élément",
  },
};

export const ELEMENT_CATEGORIES: ElementCategoryConfig[] = [
  { value: "administrative", label: "Administratif", icon: FileTextIcon },
  { value: "technical", label: "Technique", icon: Wrench },
  { value: "commercial", label: "Commercial", icon: Briefcase },
  { value: "legal", label: "Juridique", icon: Scale },
  { value: "communication", label: "Communication", icon: Mail },
  { value: "reference", label: "Référence", icon: BookOpen },
  { value: "access", label: "Accès", icon: Key },
  { value: "other", label: "Autre", icon: Folder },
];

export const VISIBILITY_CONFIG: Record<ElementVisibility, { label: string; description: string }> = {
  all: {
    label: "Tous les membres",
    description: "Visible par tous les membres du projet",
  },
  admin: {
    label: "Administrateurs",
    description: "Visible uniquement par les administrateurs et propriétaires",
  },
  owner: {
    label: "Propriétaire uniquement",
    description: "Visible uniquement par le propriétaire du workspace",
  },
};

export function getElementTypeColor(type: ElementType): string {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    gray: "bg-muted text-muted-foreground",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  };
  return colorMap[ELEMENT_TYPE_CONFIG[type].color] || colorMap.gray;
}

export function getFileTypeFromMime(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document")) return "doc";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "presentation";
  return "file";
}
