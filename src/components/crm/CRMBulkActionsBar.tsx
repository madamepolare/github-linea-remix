import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Trash2, 
  Download, 
  Tag, 
  UserPlus,
  Mail,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CRMBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onAddToPipeline?: () => void;
  onSendEmail?: () => void;
  onAddTag?: () => void;
  entityType: "contacts" | "companies" | "leads";
  className?: string;
}

export function CRMBulkActionsBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onExport,
  onAddToPipeline,
  onSendEmail,
  onAddTag,
  entityType,
  className,
}: CRMBulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const entityLabels = {
    contacts: { singular: "contact", plural: "contacts" },
    companies: { singular: "entreprise", plural: "entreprises" },
    leads: { singular: "lead", plural: "leads" },
  };

  const label = entityLabels[entityType];
  const countLabel = selectedCount === 1 
    ? `1 ${label.singular} sélectionné` 
    : `${selectedCount} ${label.plural} sélectionnés`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-2 px-4 py-2.5 rounded-xl",
          "bg-foreground text-background shadow-2xl",
          "border border-foreground/10",
          className
        )}
      >
        {/* Count & close */}
        <div className="flex items-center gap-3 pr-3 border-r border-background/20">
          <span className="text-sm font-medium whitespace-nowrap">{countLabel}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-background/20 text-background"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Primary actions */}
        <div className="flex items-center gap-1">
          {onSendEmail && (entityType === "contacts" || entityType === "companies") && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-background hover:bg-background/20 hover:text-background"
              onClick={onSendEmail}
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Email</span>
            </Button>
          )}

          {onAddToPipeline && entityType !== "leads" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-background hover:bg-background/20 hover:text-background"
              onClick={onAddToPipeline}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pipeline</span>
            </Button>
          )}

          {onAddTag && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-background hover:bg-background/20 hover:text-background"
              onClick={onAddTag}
            >
              <Tag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tag</span>
            </Button>
          )}

          {onExport && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-background hover:bg-background/20 hover:text-background"
              onClick={onExport}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-background hover:bg-background/20 hover:text-background"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onExport && (
                <DropdownMenuItem onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter en CSV
                </DropdownMenuItem>
              )}
              {onAddTag && (
                <DropdownMenuItem onClick={onAddTag}>
                  <Tag className="h-4 w-4 mr-2" />
                  Ajouter un tag
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer ({selectedCount})
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
