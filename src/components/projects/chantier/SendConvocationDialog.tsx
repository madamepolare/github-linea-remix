import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Loader2, Mail, MapPin, Send, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ProjectMeeting, MeetingAttendee } from "@/hooks/useChantier";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useContacts } from "@/hooks/useContacts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendConvocationDialogProps {
  meeting: ProjectMeeting | null;
  projectName: string;
  projectId: string;
  onClose: () => void;
}

export function SendConvocationDialog({ meeting, projectName, projectId, onClose }: SendConvocationDialogProps) {
  const { createEvent } = useCalendarEvents(projectId);
  const { allContacts } = useContacts();
  const [isSending, setIsSending] = useState(false);
  const [createCalendarEvent, setCreateCalendarEvent] = useState(true);
  const [sendEmails, setSendEmails] = useState(true);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  if (!meeting) return null;

  const attendees = meeting.attendees || [];
  
  // Initialize selected attendees when dialog opens
  if (selectedAttendees.length === 0 && attendees.length > 0) {
    // Pre-select all by default
    const allIds = attendees.map((_, idx) => idx.toString());
    setSelectedAttendees(allIds);
  }

  const toggleAttendee = (index: string) => {
    setSelectedAttendees(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getAttendeeEmail = (attendee: MeetingAttendee) => {
    if (attendee.contact_id) {
      const contact = allContacts.find(c => c.id === attendee.contact_id);
      return contact?.email || null;
    }
    return null;
  };

  const handleSend = async () => {
    setIsSending(true);
    
    try {
      const selectedAttendeesData = selectedAttendees
        .map(idx => attendees[parseInt(idx)])
        .filter(Boolean);
      
      // Create calendar event if requested
      if (createCalendarEvent) {
        const eventAttendees = selectedAttendeesData
          .map(att => {
            const email = getAttendeeEmail(att);
            return email ? { email, name: att.name } : null;
          })
          .filter(Boolean) as Array<{ email: string; name: string }>;

        await createEvent.mutateAsync({
          title: `${meeting.title} - ${projectName}`,
          description: meeting.notes || `Réunion de chantier n°${meeting.meeting_number}`,
          event_type: "meeting",
          start_datetime: meeting.meeting_date,
          end_datetime: new Date(new Date(meeting.meeting_date).getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2h
          location: meeting.location || undefined,
          attendees: eventAttendees,
        });
      }

      // Send emails if requested
      if (sendEmails) {
        const emailsToSend = selectedAttendeesData
          .map(att => ({
            name: att.name,
            email: getAttendeeEmail(att),
          }))
          .filter(att => att.email);

        if (emailsToSend.length > 0) {
          const { error } = await supabase.functions.invoke("send-meeting-convocation", {
            body: {
              meetingTitle: meeting.title,
              meetingNumber: meeting.meeting_number,
              meetingDate: meeting.meeting_date,
              meetingLocation: meeting.location,
              projectName,
              customMessage,
              recipients: emailsToSend,
            },
          });

          if (error) {
            console.error("Error sending emails:", error);
            toast.error("Erreur lors de l'envoi des emails, mais l'événement a été créé");
          } else {
            toast.success(`Convocation envoyée à ${emailsToSend.length} participant(s)`);
          }
        } else {
          toast.success("Événement créé (aucun email disponible pour les participants)");
        }
      } else {
        toast.success("Événement agenda créé");
      }

      onClose();
    } catch (error) {
      console.error("Error sending convocation:", error);
      toast.error("Erreur lors de l'envoi de la convocation");
    } finally {
      setIsSending(false);
    }
  };

  const attendeesWithEmail = attendees.filter(att => getAttendeeEmail(att));

  return (
    <Dialog open={!!meeting} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Envoyer une convocation
          </DialogTitle>
          <DialogDescription>
            Invitez les participants à la réunion et créez un événement dans l'agenda du projet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Meeting Info */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-primary">#{meeting.meeting_number}</span>
              <span>{meeting.title}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(parseISO(meeting.meeting_date), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </span>
              {meeting.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {meeting.location}
                </span>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="calendar" 
                checked={createCalendarEvent}
                onCheckedChange={(checked) => setCreateCalendarEvent(!!checked)}
              />
              <Label htmlFor="calendar" className="font-normal cursor-pointer">
                Créer un événement dans l'agenda projet
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="emails" 
                checked={sendEmails}
                onCheckedChange={(checked) => setSendEmails(!!checked)}
              />
              <Label htmlFor="emails" className="font-normal cursor-pointer">
                Envoyer un email aux participants ({attendeesWithEmail.length} avec email)
              </Label>
            </div>
          </div>

          {/* Participants Selection */}
          {attendees.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants ({selectedAttendees.length}/{attendees.length})
              </Label>
              <ScrollArea className="h-40 border rounded-lg p-2">
                <div className="space-y-1">
                  {attendees.map((att, idx) => {
                    const email = getAttendeeEmail(att);
                    const isSelected = selectedAttendees.includes(idx.toString());
                    
                    return (
                      <div 
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10" : "hover:bg-muted"
                        }`}
                        onClick={() => toggleAttendee(idx.toString())}
                      >
                        <Checkbox checked={isSelected} />
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {att.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1">{att.name}</span>
                        {email ? (
                          <Badge variant="outline" className="text-[10px]">
                            <Mail className="h-2.5 w-2.5 mr-1" />
                            email
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] opacity-50">
                            pas d'email
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Custom Message */}
          {sendEmails && (
            <div className="space-y-2">
              <Label htmlFor="message">Message personnalisé (optionnel)</Label>
              <Textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Ajoutez un message personnalisé à la convocation..."
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Annuler
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending || (!createCalendarEvent && !sendEmails) || selectedAttendees.length === 0}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
