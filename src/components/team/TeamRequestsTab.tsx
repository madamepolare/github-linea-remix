import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquarePlus } from "lucide-react";

export function TeamRequestsTab() {
  return (
    <EmptyState
      icon={MessageSquarePlus}
      title="Demandes d'équipe"
      description="Soumettez des demandes de ressources, formations ou équipements."
      action={{
        label: "Nouvelle demande",
        onClick: () => console.log("New request"),
      }}
    />
  );
}
