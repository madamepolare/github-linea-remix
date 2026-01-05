import { EmptyState } from "@/components/ui/empty-state";
import { Clock } from "lucide-react";

export function TimeTrackingTab() {
  return (
    <EmptyState
      icon={Clock}
      title="Suivi des temps"
      description="Saisissez et consultez vos temps passés sur les différents projets."
      action={{
        label: "Saisir du temps",
        onClick: () => console.log("Add time entry"),
      }}
    />
  );
}
