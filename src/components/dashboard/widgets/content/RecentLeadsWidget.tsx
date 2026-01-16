import { useLeads } from "@/hooks/useLeads";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Calendar, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function RecentLeadsWidget() {
  const { leads, isLoading } = useLeads();
  const navigate = useNavigate();

  const recentLeads = leads
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const formatCurrency = (value: number | null) => {
    if (!value) return "—";
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M €`;
    if (value >= 1000) return `${Math.round(value / 1000)}k €`;
    return `${value} €`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (recentLeads.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Aucune opportunité
      </div>
    );
  }

  return (
    <ScrollArea className="h-full -mx-1 px-1">
      <div className="space-y-1">
        {recentLeads.map((lead) => {
          const stageColor = lead.stage?.color || '#6b7280';
          
          return (
            <div
              key={lead.id}
              onClick={() => navigate(`/crm/leads/${lead.id}`)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
            >
              {/* Company/Lead icon */}
              <div 
                className="h-8 w-8 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${stageColor}20` }}
              >
                {lead.company?.logo_url ? (
                  <img 
                    src={lead.company.logo_url} 
                    alt="" 
                    className="h-6 w-6 rounded object-cover"
                  />
                ) : (
                  <Building2 className="h-4 w-4" style={{ color: stageColor }} />
                )}
              </div>

              {/* Lead info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {lead.title}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {lead.company?.name && (
                    <span className="truncate max-w-[120px]">{lead.company.name}</span>
                  )}
                  {lead.stage?.name && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span 
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ 
                          backgroundColor: `${stageColor}15`,
                          color: stageColor 
                        }}
                      >
                        {lead.stage.name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Value */}
              <div className="text-right shrink-0">
                <div className="text-sm font-medium tabular-nums">
                  {formatCurrency(lead.estimated_value)}
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                  <Calendar className="h-2.5 w-2.5" />
                  {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: fr })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
