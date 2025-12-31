import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, Calendar, User } from "lucide-react";
import { Lead } from "@/hooks/useLeads";

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailSheet({ lead, open, onOpenChange }: LeadDetailSheetProps) {
  if (!lead) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{lead.title}</SheetTitle>
          {lead.stage && (
            <Badge style={{ backgroundColor: lead.stage.color || "#6366f1", color: "white" }}>
              {lead.stage.name}
            </Badge>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {lead.company && (
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span>{lead.company.name}</span>
            </div>
          )}
          {lead.estimated_value && (
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span>{formatCurrency(lead.estimated_value)}</span>
              {lead.probability && <span className="text-muted-foreground">({lead.probability}%)</span>}
            </div>
          )}
          {lead.next_action && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>{lead.next_action}</span>
            </div>
          )}
          {lead.description && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">{lead.description}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
