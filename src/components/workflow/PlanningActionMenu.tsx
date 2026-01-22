import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Umbrella, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TeamMember } from "@/hooks/useTeamMembers";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlanningActionMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  endDate?: Date | null;
  member: TeamMember | null;
  onSelectTimeEntry: () => void;
  onSelectAbsence: () => void;
}

export function PlanningActionMenu({
  open,
  onOpenChange,
  date,
  endDate,
  member,
  onSelectTimeEntry,
  onSelectAbsence,
}: PlanningActionMenuProps) {
  const isMultiDay = date && endDate && date.getTime() !== endDate.getTime();
  const sortedStart = date && endDate ? (date <= endDate ? date : endDate) : date;
  const sortedEnd = date && endDate ? (date <= endDate ? endDate : date) : date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Que souhaitez-vous ajouter ?</DialogTitle>
          <DialogDescription className="text-center">
            {date && (
              <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
                <Calendar className="h-4 w-4" />
                {isMultiDay && sortedStart && sortedEnd ? (
                  <>
                    <span>
                      {format(sortedStart, "d MMM", { locale: fr })} → {format(sortedEnd, "d MMM", { locale: fr })}
                    </span>
                  </>
                ) : (
                  date && <span>{format(date, "EEEE d MMMM", { locale: fr })}</span>
                )}
                {member?.profile?.full_name && (
                  <Badge variant="outline" className="ml-1">
                    {member.profile.full_name.split(" ")[0]}
                  </Badge>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-4">
          <Button
            variant="outline"
            className={cn(
              "h-auto py-6 flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all"
            )}
            onClick={() => {
              onOpenChange(false);
              onSelectTimeEntry();
            }}
          >
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium">Ajouter du temps</span>
          </Button>

          <Button
            variant="outline"
            className={cn(
              "h-auto py-6 flex flex-col items-center gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all"
            )}
            onClick={() => {
              onOpenChange(false);
              onSelectAbsence();
            }}
          >
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Umbrella className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-sm font-medium">Ajouter une absence</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
