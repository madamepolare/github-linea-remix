import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { PipelineEntry } from "@/hooks/useContactPipeline";
import { useGmailConnection } from "@/hooks/useGmailConnection";
import { 
  Send, 
  Mail, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Recipient {
  id: string;
  name: string;
  email: string | null;
  companyName?: string;
  entryId?: string;
}

interface BulkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: PipelineEntry[];
  pipelineId: string;
  pipelineName?: string;
  onComplete?: () => void;
}

interface SendResult {
  recipientId: string;
  success: boolean;
  error?: string;
}

export function BulkEmailDialog({
  open,
  onOpenChange,
  entries,
  pipelineId,
  pipelineName,
  onComplete,
}: BulkEmailDialogProps) {
  const gmailConnection = useGmailConnection();
  
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set());
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [sendProgress, setSendProgress] = useState(0);

  // Extract recipients from entries
  const recipients: Recipient[] = useMemo(() => {
    const result: Recipient[] = [];
    for (const entry of entries) {
      const contact = entry.contact;
      const company = entry.company;
      if (contact?.email) {
        result.push({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          companyName: company?.name,
          entryId: entry.id,
        });
      } else if (company?.email) {
        result.push({
          id: company.id,
          name: company.name,
          email: company.email,
          entryId: entry.id,
        });
      }
    }
    return result;
  }, [entries]);

  // Initialize selection with all valid recipients
  useEffect(() => {
    if (open) {
      setSelectedRecipients(new Set(recipients.map((r) => r.id)));
      setSendResults([]);
      setSendProgress(0);
    }
  }, [open, recipients]);

  const toggleRecipient = (id: string) => {
    setSelectedRecipients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRecipients.size === recipients.length) {
      setSelectedRecipients(new Set());
    } else {
      setSelectedRecipients(new Set(recipients.map((r) => r.id)));
    }
  };

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
          recipientName: "{{nom_destinataire}}", // Placeholder for personalization
          companyName: "{{nom_entreprise}}",
          senderName: "L'équipe",
          context: pipelineName ? `Pipeline de prospection: ${pipelineName}. Email groupé à ${selectedRecipients.size} destinataires.` : undefined,
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

  const personalizeContent = (template: string, recipient: Recipient): string => {
    return template
      .replace(/\{\{nom_destinataire\}\}/g, recipient.name)
      .replace(/\{\{nom_entreprise\}\}/g, recipient.companyName || "")
      .replace(/Bonjour \{\{nom_destinataire\}\}/g, `Bonjour ${recipient.name}`);
  };

  const handleSend = async () => {
    if (!gmailConnection.connected) {
      toast.error("Veuillez connecter votre Gmail dans les paramètres");
      return;
    }

    const selectedList = recipients.filter((r) => selectedRecipients.has(r.id));
    if (selectedList.length === 0) {
      toast.error("Aucun destinataire sélectionné");
      return;
    }

    setIsSending(true);
    setSendResults([]);
    setSendProgress(0);

    const results: SendResult[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedList.length; i++) {
      const recipient = selectedList[i];
      
      try {
        // Personalize content for this recipient
        const personalizedSubject = personalizeContent(subject, recipient);
        const personalizedBody = personalizeContent(body, recipient);

        await gmailConnection.sendEmail({
          to: recipient.email!,
          subject: personalizedSubject,
          body: personalizedBody.replace(/\n/g, "<br>"),
          sendVia: 'workspace',
        });

        // Update last_email_sent_at for the entry
        if (recipient.entryId) {
          await supabase
            .from("contact_pipeline_entries")
            .update({ last_email_sent_at: new Date().toISOString() })
            .eq("id", recipient.entryId);
        }

        results.push({ recipientId: recipient.id, success: true });
        successCount++;
      } catch (error) {
        console.error(`Error sending to ${recipient.email}:`, error);
        results.push({ 
          recipientId: recipient.id, 
          success: false, 
          error: error instanceof Error ? error.message : "Erreur d'envoi" 
        });
        errorCount++;
      }

      setSendResults([...results]);
      setSendProgress(((i + 1) / selectedList.length) * 100);

      // Small delay between emails to avoid rate limiting
      if (i < selectedList.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setIsSending(false);

    if (errorCount === 0) {
      toast.success(`${successCount} email${successCount > 1 ? 's' : ''} envoyé${successCount > 1 ? 's' : ''} avec succès`);
      onComplete?.();
      onOpenChange(false);
    } else {
      toast.warning(`${successCount} envoyé${successCount > 1 ? 's' : ''}, ${errorCount} erreur${errorCount > 1 ? 's' : ''}`);
    }
  };

  const getRecipientResult = (id: string): SendResult | undefined => {
    return sendResults.find((r) => r.recipientId === id);
  };

  const invalidCount = entries.length - recipients.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email groupé
            {gmailConnection.connected && (
              <Badge variant="outline" className="ml-2 text-xs">via Gmail</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Envoyez un email personnalisé à plusieurs contacts en même temps.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4 py-2">
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
                  placeholder="Ex: Proposition de collaboration, présentation de nos services d'architecture..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  L'IA générera un template avec des variables (nom, entreprise) qui seront personnalisées pour chaque destinataire.
                </p>
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

          {/* Recipients */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Destinataires ({selectedRecipients.size}/{recipients.length})
              </Label>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedRecipients.size === recipients.length ? "Désélectionner tout" : "Sélectionner tout"}
              </Button>
            </div>
            
            {invalidCount > 0 && (
              <div className="flex items-center gap-1 text-amber-600 text-xs">
                <AlertCircle className="h-3 w-3" />
                {invalidCount} entrée{invalidCount > 1 ? 's' : ''} sans email
              </div>
            )}

            <ScrollArea className="h-32 rounded-md border p-2">
              <div className="space-y-1">
                {recipients.map((recipient) => {
                  const result = getRecipientResult(recipient.id);
                  return (
                    <div
                      key={recipient.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedRecipients.has(recipient.id)}
                        onCheckedChange={() => toggleRecipient(recipient.id)}
                        disabled={isSending}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{recipient.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{recipient.email}</p>
                      </div>
                      {recipient.companyName && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {recipient.companyName}
                        </Badge>
                      )}
                      {result && (
                        result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Objet</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'email"
              disabled={isSending}
            />
          </div>

          {/* Body */}
          <div className="space-y-2 flex-1 min-h-0">
            <Label htmlFor="body">
              Message
              <span className="text-xs text-muted-foreground ml-2">
                Utilisez {"{{nom_destinataire}}"} et {"{{nom_entreprise}}"} pour personnaliser
              </span>
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Contenu de l'email..."
              rows={8}
              className="resize-none"
              disabled={isSending}
            />
          </div>

          {/* Progress */}
          {isSending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Envoi en cours...</span>
                <span>{Math.round(sendProgress)}%</span>
              </div>
              <Progress value={sendProgress} />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || selectedRecipients.size === 0 || !subject.trim() || !body.trim() || !gmailConnection.connected}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer à {selectedRecipients.size} contact{selectedRecipients.size > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
