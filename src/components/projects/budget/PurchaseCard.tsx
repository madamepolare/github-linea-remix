import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Edit,
  Building2,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  PURCHASE_CATEGORIES,
  PURCHASE_STATUSES,
  PurchaseStatus,
  STATUS_TRANSITIONS,
} from "@/lib/purchaseTypes";
import type { ProjectPurchase } from "@/hooks/useProjectPurchases";

interface PurchaseCardProps {
  purchase: ProjectPurchase;
  onEdit?: (purchase: ProjectPurchase) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: PurchaseStatus) => void;
  isDragging?: boolean;
}

export function PurchaseCard({
  purchase,
  onEdit,
  onDelete,
  onStatusChange,
  isDragging = false,
}: PurchaseCardProps) {
  const category = PURCHASE_CATEGORIES[purchase.purchase_category];
  const status = PURCHASE_STATUSES[purchase.status];
  const CategoryIcon = category.icon;
  const StatusIcon = status.icon;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Check if overdue
  const isOverdue = purchase.due_date && 
    purchase.status !== "paid" && 
    purchase.status !== "cancelled" &&
    differenceInDays(new Date(), parseISO(purchase.due_date)) > 0;

  const daysUntilDue = purchase.due_date
    ? differenceInDays(parseISO(purchase.due_date), new Date())
    : null;

  const availableTransitions = STATUS_TRANSITIONS[purchase.status] || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "cursor-pointer",
        isDragging && "opacity-50"
      )}
    >
      <Card 
        className={cn(
          "transition-all duration-200 hover:shadow-md",
          isOverdue && "border-destructive/50 bg-destructive/5"
        )}
        onClick={() => onEdit?.(purchase)}
      >
        <CardContent className="p-3">
          {/* Header: Category badge + Actions */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge 
              variant="secondary" 
              className={cn("text-xs gap-1", category.bgColor, category.color)}
            >
              <CategoryIcon className="h-3 w-3" />
              {category.label}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(purchase);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                
                {purchase.file_url && (
                  <DropdownMenuItem asChild>
                    <a 
                      href={purchase.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir la facture
                    </a>
                  </DropdownMenuItem>
                )}

                {availableTransitions.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {availableTransitions.map((newStatus) => {
                      const statusConfig = PURCHASE_STATUSES[newStatus];
                      const Icon = statusConfig.icon;
                      return (
                        <DropdownMenuItem
                          key={newStatus}
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange?.(purchase.id, newStatus);
                          }}
                        >
                          <Icon className={cn("h-4 w-4 mr-2", statusConfig.color)} />
                          {statusConfig.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(purchase.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title */}
          <h4 className="font-medium text-sm line-clamp-2 mb-2">
            {purchase.title}
          </h4>

          {/* Supplier */}
          {(purchase.supplier?.name || purchase.supplier_name) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Building2 className="h-3 w-3" />
              <span className="truncate">
                {purchase.supplier?.name || purchase.supplier_name}
              </span>
            </div>
          )}

          {/* Amount */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold">
              {formatCurrency(purchase.amount_ht)}
            </span>
            <span className="text-xs text-muted-foreground">
              HT
            </span>
          </div>

          {/* Margin if selling price */}
          {purchase.selling_price && purchase.margin_percentage !== null && (
            <div className="flex items-center gap-1 text-xs mb-2">
              <TrendingUp className={cn(
                "h-3 w-3",
                purchase.margin_percentage >= 0 ? "text-emerald-500" : "text-destructive"
              )} />
              <span className={cn(
                purchase.margin_percentage >= 0 ? "text-emerald-600" : "text-destructive"
              )}>
                {formatCurrency(purchase.selling_price)} ({Math.round(purchase.margin_percentage)}% marge)
              </span>
            </div>
          )}

          {/* Due date */}
          {purchase.due_date && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs",
              isOverdue ? "text-destructive" : 
              daysUntilDue !== null && daysUntilDue <= 7 ? "text-amber-600" : 
              "text-muted-foreground"
            )}>
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
              <Calendar className="h-3 w-3" />
              <span>
                {isOverdue 
                  ? `En retard de ${Math.abs(daysUntilDue!)} jour${Math.abs(daysUntilDue!) > 1 ? 's' : ''}`
                  : `Échéance ${format(parseISO(purchase.due_date), "d MMM", { locale: fr })}`
                }
              </span>
            </div>
          )}

          {/* Invoice number */}
          {purchase.invoice_number && (
            <div className="text-xs text-muted-foreground mt-1">
              N° {purchase.invoice_number}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
