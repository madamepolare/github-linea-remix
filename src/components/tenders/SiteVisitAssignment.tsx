import { useState } from "react";
import { Users, CalendarPlus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import { useTenderCalendarEvents } from "@/hooks/useTenderCalendarEvents";
import { cn } from "@/lib/utils";

interface SiteVisitAssignmentProps {
  tenderId: string;
  tenderTitle: string;
  siteVisitDate: string;
  location?: string | null;
  assignedUserIds: string[];
  onAssignmentChange: (userIds: string[]) => void;
}

export function SiteVisitAssignment({
  tenderId,
  tenderTitle,
  siteVisitDate,
  location,
  assignedUserIds,
  onAssignmentChange,
}: SiteVisitAssignmentProps) {
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const { createTenderEvent } = useTenderCalendarEvents();
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const toggleUser = (userId: string) => {
    const newIds = assignedUserIds.includes(userId)
      ? assignedUserIds.filter((id) => id !== userId)
      : [...assignedUserIds, userId];
    onAssignmentChange(newIds);
  };

  const selectedMembers = teamMembers.filter((m) =>
    assignedUserIds.includes(m.user_id)
  );

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAddToCalendar = async () => {
    if (!siteVisitDate) return;

    setIsAddingToCalendar(true);
    try {
      const endDate = new Date(siteVisitDate);
      endDate.setHours(endDate.getHours() + 2);

      const attendees = selectedMembers.map((m) => ({
        email: m.profile?.email || "",
        name: m.profile?.full_name || undefined,
      })).filter(a => a.email);

      await createTenderEvent.mutateAsync({
        tender_id: tenderId,
        title: `🏗️ Visite de site - ${tenderTitle}`,
        event_type: "meeting",
        start_datetime: siteVisitDate,
        end_datetime: endDate.toISOString(),
        location: location || undefined,
        attendees,
      });
      setAddedToCalendar(true);
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Participants
        </Label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Attribuer ({assignedUserIds.length})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="end">
            <ScrollArea className="max-h-64">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : teamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun membre d'équipe
                </p>
              ) : (
                <div className="space-y-1">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                        assignedUserIds.includes(member.user_id) && "bg-muted"
                      )}
                      onClick={() => toggleUser(member.user_id)}
                    >
                      <Checkbox
                        checked={assignedUserIds.includes(member.user_id)}
                        onCheckedChange={() => toggleUser(member.user_id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.profile?.full_name || "Utilisateur"}
                        </p>
                        {member.profile?.job_title && (
                          <p className="text-xs text-muted-foreground truncate">
                            {member.profile.job_title}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected users display */}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted text-sm"
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={member.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(member.profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-24">
                {member.profile?.full_name || "Utilisateur"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add to calendar button */}
      {siteVisitDate && (
        <Button
          variant={addedToCalendar ? "secondary" : "outline"}
          size="sm"
          className="w-full"
          disabled={isAddingToCalendar || addedToCalendar}
          onClick={handleAddToCalendar}
        >
          {isAddingToCalendar ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : addedToCalendar ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <CalendarPlus className="h-4 w-4 mr-2" />
          )}
          {addedToCalendar
            ? "Ajouté à l'agenda"
            : `Ajouter à l'agenda${selectedMembers.length > 0 ? ` (${selectedMembers.length} participants)` : ""}`}
        </Button>
      )}
    </div>
  );
}
