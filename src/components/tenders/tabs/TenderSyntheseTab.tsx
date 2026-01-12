import { useState, useMemo } from "react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Building2,
  MapPin,
  Euro,
  Ruler,
  Calendar,
  Users,
  AlertTriangle,
  FileText,
  ExternalLink,
  Globe,
  Link2,
  Phone,
  Mail,
  User,
  Hash,
  Edit2,
  X,
  Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTenders } from "@/hooks/useTenders";
import { useTenderCriteria } from "@/hooks/useTenderCriteria";
import { toast } from "sonner";
import type { Tender, TenderStatus } from "@/lib/tenderTypes";

interface TenderSyntheseTabProps {
  tender: Tender;
  onNavigateToTab: (tab: string) => void;
}

const REQUIRED_FIELDS = [
  "client_name",
  "procedure_type",
  "location",
  "estimated_budget",
  "submission_deadline",
  "description",
] as const;

const SPECIALTY_LABELS: Record<string, string> = {
  architecte: "Architecte",
  architecte_associe: "Archi. associé",
  bet_structure: "BET Structure",
  bet_fluides: "BET Fluides",
  bet_electricite: "BET Électricité",
  bet_thermique: "BET Thermique",
  thermicien: "Thermicien",
  economiste: "Économiste",
  acousticien: "Acousticien",
  paysagiste: "Paysagiste",
  vrd: "VRD",
  opc: "OPC",
  ssi: "SSI",
  bim: "BIM Manager",
  hqe: "HQE / Environnement",
  urbaniste: "Urbaniste",
  scenographe: "Scénographe",
  eclairagiste: "Éclairagiste",
  signaletique: "Signalétique",
};

