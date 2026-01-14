import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Send, 
  Mail, 
  Paperclip, 
  Link2, 
  Eye, 
  Code,
  Loader2,
  CheckCircle2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { QuoteDocument } from '@/types/quoteTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SendQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: QuoteDocument;
  onSent?: () => void;
}

const EMAIL_TEMPLATES = [
  {
    id: 'proposal',
    name: 'Proposition commerciale',
    subject: 'Proposition commerciale - {{project_title}}',
    body: `Bonjour {{contact_name}},

Suite à notre échange, je vous prie de trouver ci-joint notre proposition commerciale pour le projet {{project_title}}.

Le montant total de notre proposition s'élève à {{total_amount}} HT.

Ce devis est valable jusqu'au {{validity_date}}.

{{#public_link}}
Vous pouvez consulter, personnaliser et signer ce devis en ligne en cliquant sur le bouton ci-dessous.
{{/public_link}}

Je reste à votre disposition pour toute question.

Bien cordialement,`
  },
  {
    id: 'reminder',
    name: 'Relance devis',
    subject: 'Relance - Devis {{quote_number}} - {{project_title}}',
    body: `Bonjour {{contact_name}},

Je me permets de revenir vers vous concernant notre proposition commerciale {{quote_number}} pour le projet {{project_title}}.

Avez-vous eu l'occasion d'en prendre connaissance ? 

Je reste disponible pour en discuter ou apporter des modifications si nécessaire.

{{#public_link}}
Pour rappel, vous pouvez consulter et signer ce devis en ligne.
{{/public_link}}

Bien cordialement,`
  },
  {
    id: 'custom',
    name: 'Message personnalisé',
    subject: '',
    body: ''
  }
];

export function SendQuoteDialog({ 
  open, 
  onOpenChange, 
  document,
  onSent 
}: SendQuoteDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('proposal');
  const [toEmail, setToEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachPdf, setAttachPdf] = useState(true);
  const [generatePublicLink, setGeneratePublicLink] = useState(true);
  const [previewMode, setPreviewMode] = useState<'code' | 'preview'>('code');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccessfully, setSentSuccessfully] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Initialize email from contact
  useEffect(() => {
    if (open && document.client_contact?.email) {
      setToEmail(document.client_contact.email);
    }
  }, [open, document.client_contact?.email]);

  // Update template content when template changes
  useEffect(() => {
    const template = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate);
    if (template && template.id !== 'custom') {
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [selectedTemplate]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const replaceVariables = (text: string) => {
    return text
      .replace(/\{\{client_name\}\}/g, document.client_company?.name || 'Client')
      .replace(/\{\{contact_name\}\}/g, document.client_contact?.name || '')
      .replace(/\{\{quote_number\}\}/g, document.document_number || '')
      .replace(/\{\{project_title\}\}/g, document.title || '')
      .replace(/\{\{total_amount\}\}/g, formatCurrency(document.total_amount || 0))
      .replace(/\{\{validity_date\}\}/g, document.valid_until 
        ? new Date(document.valid_until).toLocaleDateString('fr-FR') 
        : new Date(Date.now() + (document.validity_days || 30) * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'))
      .replace(/\{\{#public_link\}\}[\s\S]*?\{\{\/public_link\}\}/g, generatePublicLink ? '$&'.replace(/\{\{[#\/]public_link\}\}/g, '') : '');
  };

  const handleSend = async () => {
    if (!toEmail) {
      toast.error('Veuillez saisir une adresse email');
      return;
    }

    if (!document.id) {
      toast.error('Document non sauvegardé');
      return;
    }

    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          documentId: document.id,
          to: toEmail,
          cc: ccEmails ? ccEmails.split(',').map(e => e.trim()).filter(Boolean) : undefined,
          subject: replaceVariables(subject),
          body: replaceVariables(body),
          attachPdf,
          generatePublicLink,
        }
      });

      if (error) throw error;

      setSentSuccessfully(true);
      if (data?.publicLink) {
        setGeneratedLink(data.publicLink);
      }
      
      toast.success('Email envoyé avec succès');
      onSent?.();
      
      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
        setSentSuccessfully(false);
        setGeneratedLink(null);
      }, 3000);

    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('Lien copié !');
    }
  };

  if (sentSuccessfully) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Email envoyé !</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Votre devis a été envoyé à {toEmail}
            </p>
            
            {generatedLink && (
              <div className="w-full p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Lien de consultation :</p>
                <div className="flex items-center gap-2">
                  <Input 
                    value={generatedLink} 
                    readOnly 
                    className="text-xs h-8"
                  />
                  <Button size="sm" variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={generatedLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer le devis
          </DialogTitle>
          <DialogDescription>
            Devis {document.document_number} • {document.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template selection */}
          <div className="space-y-2">
            <Label>Modèle d'email</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="to">Destinataire *</Label>
              <Input
                id="to"
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc">Copie (CC)</Label>
              <Input
                id="cc"
                value={ccEmails}
                onChange={(e) => setCcEmails(e.target.value)}
                placeholder="email1@ex.com, email2@ex.com"
              />
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

          {/* Body with preview toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Message</Label>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <Button
                  variant={previewMode === 'code' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setPreviewMode('code')}
                >
                  <Code className="h-3.5 w-3.5 mr-1" />
                  Éditer
                </Button>
                <Button
                  variant={previewMode === 'preview' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setPreviewMode('preview')}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  Aperçu
                </Button>
              </div>
            </div>
            
            {previewMode === 'code' ? (
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                placeholder="Contenu de l'email..."
                className="font-mono text-sm"
              />
            ) : (
              <div className="border rounded-md p-4 bg-muted/30 min-h-[200px] whitespace-pre-wrap text-sm">
                {replaceVariables(body)}
              </div>
            )}
            
            <div className="flex flex-wrap gap-1">
              <span className="text-xs text-muted-foreground">Variables :</span>
              {['{{contact_name}}', '{{client_name}}', '{{quote_number}}', '{{project_title}}', '{{total_amount}}', '{{validity_date}}'].map(v => (
                <Badge 
                  key={v} 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-primary/10"
                  onClick={() => setBody(prev => prev + ' ' + v)}
                >
                  {v}
                </Badge>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="attachPdf" className="font-normal cursor-pointer">
                  Joindre le PDF du devis
                </Label>
              </div>
              <Switch
                id="attachPdf"
                checked={attachPdf}
                onCheckedChange={setAttachPdf}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="generateLink" className="font-normal cursor-pointer">
                    Générer un lien de consultation en ligne
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Le client pourra consulter, activer/désactiver des options et signer en ligne
                  </p>
                </div>
              </div>
              <Switch
                id="generateLink"
                checked={generatePublicLink}
                onCheckedChange={setGeneratePublicLink}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={isSending || !toEmail}>
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
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
