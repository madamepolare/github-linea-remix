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
import { useGmailConnection } from "@/hooks/useGmailConnection";
import { Send, SkipForward, Mail, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PipelineEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: PipelineEntry | null;
  stage: PipelineStage | null;
  pipelineId: string;
  pipelineEmailAiPrompt?: string | null;
  onEmailSent: () => void;
  onSkip: () => void;
}

export function PipelineEmailModal({
  open,
  onOpenChange,
  entry,
  stage,
  pipelineId,
  pipelineEmailAiPrompt,
  onEmailSent,
  onSkip,
}: PipelineEmailModalProps) {
  const { sendEmail } = useContactPipeline(pipelineId);
  const { templates } = useEmailTemplates();
  const gmailConnection = useGmailConnection();
  
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPrompt, setShowAiPrompt] = useState(false);

  // Initialize AI prompt with pipeline default when opening
  useEffect(() => {
    if (open && pipelineEmailAiPrompt && !aiPrompt) {
      setAiPrompt(pipelineEmailAiPrompt);
      setShowAiPrompt(true); // Auto-expand AI section if we have a default prompt
    }
  }, [open, pipelineEmailAiPrompt]);

  // Get recipient info
  const recipientName = entry?.contact?.name || entry?.company?.name || "Contact";
  const companyName = entry?.company?.name;
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

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Veuillez entrer une instruction pour l'IA");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-email-content', {
        body: {
          prompt: aiPrompt,
          recipientName,
          companyName,
          senderName: "L'équipe",
          context: stage?.name ? `Étape du pipeline: ${stage.name}` : undefined,
          tone: 'professional',
          language: 'fr',
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setSubject(data.subject);
      setBody(data.body);
      setShowAiPrompt(false);
      setAiPrompt("");
      toast.success("Email généré avec succès");
    } catch (error) {
      console.error("Error generating email:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!entry || !stage || !recipientEmail) {
      toast.error("Informations manquantes pour l'envoi");
      return;
    }

    setIsSending(true);
    try {
      // Try Gmail first, fall back to Resend
      if (gmailConnection.connected) {
        await gmailConnection.sendEmail({
          to: recipientEmail,
          subject,
          body: body.replace(/\n/g, "<br>"),
          contactId: entry.contact_id || undefined,
          companyId: entry.company_id || undefined,
        });
        toast.success("Email envoyé via Gmail");
      } else {
        await sendEmail.mutateAsync({
          entryId: entry.id,
          stageId: stage.id,
          toEmail: recipientEmail,
          subject,
          bodyHtml: body.replace(/\n/g, "<br>"),
          templateId: stage.email_template_id || undefined,
        });
        toast.success("Email envoyé");
      }
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
            {gmailConnection.connected && (
              <Badge variant="outline" className="ml-2 text-xs">via Gmail</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            L'étape "{stage?.name}" requiert l'envoi d'un email au contact.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* AI Generation Section */}
          <Collapsible open={showAiPrompt} onOpenChange={setShowAiPrompt}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                type="button"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                Générer avec l'IA
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="ai-prompt" className="text-sm">
                  Décrivez le contenu souhaité
                </Label>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Proposer une collaboration pour un projet de rénovation, mentionner notre expertise en architecture d'intérieur..."
                  rows={3}
                  className="resize-none"
                />
              </div>
              <Button
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !aiPrompt.trim()}
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </CollapsibleContent>
          </Collapsible>

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
