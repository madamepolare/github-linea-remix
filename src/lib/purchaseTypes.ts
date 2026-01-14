import {
  Users,
  Printer,
  Key,
  Truck,
  Package,
  Briefcase,
  MoreHorizontal,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  Receipt,
  Clock,
  CreditCard,
  XCircle,
  LucideIcon,
} from "lucide-react";

// Purchase Types
export type PurchaseType = "provision" | "supplier_invoice";

export const PURCHASE_TYPES: Record<PurchaseType, { label: string; description: string }> = {
  provision: {
    label: "Provision",
    description: "Estimation budgétaire en attente de facture",
  },
  supplier_invoice: {
    label: "Facture fournisseur",
    description: "Facture reçue d'un fournisseur",
  },
};

// Purchase Categories
export type PurchaseCategory =
  | "subcontract"
  | "printing"
  | "rental"
  | "transport"
  | "material"
  | "service"
  | "other";

export interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const PURCHASE_CATEGORIES: Record<PurchaseCategory, CategoryConfig> = {
  subcontract: {
    label: "Sous-traitance",
    icon: Users,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  printing: {
    label: "Impression",
    icon: Printer,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  rental: {
    label: "Location",
    icon: Key,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  transport: {
    label: "Transport",
    icon: Truck,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  material: {
    label: "Matériaux",
    icon: Package,
    color: "text-slate-600",
    bgColor: "bg-slate-100 dark:bg-slate-900/30",
  },
  service: {
    label: "Prestation",
    icon: Briefcase,
    color: "text-cyan-600",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  other: {
    label: "Autre",
    icon: MoreHorizontal,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
};

// Purchase Status
export type PurchaseStatus =
  | "draft"
  | "pending_validation"
  | "validated"
  | "invoice_received"
  | "payment_pending"
  | "paid"
  | "cancelled";

export interface StatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  kanbanOrder: number;
}

export const PURCHASE_STATUSES: Record<PurchaseStatus, StatusConfig> = {
  draft: {
    label: "Brouillon",
    icon: FileText,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    kanbanOrder: 0,
  },
  pending_validation: {
    label: "À valider",
    icon: ClipboardCheck,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    kanbanOrder: 1,
  },
  validated: {
    label: "Validé",
    icon: CheckCircle2,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    kanbanOrder: 2,
  },
  invoice_received: {
    label: "Facture reçue",
    icon: Receipt,
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    kanbanOrder: 3,
  },
  payment_pending: {
    label: "En attente paiement",
    icon: Clock,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    kanbanOrder: 4,
  },
  paid: {
    label: "Payé",
    icon: CreditCard,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    kanbanOrder: 5,
  },
  cancelled: {
    label: "Annulé",
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    kanbanOrder: 6,
  },
};

// Kanban columns config
export const KANBAN_COLUMNS: PurchaseStatus[] = [
  "draft",
  "pending_validation",
  "validated",
  "invoice_received",
  "paid",
];

// Status transitions
export const STATUS_TRANSITIONS: Record<PurchaseStatus, PurchaseStatus[]> = {
  draft: ["pending_validation", "cancelled"],
  pending_validation: ["validated", "draft", "cancelled"],
  validated: ["invoice_received", "pending_validation", "cancelled"],
  invoice_received: ["payment_pending", "paid", "cancelled"],
  payment_pending: ["paid", "cancelled"],
  paid: [],
  cancelled: ["draft"],
};

// VAT rates
export const VAT_RATES = [
  { value: 20, label: "20% (Normal)" },
  { value: 10, label: "10% (Intermédiaire)" },
  { value: 5.5, label: "5,5% (Réduit)" },
  { value: 2.1, label: "2,1% (Super réduit)" },
  { value: 0, label: "0% (Exonéré)" },
];
