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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGmailConnection } from "@/hooks/useGmailConnection";
import { Contact } from "@/hooks/useContacts";
import { CRMCompanyEnriched } from "@/hooks/useCRMCompanies";
import { 
  Send, 
  Mail, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Building2,
  User
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
  avatarUrl?: string | null;
  type: "contact" | "company";
}

interface CRMBulkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts?: Contact[];
  companies?: CRMCompanyEnriched[];
  entityType: "contacts" | "companies";
  onComplete?: () => void;
}

interface SendResult {
  recipientId: string;
  success: boolean;
  error?: string;
}

export function CRMBulkEmailDialog({
  open,
  onOpenChange,
  contacts = [],
  companies = [],
  entityType,
  onComplete,
}: CRMBulkEmailDialogProps) {
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

  // Build recipients from contacts or companies
  const recipients: Recipient[] = useMemo(() => {
    if (entityType === "contacts") {
      return contacts
        .filter(c => c.email)
        .map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          companyName: (c as any).crm_company?.name,
          avatarUrl: c.avatar_url,
          type: "contact" as const,
        }));
    } else {
      return companies
        .filter(c => c.email)
        .map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          avatarUrl: c.logo_url,
          type: "company" as const,
        }));
    }
  }, [contacts, companies, entityType]);

  // Pre-select all recipients with email
  useEffect(() => {
    if (open) {
      setSelectedRecipients(new Set(recipients.map(r => r.id)));
      setSendResults([]);
      setSendProgress(0);
    }
  }, [open, recipients]);

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
          recipientName: "{{nom_destinataire}}",
          companyName: entityType === "companies" ? "{{nom_entreprise}}" : undefined,
          senderName: "L'équipe",
          context: `Email groupé CRM à ${selectedRecipients.size} ${entityType === "contacts" ? "contacts" : "entreprises"}`,
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
      .replace(/\{\{nom_entreprise\}\}/g, recipient.companyName || recipient.name)
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

    if (!subject.trim() || !body.trim()) {
      toast.error("Veuillez remplir le sujet et le contenu de l'email");
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
        const personalizedSubject = personalizeContent(subject, recipient);
        const personalizedBody = personalizeContent(body, recipient);

        await gmailConnection.sendEmail({
          to: recipient.email!,
          subject: personalizedSubject,
          body: personalizedBody.replace(/\n/g, "<br>"),
          contactId: recipient.type === "contact" ? recipient.id : undefined,
          companyId: recipient.type === "company" ? recipient.id : undefined,
        });

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

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecipients(new Set(recipients.map(r => r.id)));
    } else {
      setSelectedRecipients(new Set());
    }
  };

  const recipientsWithoutEmail = entityType === "contacts" 
    ? contacts.filter(c => !c.email).length
    : companies.filter(c => !c.email).length;

  const getResultIcon = (recipientId: string) => {
    const result = sendResults.find(r => r.recipientId === recipientId);
    if (!result) return null;
    if (result.success) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const entityLabel = entityType === "contacts" ? "contacts" : "entreprises";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email groupé ({recipients.length} {entityLabel})
          </DialogTitle>
          <DialogDescription>
            Envoyez un email personnalisé à plusieurs {entityLabel} en une seule fois
          </DialogDescription>
        </DialogHeader>

        {!gmailConnection.connected && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Gmail non connecté</p>
              <p className="text-amber-700 dark:text-amber-300">
                Connectez votre compte Gmail dans les paramètres pour envoyer des emails.
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Recipients */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Destinataires ({selectedRecipients.size}/{recipients.length})
                  </span>
                </div>
                {recipientsWithoutEmail > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {recipientsWithoutEmail} sans email
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="border rounded-lg p-2 space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Checkbox
                    checked={selectedRecipients.size === recipients.length && recipients.length > 0}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-xs text-muted-foreground">Tout sélectionner</span>
                </div>
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {recipients.map((recipient) => (
                      <div 
                        key={recipient.id} 
                        className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selectedRecipients.has(recipient.id)}
                          onCheckedChange={() => toggleRecipient(recipient.id)}
                          disabled={isSending}
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={recipient.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {recipient.type === "contact" ? (
                              <User className="h-3 w-3" />
                            ) : (
                              <Building2 className="h-3 w-3" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{recipient.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{recipient.email}</p>
                        </div>
                        {recipient.companyName && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {recipient.companyName}
                          </Badge>
                        )}
                        {getResultIcon(recipient.id)}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* AI Generation */}
          <Collapsible open={showAiPrompt} onOpenChange={setShowAiPrompt}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                Générer avec l'IA
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-2">
                <Textarea
                  placeholder="Décrivez l'email que vous souhaitez envoyer (ex: 'Un email de suivi professionnel pour prendre des nouvelles')"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={handleGenerateWithAI} 
                  disabled={isGenerating || !aiPrompt.trim()}
                  size="sm"
                  className="w-full"
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
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Email content */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Sujet de l'email"
                disabled={isSending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Contenu de l'email...&#10;&#10;Variables disponibles:&#10;{{nom_destinataire}} - Nom du destinataire&#10;{{nom_entreprise}} - Nom de l'entreprise"
                className="min-h-[150px]"
                disabled={isSending}
              />
              <p className="text-xs text-muted-foreground">
                Utilisez {"{{nom_destinataire}}"} et {"{{nom_entreprise}}"} pour personnaliser
              </p>
            </div>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Annuler
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={
              isSending || 
              !gmailConnection.connected || 
              selectedRecipients.size === 0 ||
              !subject.trim() ||
              !body.trim()
            }
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer ({selectedRecipients.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
