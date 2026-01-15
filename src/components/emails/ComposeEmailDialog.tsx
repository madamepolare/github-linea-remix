// This file re-exports UnifiedEmailDialog for backward compatibility
// All email sending should use UnifiedEmailDialog with AI helper

import { UnifiedEmailDialog, EntityType } from "./UnifiedEmailDialog";

export type { EntityType };

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType?: EntityType;
  entityId?: string;
  defaultTo?: string | string[];
  defaultSubject?: string;
  defaultBody?: string;
  replyToEmailId?: string;
  onSuccess?: () => void;
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  defaultTo,
  defaultSubject = "",
  defaultBody = "",
  replyToEmailId,
  onSuccess,
}: ComposeEmailDialogProps) {
  return (
    <UnifiedEmailDialog
      open={open}
      onOpenChange={onOpenChange}
      entityType={entityType}
      entityId={entityId}
      defaultTo={defaultTo}
      defaultSubject={defaultSubject}
      defaultBody={defaultBody}
      replyToEmailId={replyToEmailId}
      onSuccess={onSuccess}
    />
  );
}
