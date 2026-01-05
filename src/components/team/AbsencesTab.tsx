import { EmptyState } from "@/components/ui/empty-state";
import { CalendarOff } from "lucide-react";

export function AbsencesTab() {
  return (
    <EmptyState
      icon={CalendarOff}
      title="Absences & présences"
      description="Gérez les demandes d'absence et consultez le calendrier des présences."
      action={{
        label: "Demander une absence",
        onClick: () => console.log("Request absence"),
      }}
    />
  );
}
