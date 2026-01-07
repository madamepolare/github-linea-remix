import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Send,
  Loader2,
  RefreshCw,
  Building2,
  Euro,
  MapPin,
  Calendar,
  FileText,
  Percent,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tender, PROCEDURE_TYPE_LABELS, SPECIALTIES } from "@/lib/tenderTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PartnerProposalEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender | null;
  partner: {
    id: string;
    companyName: string;
    contactEmail: string;
    contactName?: string;
    specialty: string;
    proposedFeePercentage?: number;
  } | null;
  onSent?: () => void;
}

export function PartnerProposalEmailDialog({
  open,
  onOpenChange,
  tender,
  partner,
  onSent,
}: PartnerProposalEmailDialogProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [feePercentage, setFeePercentage] = useState<string>("");
  const [includeFeeProposal, setIncludeFeeProposal] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open && tender && partner) {
      generateEmailContent();
    }
  }, [open, tender, partner]);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Non communiqué";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "d MMMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const getSpecialtyLabel = (value: string) => {
    return SPECIALTIES.find((s) => s.value === value)?.label || value;
  };

  const generateEmailContent = () => {
    if (!tender || !partner) return;

    const specialtyLabel = getSpecialtyLabel(partner.specialty);
    setSubject(
      `Appel à partenariat ${specialtyLabel} - ${tender.title?.substring(0, 50) || "Projet"}`
    );

    setFeePercentage(partner.proposedFeePercentage?.toString() || "");

    const procedureLabel = tender.procedure_type
      ? PROCEDURE_TYPE_LABELS[tender.procedure_type] || tender.procedure_type
      : "";

    const emailBody = `Bonjour${partner.contactName ? ` ${partner.contactName}` : ""},

Nous constituons actuellement une équipe de maîtrise d'œuvre pour répondre à un appel d'offres et souhaiterions vous associer à ce projet en tant que ${specialtyLabel}.

═══════════════════════════════════════
📋 RÉSUMÉ DU MARCHÉ
═══════════════════════════════════════

🏛️ Maître d'ouvrage : ${tender.client_name || "Non communiqué"}
📍 Localisation : ${tender.location || "Non communiqué"}
${tender.procedure_type ? `📄 Type de marché : ${procedureLabel}` : ""}
💰 Budget estimatif : ${formatCurrency(tender.estimated_budget)}
${tender.surface_area ? `📐 Surface : ${tender.surface_area.toLocaleString()} m²` : ""}
📅 Date de remise : ${formatDate(tender.submission_deadline) || "Non communiqué"}

${tender.description ? `📝 Description :\n${tender.description.substring(0, 500)}${tender.description.length > 500 ? "..." : ""}` : ""}

═══════════════════════════════════════

Merci de nous confirmer votre intérêt pour ce projet.
Nous restons à votre disposition pour toute information complémentaire.

Cordialement`;

    setBody(emailBody);
  };

  const handleSend = async () => {
    if (!tender || !partner) return;

    setIsSending(true);
    try {
      let finalBody = body;

      // Append fee proposal if enabled
      if (includeFeeProposal && feePercentage) {
        finalBody += `\n\n═══════════════════════════════════════
💼 PROPOSITION D'HONORAIRES
═══════════════════════════════════════

Nous vous proposons une participation à hauteur de ${feePercentage}% des honoraires de maîtrise d'œuvre.

Cette proposition est négociable et sera formalisée dans le cadre d'un accord de groupement.

═══════════════════════════════════════`;
      }

      const { error } = await supabase.functions.invoke("send-partner-invitation", {
        body: {
          to: partner.contactEmail,
          subject,
          body: finalBody,
          tenderId: tender.id,
          memberId: partner.id,
        },
      });

      if (error) throw error;

      toast.success(`Email envoyé à ${partner.companyName}`);
      onOpenChange(false);
      onSent?.();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setIsSending(false);
    }
  };

  if (!tender || !partner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Proposition de partenariat
          </DialogTitle>
          <DialogDescription>
            Envoyez une proposition avec résumé du marché à {partner.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Market Summary Card */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{tender.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {tender.client_name}
                  </p>
                </div>
                <Badge variant="outline">
                  {getSpecialtyLabel(partner.specialty)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {tender.location || "—"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Euro className="h-3.5 w-3.5" />
                  {formatCurrency(tender.estimated_budget)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(tender.submission_deadline) || "—"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  {tender.procedure_type
                    ? PROCEDURE_TYPE_LABELS[tender.procedure_type]
                    : "—"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Proposal */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  Inclure proposition d'honoraires
                </Label>
                <Switch
                  checked={includeFeeProposal}
                  onCheckedChange={setIncludeFeeProposal}
                />
              </div>
              {includeFeeProposal && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={feePercentage}
                    onChange={(e) => setFeePercentage(e.target.value)}
                    placeholder="Ex: 12"
                    className="w-24"
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  <span className="text-sm text-muted-foreground">
                    % des honoraires MOE
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Email Content */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Destinataire</Label>
              <span className="text-sm text-muted-foreground">
                {partner.contactEmail}
              </span>
            </div>

            <div className="space-y-2">
              <Label>Objet</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Message</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateEmailContent}
                  className="h-7"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Régénérer
                </Button>
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={isSending || !subject || !body}>
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
