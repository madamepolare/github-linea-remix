import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { AttendeesSection } from "../AttendeesSection";
import { AIRewriteButton } from "../AIRewriteButton";
import { AttendeeWithType } from "../types";
import { ReportData } from "@/hooks/useMeetingReportData";
import { ProjectMeeting, MeetingAttendee } from "@/hooks/useChantier";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Lock, Unlock, Copy, FileText, MapPin, Calendar, Hash, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GeneralTabProps {
  meeting: ProjectMeeting;
  project: {
    name: string;
    address?: string | null;
    city?: string | null;
    client?: string | null;
  } | null;
  reportData: ReportData;
  onUpdateReportData: <K extends keyof ReportData>(section: K, value: ReportData[K]) => void;
  localMeeting: ProjectMeeting;
  setLocalMeeting: (meeting: ProjectMeeting) => void;
  attendeesWithType: AttendeeWithType[];
  contacts: Array<{
    id: string;
    name: string;
    company?: { name: string } | null;
    email?: string | null;
    contact_type?: string | null;
  }>;
  companies: Array<{ id: string; name: string; industry?: string | null }>;
  redactorName: string | null;
  onAddMOETeam: () => void;
  previousMeetings: ProjectMeeting[];
  onCopyFromPrevious: (meetingId: string) => void;
}

export function GeneralTab({
  meeting,
  project,
  reportData,
  onUpdateReportData,
  localMeeting,
  setLocalMeeting,
  attendeesWithType,
  contacts,
  companies,
  redactorName,
  onAddMOETeam,
  previousMeetings,
  onCopyFromPrevious,
}: GeneralTabProps) {
  const [headerLocked, setHeaderLocked] = useState(true);
  const [selectedContactToAdd, setSelectedContactToAdd] = useState<string | null>(null);

  const handleAddAttendee = () => {
    if (!selectedContactToAdd) return;
    const contact = contacts.find(c => c.id === selectedContactToAdd);
    if (!contact) return;

    const attendees = [...(localMeeting.attendees || [])];
    if (attendees.some(a => a.contact_id === selectedContactToAdd)) {
      toast.error("Ce contact est déjà dans la liste");
      return;
    }

    attendees.push({
      contact_id: contact.id,
      company_id: (contact as { crm_company_id?: string }).crm_company_id || undefined,
      name: contact.name,
      present: true,
    });
    setLocalMeeting({ ...localMeeting, attendees });
    setSelectedContactToAdd(null);
  };

  const handleRemoveAttendee = (idx: number) => {
    const attendees = [...(localMeeting.attendees || [])];
    attendees.splice(idx, 1);
    setLocalMeeting({ ...localMeeting, attendees });
  };

  const handleTogglePresence = (idx: number) => {
    const attendees = [...(localMeeting.attendees || [])];
    attendees[idx] = { ...attendees[idx], present: !attendees[idx].present };
    setLocalMeeting({ ...localMeeting, attendees });
  };

  const presentCount = attendeesWithType.filter(a => a.present).length;

  return (
    <div className="space-y-4">
      {/* Section 1 - En-tête administratif */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              En-tête administratif
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHeaderLocked(!headerLocked)}
              className="h-7 px-2"
            >
              {headerLocked ? (
                <>
                  <Lock className="h-3.5 w-3.5 mr-1" />
                  Verrouillé
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5 mr-1" />
                  Déverrouillé
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Projet info (read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Opération / Projet
              </Label>
              <div className="p-2 rounded-md bg-muted/50 text-sm font-medium">
                {project?.name || "—"}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Maître d'ouvrage
              </Label>
              <div className="p-2 rounded-md bg-muted/50 text-sm">
                {project?.client || "—"}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Adresse du chantier
            </Label>
            <div className="p-2 rounded-md bg-muted/50 text-sm">
              {project?.address ? `${project.address}${project.city ? `, ${project.city}` : ""}` : "—"}
            </div>
          </div>

          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Numéro du CR
              </Label>
              <div className="p-2 rounded-md bg-muted/50 text-sm font-medium">
                CR n°{localMeeting.meeting_number || 1}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Phase</Label>
              <div className="p-2 rounded-md bg-muted/50 text-sm">
                <Badge variant="secondary">DET</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date de la réunion
              </Label>
              <InlineDatePicker
                value={parseISO(localMeeting.meeting_date)}
                onChange={(date) => date && setLocalMeeting({ ...localMeeting, meeting_date: date.toISOString() })}
                className="w-full"
                disabled={headerLocked}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lieu</Label>
              <Input
                value={localMeeting.location || ""}
                onChange={(e) => setLocalMeeting({ ...localMeeting, location: e.target.value })}
                placeholder="Sur site, bureau..."
                disabled={headerLocked}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Titre de la réunion</Label>
            <Input
              value={localMeeting.title}
              onChange={(e) => setLocalMeeting({ ...localMeeting, title: e.target.value })}
              disabled={headerLocked}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2 - Contexte du chantier */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Contexte du chantier</CardTitle>
            {previousMeetings.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyFromPrevious(previousMeetings[0].id)}
                className="h-7 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Reprendre du CR précédent
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Nature des travaux, phase en cours, état global du chantier
          </p>
          <div className="flex items-start justify-between gap-2">
            <Textarea
              value={reportData.context}
              onChange={(e) => onUpdateReportData("context", e.target.value)}
              placeholder="Description du contexte du chantier..."
              rows={4}
              className="resize-none flex-1"
            />
            <AIRewriteButton
              text={reportData.context}
              onRewrite={(text) => onUpdateReportData("context", text)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3 - Participants */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Participants à la réunion
              <Badge variant="secondary" className="text-xs">
                {presentCount}/{attendeesWithType.length}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <AttendeesSection
            attendees={attendeesWithType}
            contacts={contacts}
            companies={companies}
            redactorName={redactorName}
            selectedContactToAdd={selectedContactToAdd}
            onSelectedContactChange={setSelectedContactToAdd}
            onAddAttendee={handleAddAttendee}
            onRemoveAttendee={handleRemoveAttendee}
            onTogglePresence={handleTogglePresence}
            onAddMOETeam={onAddMOETeam}
          />
        </CardContent>
      </Card>
    </div>
  );
}
