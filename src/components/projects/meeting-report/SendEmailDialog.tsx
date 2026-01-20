import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Mail, Send, AlertCircle, Settings } from "lucide-react";
import { EmailRecipient } from "./types";
import { useGmailConnection } from "@/hooks/useGmailConnection";
import { Link } from "react-router-dom";

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: EmailRecipient[];
  defaultSubject: string;
  projectName: string;
  projectId?: string;
  onSend: (recipients: string[], subject: string, message: string) => Promise<void>;
}

export function SendEmailDialog({
  open,
  onOpenChange,
  recipients,
  defaultSubject,
  projectName,
  projectId,
  onSend,
}: SendEmailDialogProps) {
  const gmailConnection = useGmailConnection();
  const [selectedRecipients, setSelectedRecipients] = useState<EmailRecipient[]>([]);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedRecipients(recipients.map(r => ({ ...r, selected: true })));
      setSubject(defaultSubject);
      setMessage(`Bonjour,\n\nVeuillez trouver ci-joint le compte rendu de réunion du projet ${projectName}.\n\nCordialement`);
    }
  }, [open, recipients, defaultSubject, projectName]);

  const toggleRecipient = (email: string) => {
    setSelectedRecipients(prev =>
      prev.map(r => r.email === email ? { ...r, selected: !r.selected } : r)
    );
  };

  const selectedCount = selectedRecipients.filter(r => r.selected).length;

  const handleSend = async () => {
    const emails = selectedRecipients.filter(r => r.selected).map(r => r.email);
    if (emails.length === 0) return;

    setIsSending(true);
    try {
      // Always use workspace Gmail
      await gmailConnection.sendEmail({
        to: emails,
        subject,
        body: message.replace(/\n/g, "<br>"),
        projectId,
        sendVia: 'workspace',
      });
      onOpenChange(false);
    } finally {
      setIsSending(false);
    }
  };

  const typeLabels: Record<string, { label: string; color: string }> = {
    moa: { label: "MOA", color: "bg-blue-500" },
    bet: { label: "BET", color: "bg-purple-500" },
    entreprise: { label: "Entreprise", color: "bg-orange-500" },
    archi: { label: "Architecte", color: "bg-green-500" },
    other: { label: "Autre", color: "bg-gray-500" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer le compte rendu
            {gmailConnection.connected && (
              <Badge variant="outline" className="ml-2 text-xs">via Gmail</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {!gmailConnection.connected && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="text-amber-800 dark:text-amber-200">
                Gmail non connecté - envoi via Resend
              </p>
              <Button asChild variant="link" size="sm" className="h-auto p-0 text-amber-700">
                <Link to="/settings?tab=emails">Connecter Gmail</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Destinataires ({selectedCount} sélectionnés)</Label>
            <ScrollArea className="h-[180px] rounded-md border p-2">
              <div className="space-y-2">
                {selectedRecipients.map((recipient) => {
                  const typeInfo = typeLabels[recipient.type] || typeLabels.other;
                  return (
                    <div
                      key={recipient.email}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={recipient.selected}
                        onCheckedChange={() => toggleRecipient(recipient.email)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{recipient.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{recipient.email}</p>
                      </div>
                      <Badge variant="secondary" className={`text-xs text-white ${typeInfo.color}`}>
                        {typeInfo.label}
                      </Badge>
                    </div>
                  );
                })}
                {selectedRecipients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun destinataire avec email
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label>Objet</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'email..."
            />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={selectedCount === 0 || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Envoyer ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
