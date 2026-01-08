import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Mail, Send, ChevronDown, ChevronUp, AlertCircle, X, Plus, Settings } from "lucide-react";
import { useGmailConnection } from "@/hooks/useGmailConnection";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { useContacts } from "@/hooks/useContacts";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export type EntityType = 'project' | 'tender' | 'lead' | 'contact' | 'company';

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType?: EntityType;
  entityId?: string;
  defaultTo?: string | string[];
  defaultSubject?: string;
  defaultBody?: string;
  replyToEmailId?: string;
  onSuccess?: () => void;
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  defaultTo,
  defaultSubject = "",
  defaultBody = "",
  replyToEmailId,
  onSuccess,
}: ComposeEmailDialogProps) {
  const gmailConnection = useGmailConnection();
  const { templates } = useEmailTemplates();
  const { contacts } = useContacts();

  const gmailStatus = { connected: gmailConnection.connected, email: gmailConnection.email };
  const gmailLoading = gmailConnection.isLoading;

  const [to, setTo] = useState<string[]>([]);
  const [toInput, setToInput] = useState("");
  const [cc, setCc] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [bcc, setBcc] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [contactSuggestions, setContactSuggestions] = useState<typeof contacts>([]);

  // Initialize with defaults when dialog opens
  useEffect(() => {
    if (open) {
      const defaultToArray = Array.isArray(defaultTo) ? defaultTo : defaultTo ? [defaultTo] : [];
      setTo(defaultToArray);
      setSubject(defaultSubject);
      setBody(defaultBody);
      setCc([]);
      setBcc([]);
      setSelectedTemplate("");
    }
  }, [open, defaultTo, defaultSubject, defaultBody]);

  // Contact autocomplete
  useEffect(() => {
    if (toInput.length >= 2) {
      const filtered = contacts.filter(c => 
        c.email && (
          c.email.toLowerCase().includes(toInput.toLowerCase()) ||
          c.name.toLowerCase().includes(toInput.toLowerCase())
        )
      ).slice(0, 5);
      setContactSuggestions(filtered);
    } else {
      setContactSuggestions([]);
    }
  }, [toInput, contacts]);

  const handleAddEmail = (email: string, field: 'to' | 'cc' | 'bcc') => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    switch (field) {
      case 'to':
        if (!to.includes(cleanEmail)) {
          setTo([...to, cleanEmail]);
        }
        setToInput("");
        break;
      case 'cc':
        if (!cc.includes(cleanEmail)) {
          setCc([...cc, cleanEmail]);
        }
        setCcInput("");
        break;
      case 'bcc':
        if (!bcc.includes(cleanEmail)) {
          setBcc([...bcc, cleanEmail]);
        }
        setBccInput("");
        break;
    }
    setContactSuggestions([]);
  };

  const handleRemoveEmail = (email: string, field: 'to' | 'cc' | 'bcc') => {
    switch (field) {
      case 'to':
        setTo(to.filter(e => e !== email));
        break;
      case 'cc':
        setCc(cc.filter(e => e !== email));
        break;
      case 'bcc':
        setBcc(bcc.filter(e => e !== email));
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: 'to' | 'cc' | 'bcc') => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const input = field === 'to' ? toInput : field === 'cc' ? ccInput : bccInput;
      handleAddEmail(input, field);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body_html);
    }
  };

  const handleSend = async () => {
    if (to.length === 0) {
      toast.error("Veuillez ajouter au moins un destinataire");
      return;
    }

    if (!subject.trim()) {
      toast.error("Veuillez saisir un objet");
      return;
    }

    if (!gmailStatus.connected) {
      toast.error("Gmail non connecté. Veuillez connecter votre compte dans les paramètres.");
      return;
    }

    setIsSending(true);
    try {
      // Build entity context
      const entityContext: Record<string, string | undefined> = {};
      if (entityType && entityId) {
        switch (entityType) {
          case 'contact':
            entityContext.contactId = entityId;
            break;
          case 'company':
            entityContext.companyId = entityId;
            break;
          case 'lead':
            entityContext.leadId = entityId;
            break;
          case 'project':
            entityContext.projectId = entityId;
            break;
          case 'tender':
            entityContext.tenderId = entityId;
            break;
        }
      }

      await gmailConnection.sendEmail({
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        subject,
        body,
        replyTo: replyToEmailId,
        contactId: entityContext.contactId,
        companyId: entityContext.companyId,
        leadId: entityContext.leadId,
      });

      toast.success("Email envoyé avec succès");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  const isGmailReady = gmailStatus.connected && !gmailLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Nouvel email
          </DialogTitle>
        </DialogHeader>

        {!isGmailReady && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Gmail non connecté
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Connectez votre compte Gmail pour envoyer des emails.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link to="/settings?tab=emails">
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres email
                </Link>
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* To field */}
          <div className="space-y-2">
            <Label>À</Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
              {to.map(email => (
                <Badge key={email} variant="secondary" className="gap-1">
                  {email}
                  <button onClick={() => handleRemoveEmail(email, 'to')} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <div className="relative flex-1 min-w-[200px]">
                <Input
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'to')}
                  onBlur={() => toInput && handleAddEmail(toInput, 'to')}
                  placeholder="Ajouter un destinataire..."
                  className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                />
                {contactSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50">
                    {contactSuggestions.map(contact => (
                      <button
                        key={contact.id}
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                        onClick={() => {
                          if (contact.email) handleAddEmail(contact.email, 'to');
                        }}
                      >
                        <span className="font-medium">{contact.name}</span>
                        <span className="text-muted-foreground text-sm">{contact.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cc/Bcc toggle */}
          <Collapsible open={showCcBcc} onOpenChange={setShowCcBcc}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                {showCcBcc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Cc / Cci
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* Cc field */}
              <div className="space-y-2">
                <Label>Cc</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
                  {cc.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button onClick={() => handleRemoveEmail(email, 'cc')} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'cc')}
                    onBlur={() => ccInput && handleAddEmail(ccInput, 'cc')}
                    placeholder="Copie..."
                    className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto flex-1 min-w-[150px]"
                  />
                </div>
              </div>

              {/* Bcc field */}
              <div className="space-y-2">
                <Label>Cci</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px]">
                  {bcc.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button onClick={() => handleRemoveEmail(email, 'bcc')} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    value={bccInput}
                    onChange={(e) => setBccInput(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'bcc')}
                    onBlur={() => bccInput && handleAddEmail(bccInput, 'bcc')}
                    placeholder="Copie cachée..."
                    className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto flex-1 min-w-[150px]"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Template selector */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label>Objet</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet de l'email..."
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Rédigez votre message..."
              className="min-h-[200px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending || !isGmailReady || to.length === 0}
          >
            {isSending ? (
              <>Envoi en cours...</>
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
