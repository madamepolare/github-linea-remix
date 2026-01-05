import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";

export function TeamUsersTab() {
  return (
    <EmptyState
      icon={Users}
      title="Gestion des utilisateurs"
      description="Gérez les membres de votre équipe, leurs rôles et permissions."
      action={{
        label: "Inviter un membre",
        onClick: () => console.log("Invite member"),
      }}
    />
  );
}
