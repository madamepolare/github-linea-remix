import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Send,
  Mail,
  Euro,
  FileText,
  ExternalLink,
  Sparkles,
  Loader2,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { PartnerCandidate } from "@/hooks/useTenderPartnerCandidates";
import type { Tender } from "@/lib/tenderTypes";
import { SPECIALTIES, PROCEDURE_TYPE_LABELS } from "@/lib/tenderTypes";

interface BulkInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: PartnerCandidate[];
  tender: Tender;
  onSend: (data: {
    candidateIds: string[];
    subject: string;
    body: string;
    includeFeesProposal: boolean;
  }) => Promise<void>;
  isSending?: boolean;
}

export function BulkInvitationDialog({
  open,
  onOpenChange,
  candidates,
  tender,
  onSend,
  isSending = false,
}: BulkInvitationDialogProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [includeFeesProposal, setIncludeFeesProposal] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Valid candidates (those with email)
  const validCandidates = candidates.filter(c => c.contact?.email);
  const invalidCandidates = candidates.filter(c => !c.contact?.email);

  useEffect(() => {
    if (open) {
      // Pre-select all valid candidates
      setSelectedIds(validCandidates.map(c => c.id));
      
      // Generate default subject
      setSubject(`Appel à partenariat - ${tender.title.substring(0, 50)}${tender.title.length > 50 ? '...' : ''}`);
      
      // Generate default body with tender summary
      generateDefaultBody();
    }
  }, [open, tender, validCandidates.length]);

  const generateDefaultBody = () => {
    const deadline = tender.submission_deadline 
      ? format(new Date(tender.submission_deadline), "d MMMM yyyy 'à' HH'h'mm", { locale: fr })
      : null;

    const budget = tender.estimated_budget 
      ? (tender.estimated_budget >= 1000000 
          ? `${(tender.estimated_budget / 1000000).toFixed(1)}M€` 
          : `${(tender.estimated_budget / 1000).toFixed(0)}k€`)
      : null;

    let body = `Bonjour,

Nous constituons actuellement une équipe de maîtrise d'œuvre pour répondre à un appel d'offres et souhaiterions vous associer à ce projet.

────────────────────────
📋 SYNTHÈSE DU MARCHÉ
────────────────────────

📌 ${tender.title}
${tender.reference ? `Référence : ${tender.reference}` : ''}
${tender.client_name ? `Maître d'ouvrage : ${tender.client_name}` : ''}
${tender.procedure_type ? `Type de procédure : ${PROCEDURE_TYPE_LABELS[tender.procedure_type]}` : ''}

📍 Localisation : ${tender.location || 'Non précisée'}
${tender.surface_area ? `📐 Surface : ${tender.surface_area.toLocaleString('fr-FR')} m²` : ''}
${budget ? `💰 Budget estimé : ${budget}${tender.budget_disclosed ? '' : ' (non communiqué)'}` : ''}
${deadline ? `📅 Date limite de remise : ${deadline}` : ''}

${tender.description ? `\n📝 Description :\n${tender.description.substring(0, 500)}${tender.description.length > 500 ? '...' : ''}` : ''}`;

    if (tender.source_url) {
      body += `\n\n🔗 Accès au DCE : ${tender.source_url}`;
    }

    body += `

────────────────────────

Merci de nous faire part de votre intérêt et de votre disponibilité pour ce projet.
En cas de réponse positive, nous vous transmettrons les documents complets ainsi que les éléments de répartition des honoraires.

Dans l'attente de votre retour, nous restons à votre disposition pour tout renseignement complémentaire.

Cordialement`;

    setBody(body);
  };

  const toggleCandidate = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleSend = async () => {
    await onSend({
      candidateIds: selectedIds,
      subject,
      body,
      includeFeesProposal,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Envoyer les invitations
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            {/* Recipients Section */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Destinataires ({selectedIds.length}/{validCandidates.length})
              </Label>
              
              {invalidCandidates.length > 0 && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {invalidCandidates.length} candidat(s) sans email ne recevront pas d'invitation
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-2">
                {validCandidates.map((candidate) => {
                  const isSelected = selectedIds.includes(candidate.id);
                  const specialtyLabel = SPECIALTIES.find(s => s.value === candidate.specialty)?.label || candidate.specialty;

                  return (
                    <div
                      key={candidate.id}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => toggleCandidate(candidate.id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={candidate.company?.logo_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {candidate.company?.name?.substring(0, 2) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {candidate.company?.name || candidate.contact?.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {specialtyLabel}
                          </Badge>
                          {candidate.fee_percentage && (
                            <span className="text-[10px] text-muted-foreground">
                              {candidate.fee_percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Email Content */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Objet</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Objet de l'email"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Message</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={generateDefaultBody}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Régénérer la synthèse
                  </Button>
                </div>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Inclure la proposition d'honoraires</p>
                    <p className="text-xs text-muted-foreground">
                      Ajouter automatiquement le % et montant pour chaque partenaire
                    </p>
                  </div>
                </div>
                <Switch
                  checked={includeFeesProposal}
                  onCheckedChange={setIncludeFeesProposal}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || selectedIds.length === 0}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer ({selectedIds.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
