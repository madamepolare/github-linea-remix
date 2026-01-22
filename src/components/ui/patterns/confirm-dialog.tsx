import * as React from "react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ButtonLoader } from "./loading-state";

/* =============================================================================
   CONFIRM DIALOG COMPONENT
   Standardized dialog for confirmations and destructive actions.
   
   USAGE GUIDELINES:
   - Use for: Delete confirmations, destructive actions, important decisions
   - Do NOT use for: Forms (use FormDialog), details (use DetailSheet)
   
   VARIANTS:
   - default: Standard confirmation (blue primary button)
   - destructive: Destructive action (red button)
   - warning: Warning confirmation (orange/amber button)
   ============================================================================= */

export type ConfirmVariant = "default" | "destructive" | "warning";

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Description/warning message */
  description: string;
  /** Confirm button text */
  confirmLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;
  /** Visual variant */
  variant?: ConfirmVariant;
  /** Whether action is in progress */
  isLoading?: boolean;
  /** Confirm action handler */
  onConfirm: () => void | Promise<void>;
  /** Additional className */
  className?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
  isLoading = false,
  onConfirm,
  className,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const actionClassName = cn(
    variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    variant === "warning" && "bg-warning text-warning-foreground hover:bg-warning/90"
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={cn("max-w-[400px]", className)}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={actionClassName}
          >
            {isLoading && <ButtonLoader />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Delete confirmation variant
interface DeleteDialogProps extends Omit<ConfirmDialogProps, "variant" | "confirmLabel" | "title"> {
  /** Item name to delete (shown in title) */
  itemName?: string;
  title?: string;
  confirmLabel?: string;
}

export function DeleteDialog({ 
  itemName = "cet élément",
  title = "Supprimer",
  confirmLabel = "Supprimer",
  description = `Êtes-vous sûr de vouloir supprimer ${itemName} ? Cette action est irréversible.`,
  ...props 
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      variant="destructive"
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      {...props}
    />
  );
}

// Archive confirmation variant  
interface ArchiveDialogProps extends Omit<ConfirmDialogProps, "variant" | "confirmLabel" | "title"> {
  itemName?: string;
  title?: string;
  confirmLabel?: string;
}

export function ArchiveDialog({
  itemName = "cet élément",
  title = "Archiver",
  confirmLabel = "Archiver",
  description = `Êtes-vous sûr de vouloir archiver ${itemName} ?`,
  ...props
}: ArchiveDialogProps) {
  return (
    <ConfirmDialog
      variant="warning"
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      {...props}
    />
  );
}
