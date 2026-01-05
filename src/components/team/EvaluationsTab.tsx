import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck } from "lucide-react";

export function EvaluationsTab() {
  return (
    <EmptyState
      icon={ClipboardCheck}
      title="Évaluations internes"
      description="Planifiez et suivez les entretiens annuels et objectifs de l'équipe."
      action={{
        label: "Planifier un entretien",
        onClick: () => console.log("Schedule evaluation"),
      }}
    />
  );
}
