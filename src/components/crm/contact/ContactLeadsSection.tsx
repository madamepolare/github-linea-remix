import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Plus, ArrowUpRight } from "lucide-react";
import { Lead } from "@/hooks/useLeads";

interface ContactLeadsSectionProps {
  leads: Lead[];
  contactId: string;
}

export function ContactLeadsSection({ leads, contactId }: ContactLeadsSectionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          Leads
          {leads.length > 0 && (
            <Badge variant="secondary" className="ml-1">{leads.length}</Badge>
          )}
        </CardTitle>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Créer
        </Button>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun lead</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                to={`/crm/leads/${lead.id}`}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                    {lead.title}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                    {lead.estimated_value && (
                      <span className="font-medium text-foreground">
                        {formatCurrency(lead.estimated_value)}
                      </span>
                    )}
                    {lead.probability && (
                      <span>• {lead.probability}%</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lead.stage && (
                    <Badge
                      style={{ backgroundColor: lead.stage.color || "#6366f1" }}
                      className="text-white text-xs shrink-0"
                    >
                      {lead.stage.name}
                    </Badge>
                  )}
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
