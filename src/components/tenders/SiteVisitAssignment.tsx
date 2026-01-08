import { useState, useEffect } from "react";
import { Users, CalendarPlus, Check, Loader2, User, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTenderCalendarEvents } from "@/hooks/useTenderCalendarEvents";
import { cn } from "@/lib/utils";

interface SiteVisitAssignmentProps {
  tenderId: string;
  tenderTitle: string;
  siteVisitDate: string;
  siteVisitRequired?: boolean;
  location?: string | null;
  projectAddress?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  assignedUserIds: string[];
  onAssignmentChange: (userIds: string[]) => void;
  onContactChange?: (contact: {
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  }) => void;
}

export function SiteVisitAssignment({
  tenderId,
  tenderTitle,
  siteVisitDate,
  siteVisitRequired,
  location,
  projectAddress,
  contactName,
  contactEmail,
  contactPhone,
  assignedUserIds,
  onAssignmentChange,
  onContactChange,
}: SiteVisitAssignmentProps) {
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const { syncSiteVisit } = useTenderCalendarEvents(tenderId);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Local state for contact fields
  const [localContactName, setLocalContactName] = useState(contactName || "");
  const [localContactEmail, setLocalContactEmail] = useState(contactEmail || "");
  const [localContactPhone, setLocalContactPhone] = useState(contactPhone || "");
  const [localAddress, setLocalAddress] = useState(location || "");
  const [useProjectAddress, setUseProjectAddress] = useState(location === projectAddress && !!projectAddress);

  // Sync local state with props
  useEffect(() => {
    setLocalContactName(contactName || "");
    setLocalContactEmail(contactEmail || "");
    setLocalContactPhone(contactPhone || "");
    setLocalAddress(location || "");
  }, [contactName, contactEmail, contactPhone, location]);

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

  const handleUseProjectAddress = (checked: boolean) => {
    setUseProjectAddress(checked);
    if (checked && projectAddress) {
      setLocalAddress(projectAddress);
      onContactChange?.({
        name: localContactName || null,
        email: localContactEmail || null,
        phone: localContactPhone || null,
        address: projectAddress,
      });
    }
  };

  const handleContactBlur = () => {
    onContactChange?.({
      name: localContactName || null,
      email: localContactEmail || null,
      phone: localContactPhone || null,
      address: localAddress || null,
    });
  };

  const handleAddToCalendar = async () => {
    if (!siteVisitDate) return;

    setIsAddingToCalendar(true);
    try {
      await syncSiteVisit({
        id: tenderId,
        title: tenderTitle,
        location: localAddress || location,
        site_visit_date: siteVisitDate,
        site_visit_required: siteVisitRequired ?? false,
        site_visit_contact_name: localContactName || contactName,
        site_visit_contact_email: localContactEmail || contactEmail,
        site_visit_contact_phone: localContactPhone || contactPhone,
        site_visit_assigned_users: assignedUserIds,
      });
      setAddedToCalendar(true);
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Contact MOA Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">
          Contact MOA pour la visite
        </Label>
        
        <div className="grid gap-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom du contact"
              value={localContactName}
              onChange={(e) => setLocalContactName(e.target.value)}
              onBlur={handleContactBlur}
              className="pl-10"
            />
          </div>
          
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email du contact"
              value={localContactEmail}
              onChange={(e) => setLocalContactEmail(e.target.value)}
              onBlur={handleContactBlur}
              className="pl-10"
            />
          </div>
          
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="tel"
              placeholder="Téléphone du contact"
              value={localContactPhone}
              onChange={(e) => setLocalContactPhone(e.target.value)}
              onBlur={handleContactBlur}
              className="pl-10"
            />
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Adresse de la visite"
                value={localAddress}
                onChange={(e) => {
                  setLocalAddress(e.target.value);
                  setUseProjectAddress(false);
                }}
                onBlur={handleContactBlur}
                className="pl-10"
                disabled={useProjectAddress}
              />
            </div>
            {projectAddress && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use-project-address"
                  checked={useProjectAddress}
                  onCheckedChange={handleUseProjectAddress}
                />
                <label
                  htmlFor="use-project-address"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Utiliser l'adresse du projet
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participants Section */}
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
