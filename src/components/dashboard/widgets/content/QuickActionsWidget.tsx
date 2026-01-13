import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  FolderPlus,
  UserPlus,
  FileText,
  Receipt,
  Trophy,
  Megaphone,
} from "lucide-react";

const actions = [
  { id: "project", label: "Nouveau projet", icon: FolderPlus, path: "/projects", color: "bg-info/10 text-info" },
  { id: "contact", label: "Nouveau contact", icon: UserPlus, path: "/crm", color: "bg-accent/10 text-accent" },
  { id: "quote", label: "Nouveau devis", icon: FileText, path: "/commercial", color: "bg-success/10 text-success" },
  { id: "invoice", label: "Nouvelle facture", icon: Receipt, path: "/invoicing", color: "bg-warning/10 text-warning" },
  { id: "tender", label: "Nouvel AO", icon: Trophy, path: "/tenders", color: "bg-destructive/10 text-destructive" },
  { id: "campaign", label: "Nouvelle campagne", icon: Megaphone, path: "/campaigns", color: "bg-primary/10 text-primary" },
];

export function QuickActionsWidget() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => navigate(action.path)}
        >
          <div className={`p-1 rounded ${action.color}`}>
            <action.icon className="h-3.5 w-3.5" />
          </div>
          {action.label}
        </Button>
      ))}
    </div>
  );
}
