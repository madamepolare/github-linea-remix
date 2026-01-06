import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PipelineStage } from "@/hooks/useCRMPipelines";
import { PipelineEntry, useContactPipeline } from "@/hooks/useContactPipeline";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { Send, SkipForward, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PipelineEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: PipelineEntry | null;
  stage: PipelineStage | null;
  pipelineId: string;
  onEmailSent: () => void;
  onSkip: () => void;
}

export function PipelineEmailModal({
  open,
  onOpenChange,
  entry,
  stage,
  pipelineId,
  onEmailSent,
  onSkip,
}: PipelineEmailModalProps) {
  const { sendEmail } = useContactPipeline(pipelineId);
  const { templates } = useEmailTemplates();
  
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Get recipient info
  const recipientName = entry?.contact?.name || entry?.company?.name || "Contact";
  const recipientEmail = entry?.contact?.email || entry?.company?.email;

  // Load template when stage changes
  useEffect(() => {
    if (stage?.email_template_id && templates) {
      const template = templates.find((t) => t.id === stage.email_template_id);
      if (template) {
        // Replace variables in template
        let processedSubject = template.subject;
        let processedBody = template.body_html;

        const variables: Record<string, string> = {
          contact_name: entry?.contact?.name || "",
          company_name: entry?.company?.name || "",
          sender_name: "L'équipe",
        };

        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, "g");
          processedSubject = processedSubject.replace(regex, value);
          processedBody = processedBody.replace(regex, value);
        });

        setSubject(processedSubject);
        // Convert HTML to plain text for textarea
        const plainBody = processedBody
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();
        setBody(plainBody);
      }
    } else {
      // Default template
      setSubject(`À propos de notre échange - ${recipientName}`);
      setBody(`Bonjour ${recipientName},\n\n[Votre message ici]\n\nCordialement,\nL'équipe`);
    }
  }, [stage, templates, entry, recipientName]);

  const handleSend = async () => {
    if (!entry || !stage || !recipientEmail) {
      toast.error("Informations manquantes pour l'envoi");
      return;
    }

    setIsSending(true);
    try {
      await sendEmail.mutateAsync({
        entryId: entry.id,
        stageId: stage.id,
        toEmail: recipientEmail,
        subject,
        bodyHtml: body.replace(/\n/g, "<br>"),
        templateId: stage.email_template_id || undefined,
      });
      toast.success("Email envoyé");
      onEmailSent();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer un email
          </DialogTitle>
          <DialogDescription>
            L'étape "{stage?.name}" requiert l'envoi d'un email au contact.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient */}
          <div className="space-y-2">
            <Label>Destinataire</Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{recipientName}</Badge>
              {recipientEmail ? (
                <span className="text-sm text-muted-foreground">
                  {recipientEmail}
                </span>
              ) : (
                <div className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Pas d'email renseigné
                </div>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Objet</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'email"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Contenu de l'email"
              rows={10}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isSending}
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Passer sans envoyer
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !recipientEmail}
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Envoi..." : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
