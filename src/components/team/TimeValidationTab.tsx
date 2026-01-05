import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle } from "lucide-react";

export function TimeValidationTab() {
  return (
    <EmptyState
      icon={CheckCircle}
      title="Validation des temps"
      description="Validez les temps saisis par les membres de votre équipe."
    />
  );
}
