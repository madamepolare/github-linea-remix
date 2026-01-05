import { EmptyState } from "@/components/ui/empty-state";
import { BookUser } from "lucide-react";

export function DirectoryTab() {
  return (
    <EmptyState
      icon={BookUser}
      title="Annuaire"
      description="Consultez l'organigramme et les coordonnées de tous les membres."
    />
  );
}
