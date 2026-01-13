import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Send,
  Loader2,
  RefreshCw,
  FileCheck,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Building2,
  Euro,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tender, TenderTeamMember, TenderDeliverable, DELIVERABLE_TYPES, SPECIALTIES } from "@/lib/tenderTypes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TeamDeliverablesEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender | null;
  teamMembers: TenderTeamMember[];
  deliverables: TenderDeliverable[];
}

interface MemberDeliverables {
  member: TenderTeamMember;
  deliverables: Array<{
    deliverable: TenderDeliverable;
    isCompleted: boolean;
  }>;
  feePercentage: number | null;
  feeAmount: number | null;
}

export function TeamDeliverablesEmailDialog({
  open,
  onOpenChange,
  tender,
  teamMembers,
  deliverables,
}: TeamDeliverablesEmailDialogProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [introText, setIntroText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Calculate MOE total fee amount
  const moeFeeAmount = tender?.moe_fee_amount || 
    ((tender?.estimated_budget || 0) * ((tender?.moe_fee_percentage || 0) / 100));

  const getSpecialtyLabel = (value: string) => {
    return SPECIALTIES.find((s) => s.value === value)?.label || value;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Group deliverables by team member
  const memberDeliverables = useMemo<MemberDeliverables[]>(() => {
    return teamMembers
      .filter(m => m.company?.id && m.contact?.email)
      .map(member => {
        const companyId = member.company!.id;
        const memberDelivs = deliverables
          .filter(d => d.responsible_company_ids?.includes(companyId))
          .map(d => ({
            deliverable: d,
            isCompleted: (d.member_completion as Record<string, boolean>)?.[companyId] ?? d.is_completed,
          }));
        
        // Calculate fee for this member
        const feePercentage = member.fee_percentage || null;
        const feeAmount = feePercentage && moeFeeAmount 
          ? moeFeeAmount * (feePercentage / 100)
          : null;
        
        return {
          member,
          deliverables: memberDelivs,
          feePercentage,
          feeAmount,
        };
      })
      .filter(md => md.deliverables.length > 0 || md.feePercentage !== null);
  }, [teamMembers, deliverables, moeFeeAmount]);

  useEffect(() => {
    if (open && tender) {
      setSubject(`Récapitulatif honoraires et livrables - ${tender.title?.substring(0, 40) || 'Projet'}`);
      setIntroText(`Bonjour,

Voici le récapitulatif de votre participation au groupement pour le projet "${tender.title}".

Ce document reprend la proposition d'honoraires convenue ainsi que la liste des livrables attendus.`);
      // Select all members by default
      setSelectedMembers(new Set(memberDeliverables.map(md => md.member.id)));
    }
  }, [open, tender, memberDeliverables]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "d MMMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const getDeliverableTypeLabel = (type: string) => {
    return DELIVERABLE_TYPES.find(t => t.value === type)?.label || type;
  };

  const generateEmailBodyForMember = (md: MemberDeliverables) => {
    const pendingDelivs = md.deliverables.filter(d => !d.isCompleted);
    const completedDelivs = md.deliverables.filter(d => d.isCompleted);

    let body = `${introText}
`;

    // Add fee section if available
    if (md.feePercentage !== null && md.feeAmount !== null) {
      body += `
═══════════════════════════════════════
💼 PROPOSITION D'HONORAIRES
═══════════════════════════════════════

Votre participation au groupement :
• Part : ${md.feePercentage}% des honoraires MOE
• Montant estimatif : ${formatCurrency(md.feeAmount)} HT
${tender?.moe_fee_percentage ? `• Base MOE globale : ${tender.moe_fee_percentage}% du budget travaux` : ''}

`;
    }

    // Add deliverables section
    if (md.deliverables.length > 0) {
      body += `═══════════════════════════════════════
📋 VOS LIVRABLES
═══════════════════════════════════════

`;

      if (pendingDelivs.length > 0) {
        body += `⏳ À PRODUIRE (${pendingDelivs.length})
──────────────────────────────────────
`;
        pendingDelivs.forEach((d, i) => {
          body += `${i + 1}. ${d.deliverable.name}`;
          if (d.deliverable.due_date) {
            body += ` - Échéance : ${formatDate(d.deliverable.due_date)}`;
          }
          body += '\n';
          if (d.deliverable.description) {
            body += `   ${d.deliverable.description}\n`;
          }
        });
        body += '\n';
      }

      if (completedDelivs.length > 0) {
        body += `✅ DÉJÀ REÇUS (${completedDelivs.length})
──────────────────────────────────────
`;
        completedDelivs.forEach((d, i) => {
          body += `${i + 1}. ${d.deliverable.name}\n`;
        });
        body += '\n';
      }
    }

    body += `═══════════════════════════════════════

${tender?.submission_deadline ? `📅 Date limite de remise globale : ${formatDate(tender.submission_deadline)}` : ''}

Merci de votre collaboration.

Cordialement`;

    return body;
  };

  const handleSend = async () => {
    if (!tender || selectedMembers.size === 0) return;

    setIsSending(true);
    const results: { success: boolean; name: string }[] = [];

    try {
      for (const md of memberDeliverables) {
        if (!selectedMembers.has(md.member.id)) continue;
        
        const email = md.member.contact?.email;
        if (!email) continue;

        const body = generateEmailBodyForMember(md);

        try {
          const { error } = await supabase.functions.invoke("send-partner-invitation", {
            body: {
              to: email,
              subject,
              body,
              tenderId: tender.id,
              memberId: md.member.id,
            },
          });

          if (error) throw error;
          results.push({ success: true, name: md.member.company?.name || 'Partenaire' });
        } catch (err) {
          console.error(`Error sending to ${email}:`, err);
          results.push({ success: false, name: md.member.company?.name || 'Partenaire' });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0 && failCount === 0) {
        toast.success(`${successCount} email(s) envoyé(s) avec succès`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`${successCount} envoyé(s), ${failCount} échec(s)`);
      } else {
        toast.error("Échec de l'envoi des emails");
      }

      if (successCount > 0) {
        onOpenChange(false);
      }
    } finally {
      setIsSending(false);
    }
  };

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const toggleAll = () => {
    if (selectedMembers.size === memberDeliverables.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(memberDeliverables.map(md => md.member.id)));
    }
  };

  if (!tender) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Envoyer le récapitulatif des livrables
          </DialogTitle>
          <DialogDescription>
            Envoyez à chaque membre de l'équipe la liste de ses livrables à produire
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
          {/* Email Subject */}
          <div className="space-y-2">
            <Label>Objet de l'email</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          {/* Intro Text */}
          <div className="space-y-2">
            <Label>Introduction du message</Label>
            <Textarea
              value={introText}
              onChange={(e) => setIntroText(e.target.value)}
              rows={4}
              className="text-sm"
            />
          </div>

          <Separator />

          {/* Member Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Destinataires ({selectedMembers.size}/{memberDeliverables.length})</Label>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedMembers.size === memberDeliverables.length ? "Tout désélectionner" : "Tout sélectionner"}
              </Button>
            </div>
            
            <ScrollArea className="h-[280px] border rounded-lg">
              <div className="p-2 space-y-2">
                {memberDeliverables.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun membre avec des livrables assignés et un email</p>
                  </div>
                ) : (
                  memberDeliverables.map((md) => {
                    const pendingCount = md.deliverables.filter(d => !d.isCompleted).length;
                    const completedCount = md.deliverables.filter(d => d.isCompleted).length;
                    
                    return (
                      <Card 
                        key={md.member.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedMembers.has(md.member.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleMember(md.member.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <Checkbox 
                              checked={selectedMembers.has(md.member.id)}
                              onCheckedChange={() => toggleMember(md.member.id)}
                            />
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={md.member.company?.logo_url || undefined} />
                              <AvatarFallback>
                                {md.member.company?.name?.substring(0, 2) || <Building2 className="h-4 w-4" />}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {md.member.company?.name || 'Sans nom'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {md.member.contact?.email}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {md.feePercentage !== null && (
                                <Badge variant="secondary" className="text-primary">
                                  <Euro className="h-3 w-3 mr-1" />
                                  {md.feePercentage}%
                                </Badge>
                              )}
                              {pendingCount > 0 && (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  {pendingCount} à faire
                                </Badge>
                              )}
                              {completedCount > 0 && (
                                <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  {completedCount} reçu(s)
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isSending || selectedMembers.size === 0 || !subject}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Envoyer à {selectedMembers.size} membre(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
