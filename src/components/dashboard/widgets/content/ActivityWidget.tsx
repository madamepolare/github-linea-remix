import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  FolderKanban,
  Users,
  Receipt,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
  id: string;
  type: "project" | "document" | "contact" | "invoice" | "comment" | "task";
  title: string;
  description: string;
  user: string;
  timestamp: Date;
}

// Mock data - replace with real data
const mockActivities: Activity[] = [
  {
    id: "1",
    type: "project",
    title: "Nouveau projet créé",
    description: "Villa Moderne - Paris 16",
    user: "Marie D.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "2",
    type: "document",
    title: "Document ajouté",
    description: "Plans ARQ v2.pdf",
    user: "Pierre L.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "3",
    type: "task",
    title: "Tâche terminée",
    description: "Révision des façades",
    user: "Sophie M.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: "4",
    type: "invoice",
    title: "Facture envoyée",
    description: "FAC-2024-042 - 12 500 €",
    user: "Marie D.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: "5",
    type: "comment",
    title: "Nouveau commentaire",
    description: "Discussion sur le budget",
    user: "Jean P.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

const iconMap = {
  project: FolderKanban,
  document: FileText,
  contact: Users,
  invoice: Receipt,
  comment: MessageSquare,
  task: CheckCircle,
};

const colorMap = {
  project: "bg-info/10 text-info",
  document: "bg-warning/10 text-warning",
  contact: "bg-accent/10 text-accent",
  invoice: "bg-success/10 text-success",
  comment: "bg-muted text-muted-foreground",
  task: "bg-primary/10 text-primary",
};

export function ActivityWidget() {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-3">
        {mockActivities.map((activity) => {
          const Icon = iconMap[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={cn("p-2 rounded-lg shrink-0", colorMap[activity.type])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.user} ·{" "}
                  {formatDistanceToNow(activity.timestamp, {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
