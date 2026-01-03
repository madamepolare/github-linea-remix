import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Tender, TenderStatus } from "@/lib/tenderTypes";
import { TENDER_STATUS_LABELS, TENDER_STATUS_COLORS } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";

interface TenderGeneralTabProps {
  tender: Tender;
  onUpdateStatus: (status: TenderStatus, notes?: string) => void;
}

export function TenderGeneralTab({ tender, onUpdateStatus }: TenderGeneralTabProps) {
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decisionType, setDecisionType] = useState<"go" | "no_go" | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");

  const handleDecision = () => {
    if (decisionType) {
      onUpdateStatus(decisionType, decisionNotes);
      setShowDecisionDialog(false);
      setDecisionNotes("");
    }
  };

  const statuses: TenderStatus[] = ['repere', 'en_analyse', 'go', 'en_montage', 'depose', 'gagne'];
  const currentIndex = statuses.indexOf(tender.status);

  return (
    <div className="space-y-6">
      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {statuses.map((status, index) => {
              const isActive = status === tender.status;
              const isPast = index < currentIndex;
              const isNoGo = tender.status === 'no_go' || tender.status === 'perdu';
              
              return (
                <div key={status} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (status === 'go' || status === 'no_go') {
                        setDecisionType(status as 'go' | 'no_go');
                        setShowDecisionDialog(true);
                      } else {
                        onUpdateStatus(status);
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                      isActive && TENDER_STATUS_COLORS[status],
                      isPast && "bg-muted text-muted-foreground",
                      !isActive && !isPast && "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {TENDER_STATUS_LABELS[status]}
                  </button>
                  {index < statuses.length - 1 && (
                    <div className={cn(
                      "w-8 h-0.5",
                      isPast ? "bg-foreground/20" : "bg-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* No-Go option */}
          {tender.status !== 'no_go' && tender.status !== 'perdu' && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  setDecisionType('no_go');
                  setShowDecisionDialog(true);
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Marquer No-Go
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Key Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates clés
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DateRow 
              label="Date limite de dépôt" 
              date={tender.submission_deadline}
              highlight
            />
            <DateRow 
              label="Visite de site" 
              date={tender.site_visit_date}
              required={tender.site_visit_required}
            />
            <DateRow label="Jury / Commission" date={tender.jury_date} />
            <DateRow label="Résultats attendus" date={tender.results_date} />
            {tender.go_decision_date && (
              <DateRow 
                label="Décision Go/No-Go" 
                date={tender.go_decision_date}
                badge={tender.status === 'go' ? 'Go' : tender.status === 'no_go' ? 'No-Go' : undefined}
                badgeVariant={tender.status === 'go' ? 'success' : 'destructive'}
              />
            )}
          </CardContent>
        </Card>

        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informations projet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Maître d'ouvrage" value={tender.client_name} />
            <InfoRow label="Pouvoir adjudicateur" value={tender.contracting_authority} />
            <InfoRow label="Localisation" value={tender.location} />
            <InfoRow label="Région" value={tender.region} />
            <InfoRow 
              label="Surface" 
              value={tender.surface_area ? `${tender.surface_area.toLocaleString()} m²` : null} 
            />
            <InfoRow 
              label="Budget estimé" 
              value={tender.estimated_budget ? `${(tender.estimated_budget / 1000000).toFixed(2)} M€` : null}
              badge={tender.budget_disclosed ? 'Affiché' : 'Non affiché'}
            />
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {tender.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {tender.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Go Decision Notes */}
      {tender.go_decision_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes de décision</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {tender.go_decision_notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Decision Dialog */}
      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {decisionType === 'go' ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Confirmer la décision Go
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Confirmer la décision No-Go
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {decisionType === 'go' 
                ? "Vous confirmez que l'agence répond à ce marché. Cette décision sera enregistrée."
                : "Vous confirmez ne pas répondre à ce marché. Précisez les raisons ci-dessous."
              }
            </p>
            <Textarea
              placeholder="Notes de décision (optionnel)..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecisionDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleDecision}
              variant={decisionType === 'go' ? 'default' : 'destructive'}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DateRow({ 
  label, 
  date, 
  highlight,
  required,
  badge,
  badgeVariant,
}: { 
  label: string; 
  date: string | null;
  highlight?: boolean;
  required?: boolean | null;
  badge?: string;
  badgeVariant?: 'success' | 'destructive';
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {label}
        {required && (
          <Badge variant="secondary" className="text-xs">Obligatoire</Badge>
        )}
      </span>
      <span className={cn(
        "text-sm",
        highlight && date && "font-medium"
      )}>
        {date ? (
          <span className="flex items-center gap-2">
            {format(new Date(date), "dd MMM yyyy", { locale: fr })}
            {badge && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  badgeVariant === 'success' && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                  badgeVariant === 'destructive' && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {badge}
              </Badge>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </span>
    </div>
  );
}

function InfoRow({ 
  label, 
  value,
  badge,
}: { 
  label: string; 
  value: string | null | undefined;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm flex items-center gap-2">
        {value || <span className="text-muted-foreground">-</span>}
        {badge && value && (
          <Badge variant="secondary" className="text-xs">{badge}</Badge>
        )}
      </span>
    </div>
  );
}