export function TenderSyntheseTab({ tender, onNavigateToTab }: TenderSyntheseTabProps) {
  const { updateStatus, updateTender } = useTenders();
  const { criteria, priceWeight, technicalWeight } = useTenderCriteria(tender.id);
  const [showGoDialog, setShowGoDialog] = useState(false);
  const [goDecisionNotes, setGoDecisionNotes] = useState("");
  const [pendingDecision, setPendingDecision] = useState<"go" | "no_go" | null>(null);
  const [isChangingDecision, setIsChangingDecision] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);

  const extendedTender = tender as any;

  // Calculate completion score
  const { completionScore, hasAllRequiredFields } = useMemo(() => {
    let filled = 0;
    REQUIRED_FIELDS.forEach((field) => {
      const value = tender[field as keyof Tender];
      if (value && (typeof value !== "string" || value.trim() !== "")) {
        filled++;
      }
    });
    const score = Math.round((filled / REQUIRED_FIELDS.length) * 100);
    return {
      completionScore: score,
      hasAllRequiredFields: filled === REQUIRED_FIELDS.length,
    };
  }, [tender]);

  // Deadline info
  const deadlineInfo = useMemo(() => {
    if (!tender.submission_deadline) return null;
    const deadline = new Date(tender.submission_deadline);
    const now = new Date();
    const daysLeft = differenceInDays(deadline, now);
    const hoursLeft = differenceInHours(deadline, now);

    let urgency: "critical" | "warning" | "normal" | "passed" = "normal";
    let label = "";

    if (hoursLeft < 0) {
      urgency = "passed";
      label = "Dépassé";
    } else if (daysLeft <= 1) {
      urgency = "critical";
      label = hoursLeft < 24 ? `${hoursLeft}h` : "Demain";
    } else if (daysLeft <= 7) {
      urgency = "warning";
      label = `J-${daysLeft}`;
    } else {
      label = `J-${daysLeft}`;
    }

    return { deadline, daysLeft, hoursLeft, urgency, label };
  }, [tender.submission_deadline]);

  // Team data
  const requiredTeam = useMemo(() => {
    if (!tender.required_team) return [];
    if (Array.isArray(tender.required_team)) return tender.required_team;
    return [];
  }, [tender.required_team]);

  const mandatoryTeam = requiredTeam.filter((t: any) => t.is_mandatory);

  // Critical alerts
  const criticalAlerts = useMemo(() => {
    if (!extendedTender.critical_alerts) return [];
    if (Array.isArray(extendedTender.critical_alerts)) return extendedTender.critical_alerts;
    return [];
  }, [extendedTender.critical_alerts]);

  // Grouped criteria
  const groupedCriteria = useMemo(() => {
    const groups: Record<string, { total: number; items: typeof criteria }> = {};
    criteria.forEach((c) => {
      const type = c.criterion_type || "other";
      if (!groups[type]) {
        groups[type] = { total: 0, items: [] };
      }
      groups[type].total += c.weight || 0;
      groups[type].items.push(c);
    });
    return Object.entries(groups)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([type, data]) => ({ type, ...data }));
  }, [criteria]);

  const isDecided = tender.status === "go" || tender.status === "no_go";
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (completionScore / 100) * circumference;

  const handleDecision = (decision: "go" | "no_go") => {
    setPendingDecision(decision);
    setShowGoDialog(true);
  };

  const handleChangeDecision = () => {
    setIsChangingDecision(true);
    setGoDecisionNotes(tender.go_decision_notes || "");
    setShowGoDialog(true);
    setPendingDecision(null);
  };

  const confirmDecision = () => {
    if (pendingDecision) {
      updateStatus.mutate({
        id: tender.id,
        status: pendingDecision as TenderStatus,
        notes: goDecisionNotes,
      });
      setShowGoDialog(false);
      setPendingDecision(null);
      setGoDecisionNotes("");
      setIsChangingDecision(false);
    }
  };

  const handleDialogClose = () => {
    setShowGoDialog(false);
    setPendingDecision(null);
    setGoDecisionNotes("");
    setIsChangingDecision(false);
  };

  const handleRemoveSpecialty = (memberId: string) => {
    const updatedTeam = requiredTeam.filter((m: any) => m.id !== memberId);
    updateTender.mutate(
      { id: tender.id, required_team: updatedTeam },
      { onSuccess: () => toast.success("Spécialité retirée") }
    );
  };

  const formatBudget = (amount: number | null | undefined) => {
    if (!amount) return "—";
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1).replace(".0", "")} M€`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)} k€`;
    return `${amount.toLocaleString()} €`;
  };

  const getCriterionLabel = (type: string) => {
    const labels: Record<string, string> = {
      price: "Prix",
      technical: "Technique",
      delay: "Délais",
      methodology: "Méthodologie",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Hero: Decision + Countdown */}
      <Card className={cn(
        "border-2",
        tender.status === "go" && "border-green-400 bg-green-50/30 dark:bg-green-950/20",
        tender.status === "no_go" && "border-red-400 bg-red-50/30 dark:bg-red-950/20",
        !isDecided && "border-border"
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Score Circle */}
            <div className="relative flex-shrink-0">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold">{completionScore}%</span>
                <span className="text-[10px] text-muted-foreground">Complet</span>
              </div>
            </div>

            {/* Status & Deadline */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {isDecided ? (
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold",
                    tender.status === "go" && "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
                    tender.status === "no_go" && "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                  )}>
                    {tender.status === "go" ? (
                      <><CheckCircle2 className="h-4 w-4" /> GO - On répond !</>
                    ) : (
                      <><XCircle className="h-4 w-4" /> NO-GO</>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary" className="text-sm py-1">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    En attente de décision
                  </Badge>
                )}

                {deadlineInfo && (
                  <Badge className={cn(
                    "text-sm py-1",
                    deadlineInfo.urgency === "critical" && "bg-red-100 text-red-700 hover:bg-red-100",
                    deadlineInfo.urgency === "warning" && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                    deadlineInfo.urgency === "passed" && "bg-red-200 text-red-800 hover:bg-red-200",
                    deadlineInfo.urgency === "normal" && "bg-blue-100 text-blue-700 hover:bg-blue-100"
                  )}>
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {deadlineInfo.label}
                  </Badge>
                )}
              </div>

              {tender.submission_deadline && (
                <p className="text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 inline mr-1.5" />
                  {format(new Date(tender.submission_deadline), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              )}

              {tender.go_decision_notes && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm italic text-muted-foreground">
                  "{tender.go_decision_notes}"
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full lg:w-auto">
              {!isDecided ? (
                <>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleDecision("go")}
                    disabled={!hasAllRequiredFields}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" /> GO
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleDecision("no_go")}
                    disabled={!hasAllRequiredFields}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" /> NO-GO
                  </Button>
                  {!hasAllRequiredFields && (
                    <p className="text-xs text-amber-600 text-center">Remplir les champs obligatoires</p>
                  )}
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={handleChangeDecision}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Modifier
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Points d'attention
              <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700 text-xs">
                {criticalAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {criticalAlerts.map((alert: any, index: number) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border text-sm",
                    alert.severity === "critical" && "bg-red-50 border-red-200 dark:bg-red-950/30",
                    alert.severity === "warning" && "bg-amber-50 border-amber-200 dark:bg-amber-950/30",
                    !alert.severity && "bg-blue-50 border-blue-200 dark:bg-blue-950/30"
                  )}
                >
                  <AlertTriangle className={cn(
                    "h-4 w-4 shrink-0 mt-0.5",
                    alert.severity === "critical" && "text-red-500",
                    alert.severity === "warning" && "text-amber-500",
                    !alert.severity && "text-blue-500"
                  )} />
                  <div>
                    <p>{alert.message}</p>
                    {alert.source && (
                      <p className="text-xs text-muted-foreground mt-1">📄 {alert.source}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid: 2 columns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Client / MOA */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Maître d'ouvrage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium">{tender.client_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{tender.client_type || "—"}</p>
                </div>
              </div>
              {tender.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {tender.location}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {tender.source_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={tender.source_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-3 w-3 mr-1" /> Source <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
                {tender.dce_link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={tender.dce_link} target="_blank" rel="noopener noreferrer">
                      <Link2 className="h-3 w-3 mr-1" /> DCE <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Projet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Euro className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold">{formatBudget(tender.estimated_budget)}</p>
                  <p className="text-xs text-muted-foreground">Budget HT</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Hash className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm font-bold truncate">{tender.reference || "—"}</p>
                  <p className="text-xs text-muted-foreground">Référence</p>
                </div>
              </div>
              {tender.description && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm line-clamp-4">{tender.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Criteria */}
          {criteria.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  Critères de jugement
                  <div className="ml-auto flex gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      Prix {priceWeight}%
                    </Badge>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                      Technique {technicalWeight}%
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Stacked Bar */}
                <div className="h-8 rounded-full overflow-hidden bg-muted flex mb-4">
                  {groupedCriteria.map((group) => {
                    const totalWeight = groupedCriteria.reduce((sum, g) => sum + g.total, 0);
                    const widthPercent = totalWeight > 0 ? (group.total / totalWeight) * 100 : 0;
                    const colorMap: Record<string, string> = {
                      price: "bg-green-500",
                      technical: "bg-blue-500",
                      delay: "bg-amber-500",
                      methodology: "bg-purple-500",
                      other: "bg-gray-400",
                    };
                    return (
                      <div
                        key={group.type}
                        className={cn("h-full flex items-center justify-center text-white text-xs font-medium", colorMap[group.type] || colorMap.other)}
                        style={{ width: `${widthPercent}%` }}
                      >
                        {widthPercent >= 15 && `${group.total}%`}
                      </div>
                    );
                  })}
                </div>
                {/* Detail list */}
                <div className="space-y-1">
                  {criteria.slice(0, 6).map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate flex-1">{c.name}</span>
                      <span className="font-medium ml-2">{c.weight}%</span>
                    </div>
                  ))}
                  {criteria.length > 6 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{criteria.length - 6} autres critères
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Dates & Échéances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Date limite de dépôt</p>
                  <p className="font-medium">
                    {tender.submission_deadline
                      ? format(new Date(tender.submission_deadline), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })
                      : "Non définie"}
                  </p>
                </div>
              </div>

              {(tender.site_visit_required || tender.site_visit_date) && (
                <div className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  tender.site_visit_required ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" : "bg-muted/50"
                )}>
                  <MapPin className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">Visite de site</p>
                      {tender.site_visit_required && (
                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">Obligatoire</Badge>
                      )}
                    </div>
                    <p className="font-medium">
                      {tender.site_visit_date
                        ? format(new Date(tender.site_visit_date), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                        : "Date à définir"}
                    </p>
                    {/* Site visit notes */}
                    {extendedTender.site_visit_notes && (
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 italic">
                        📝 {extendedTender.site_visit_notes}
                      </p>
                    )}
                    {(extendedTender.site_visit_contact_name || extendedTender.site_visit_contact_phone) && (
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {extendedTender.site_visit_contact_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {extendedTender.site_visit_contact_name}
                          </span>
                        )}
                        {extendedTender.site_visit_contact_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {extendedTender.site_visit_contact_phone}
                          </span>
                        )}
                        {extendedTender.site_visit_contact_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {extendedTender.site_visit_contact_email}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Équipe requise
                {mandatoryTeam.length > 0 && (
                  <Badge variant="default" className="ml-auto text-xs">
                    {mandatoryTeam.length} obligatoire{mandatoryTeam.length > 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requiredTeam.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune équipe définie
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {requiredTeam.length} spécialité{requiredTeam.length > 1 ? "s" : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setIsEditingTeam(!isEditingTeam)}
                    >
                      <Edit2 className="h-3 w-3" />
                      {isEditingTeam ? "Terminé" : "Modifier"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {requiredTeam.map((member: any, index: number) => (
                      <div
                        key={member.id || index}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm",
                          member.is_mandatory
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {SPECIALTY_LABELS[member.specialty] || member.specialty}
                        {isEditingTeam && (
                          <button
                            onClick={() => handleRemoveSpecialty(member.id)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => onNavigateToTab("equipe")}
              >
                <Users className="h-4 w-4 mr-2" />
                Gérer l'équipe
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Go/No-Go Dialog */}
      <Dialog open={showGoDialog} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isChangingDecision ? (
                "Modifier la décision Go/No-Go"
              ) : pendingDecision === "go" ? (
                <><ThumbsUp className="h-5 w-5 text-green-600" /> Confirmer la décision Go</>
              ) : (
                <><ThumbsDown className="h-5 w-5 text-red-600" /> Confirmer la décision No-Go</>
              )}
            </DialogTitle>
            <DialogDescription>
              {isChangingDecision
                ? "Choisissez une nouvelle décision pour ce concours."
                : pendingDecision === "go"
                ? "Vous confirmez vouloir répondre à ce concours."
                : "Vous confirmez ne pas répondre à ce concours."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isChangingDecision && (
              <div className="flex gap-3">
                <Button
                  variant={pendingDecision === "go" ? "default" : "outline"}
                  className={cn(pendingDecision === "go" && "bg-green-600 hover:bg-green-700", "flex-1")}
                  onClick={() => setPendingDecision("go")}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" /> GO
                </Button>
                <Button
                  variant={pendingDecision === "no_go" ? "default" : "outline"}
                  className={cn(pendingDecision === "no_go" && "bg-red-600 hover:bg-red-700", "flex-1")}
                  onClick={() => setPendingDecision("no_go")}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" /> NO-GO
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={goDecisionNotes}
                onChange={(e) => setGoDecisionNotes(e.target.value)}
                placeholder="Raison de la décision..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>Annuler</Button>
            <Button
              onClick={confirmDecision}
              disabled={!pendingDecision}
              className={cn(
                pendingDecision === "go" && "bg-green-600 hover:bg-green-700",
                pendingDecision === "no_go" && "bg-red-600 hover:bg-red-700"
              )}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
