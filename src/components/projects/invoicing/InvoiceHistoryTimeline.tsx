import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useInvoiceHistory, InvoiceHistoryEventType } from "@/hooks/useInvoiceHistory";
import { 
  FileText, 
  Send, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Bell, 
  CreditCard,
  Building2,
  AlertTriangle,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface InvoiceHistoryTimelineProps {
  invoiceId: string | undefined;
}

const EVENT_CONFIG: Record<InvoiceHistoryEventType, {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}> = {
  created: {
    icon: FileText,
    label: "Créée",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-950/30",
  },
  updated: {
    icon: Edit,
    label: "Modifiée",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  sent: {
    icon: Send,
    label: "Envoyée",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 dark:bg-indigo-950/30",
  },
  paid: {
    icon: CheckCircle,
    label: "Payée",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-950/30",
  },
  cancelled: {
    icon: XCircle,
    label: "Annulée",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  credit_note: {
    icon: RefreshCw,
    label: "Avoir créé",
    color: "text-purple-600",
    bgColor: "bg-purple-100 dark:bg-purple-950/30",
  },
  reminder: {
    icon: Bell,
    label: "Relance",
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-950/30",
  },
  payment_received: {
    icon: CreditCard,
    label: "Paiement reçu",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-950/30",
  },
  chorus_submitted: {
    icon: Building2,
    label: "Soumise Chorus Pro",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-950/30",
  },
  chorus_accepted: {
    icon: CheckCircle,
    label: "Acceptée Chorus Pro",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-950/30",
  },
  chorus_rejected: {
    icon: AlertTriangle,
    label: "Rejetée Chorus Pro",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};

export function InvoiceHistoryTimeline({ invoiceId }: InvoiceHistoryTimelineProps) {
  const { events, isLoading } = useInvoiceHistory(invoiceId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Aucun historique disponible</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.updated;
          const Icon = config.icon;
          const isLast = index === events.length - 1;

          return (
            <div key={event.id} className="relative flex gap-3 pl-0">
              {/* Icon */}
              <div className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                config.bgColor
              )}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <span className={cn("font-medium text-sm", config.color)}>
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.event_date), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {event.description}
                  </p>
                )}
                {event.new_value && Object.keys(event.new_value).length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    {Object.entries(event.new_value).map(([key, value]) => (
                      <span key={key} className="mr-3">
                        <span className="font-medium">{key}:</span> {String(value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
