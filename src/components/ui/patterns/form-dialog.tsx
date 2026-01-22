import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ButtonLoader } from "./loading-state";

/* =============================================================================
   FORM DIALOG COMPONENT
   Standardized dialog for all create/edit forms.
   
   USAGE GUIDELINES:
   - Use for: Creating new items, editing existing items, form wizards
   - Do NOT use for: Viewing details (use DetailSheet), confirmations (use ConfirmDialog)
   
   WIDTH PRESETS:
   - sm: Simple forms, 2-3 fields (400px)
   - md: Standard forms, 4-6 fields (500px) - DEFAULT
   - lg: Complex forms, many fields (600px)
   - xl: Multi-column forms (700px)
   ============================================================================= */

export type DialogSize = "sm" | "md" | "lg" | "xl";

interface FormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title: string;
  /** Optional description below title */
  description?: string;
  /** Dialog content (form fields) */
  children: React.ReactNode;
  /** Submit button text */
  submitLabel?: string;
  /** Cancel button text */
  cancelLabel?: string;
  /** Whether form is submitting */
  isSubmitting?: boolean;
  /** Whether submit is disabled */
  submitDisabled?: boolean;
  /** Form submit handler */
  onSubmit?: (e: React.FormEvent) => void;
  /** Dialog size preset */
  size?: DialogSize;
  /** Additional className for content */
  className?: string;
  /** Hide footer (for custom footer implementation) */
  hideFooter?: boolean;
  /** Custom footer content */
  footer?: React.ReactNode;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-[400px]",
  md: "max-w-[500px]",
  lg: "max-w-[600px]",
  xl: "max-w-[700px]",
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = "Enregistrer",
  cancelLabel = "Annuler",
  isSubmitting = false,
  submitDisabled = false,
  onSubmit,
  size = "md",
  className,
  hideFooter = false,
  footer,
}: FormDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>

          <div className="py-4 space-y-4">
            {children}
          </div>

          {!hideFooter && (
            <DialogFooter>
              {footer || (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    {cancelLabel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || submitDisabled}
                  >
                    {isSubmitting && <ButtonLoader />}
                    {submitLabel}
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Create dialog variant with sensible defaults
interface CreateDialogProps extends Omit<FormDialogProps, "submitLabel"> {
  submitLabel?: string;
}

export function CreateDialog({ submitLabel = "Créer", ...props }: CreateDialogProps) {
  return <FormDialog submitLabel={submitLabel} {...props} />;
}

// Edit dialog variant
interface EditDialogProps extends Omit<FormDialogProps, "submitLabel"> {
  submitLabel?: string;
}

export function EditDialog({ submitLabel = "Enregistrer", ...props }: EditDialogProps) {
  return <FormDialog submitLabel={submitLabel} {...props} />;
}
