import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { ComposeEmailDialog, EntityType } from "./ComposeEmailDialog";
import { useGmailConnection } from "@/hooks/useGmailConnection";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface QuickEmailButtonProps {
  entityType: EntityType;
  entityId: string;
  recipientEmail?: string;
  recipientName?: string;
  defaultSubject?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function QuickEmailButton({
  entityType,
  entityId,
  recipientEmail,
  recipientName,
  defaultSubject,
  variant = "outline",
  size = "sm",
  showLabel = true,
  className,
}: QuickEmailButtonProps) {
  const [composeOpen, setComposeOpen] = useState(false);
  const { connected } = useGmailConnection();

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={() => setComposeOpen(true)}
            className={className}
          >
            <Mail className="h-4 w-4" />
            {showLabel && <span className="ml-2">Email</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {connected 
            ? recipientEmail 
              ? `Envoyer un email à ${recipientName || recipientEmail}`
              : "Envoyer un email"
            : "Gmail non connecté - Cliquez pour configurer"
          }
        </TooltipContent>
      </Tooltip>

      <ComposeEmailDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        entityType={entityType}
        entityId={entityId}
        defaultTo={recipientEmail}
        defaultSubject={defaultSubject}
      />
    </>
  );
}
