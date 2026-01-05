import { EmptyState } from "@/components/ui/empty-state";
import { UserPlus } from "lucide-react";

export function RecruitmentTab() {
  return (
    <EmptyState
      icon={UserPlus}
      title="Recrutement"
      description="Gérez vos offres d'emploi et suivez les candidatures."
      action={{
        label: "Créer une offre",
        onClick: () => console.log("Create job offer"),
      }}
    />
  );
}
