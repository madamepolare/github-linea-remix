import { useState, useMemo } from "react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Calendar,
  MapPin,
  Building2,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Euro,
  Ruler,
  Phone,
  Mail,
  Scale,
  Percent,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Sparkles,
  CircleDot,
  CheckCircle,
  Circle,
  ArrowRight,
  Eye,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tender, TenderStatus, CriterionType } from "@/lib/tenderTypes";
import { 
  TENDER_STATUS_LABELS, 
  TENDER_STATUS_COLORS,
  PROCEDURE_TYPE_LABELS,
  JOINT_VENTURE_TYPE_LABELS,
  CRITERION_TYPE_LABELS,
  CLIENT_TYPES,
} from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";
import { useTenderCriteria } from "@/hooks/useTenderCriteria";
import { useTenderRequiredDocuments } from "@/hooks/useTenderRequiredDocuments";
import { useTenderDocuments } from "@/hooks/useTenderDocuments";
import { useTenderTeam } from "@/hooks/useTenderTeam";

interface TenderGeneralTabProps {
  tender: Tender;
  onUpdateStatus: (status: TenderStatus, notes?: string) => void;
}

interface ActionItem {
  id: string;
  label: string;
  description?: string;
  isComplete: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'preparation' | 'documents' | 'team' | 'submission';
  action?: () => void;
}

export function TenderGeneralTab({ tender, onUpdateStatus }: TenderGeneralTabProps) {
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decisionType, setDecisionType] = useState<"go" | "no_go" | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const { criteria, totalWeight, priceWeight, technicalWeight } = useTenderCriteria(tender.id);
  const { 
    candidatureDocuments, 
    offreDocuments, 
    candidatureProgress, 
    offreProgress, 
    totalProgress,
    toggleComplete,
    loadDefaultDocuments,
  } = useTenderRequiredDocuments(tender.id);
  const { documents } = useTenderDocuments(tender.id);
  const { teamMembers } = useTenderTeam(tender.id);

  const handleDecision = () => {
    if (decisionType) {
      onUpdateStatus(decisionType, decisionNotes);
      setShowDecisionDialog(false);
      setDecisionNotes("");
    }
  };

  // Calculate key dates
  const submissionDeadline = tender.submission_deadline ? new Date(tender.submission_deadline) : null;
  const offerValidityEndDate = submissionDeadline && tender.offer_validity_days
    ? addDays(submissionDeadline, tender.offer_validity_days)
    : null;
  
  const getDaysUntilDeadline = () => {
    if (!submissionDeadline) return null;
    const now = new Date();
    const diff = Math.ceil((submissionDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysUntilDeadline();

  // Generate AI-powered action checklist
  const actionItems = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = [];

    // 1. Go/No-Go decision
    const hasGoDecision = tender.status === 'go' || tender.status === 'no_go';
    items.push({
      id: 'go_decision',
      label: 'Prendre la décision Go/No-Go',
      description: hasGoDecision 
        ? `Décision: ${tender.status === 'go' ? 'Go' : 'No-Go'}` 
        : 'Évaluer l\'opportunité et décider si on répond',
      isComplete: hasGoDecision,
      priority: 'high',
      category: 'preparation',
    });

    // 2. Upload DCE documents
    const hasDocuments = documents && documents.length > 0;
    items.push({
      id: 'upload_dce',
      label: 'Télécharger les documents DCE',
      description: hasDocuments 
        ? `${documents.length} document(s) uploadé(s)` 
        : 'RC, CCAP, CCTP, Note programme...',
      isComplete: hasDocuments,
      priority: 'high',
      category: 'documents',
    });

    // 3. Analyze DCE with AI
    const hasAnalyzedDocs = documents?.some(d => d.extracted_data);
    items.push({
      id: 'analyze_dce',
      label: 'Analyser le DCE avec l\'IA',
      description: hasAnalyzedDocs 
        ? 'Données extraites automatiquement' 
        : 'Extraire dates, critères, exigences...',
      isComplete: !!hasAnalyzedDocs,
      priority: 'high',
      category: 'documents',
    });

    // 4. Site visit (if applicable)
    if (tender.site_visit_required !== false) {
      const hasSiteVisitDate = !!tender.site_visit_date;
      items.push({
        id: 'site_visit',
        label: tender.site_visit_required ? 'Effectuer la visite de site (obligatoire)' : 'Visite de site (facultative)',
        description: hasSiteVisitDate 
          ? `Prévue le ${format(new Date(tender.site_visit_date!), "dd MMM yyyy", { locale: fr })}` 
          : 'Date à définir',
        isComplete: false, // Would need a dedicated field for this
        priority: tender.site_visit_required ? 'high' : 'medium',
        category: 'preparation',
      });
    }

    // 5. Team composition
    const hasTeam = teamMembers && teamMembers.length > 0;
    const hasMandataire = teamMembers?.some(m => m.role === 'mandataire');
    items.push({
      id: 'compose_team',
      label: 'Constituer l\'équipe projet',
      description: hasTeam 
        ? `${teamMembers.length} membre(s) - ${hasMandataire ? 'Mandataire défini' : 'Mandataire à définir'}` 
        : 'Mandataire, cotraitants, sous-traitants...',
      isComplete: hasTeam && hasMandataire,
      priority: 'high',
      category: 'team',
    });

    // 6. Fill judgment criteria
    const hasCriteria = criteria && criteria.length > 0 && totalWeight === 100;
    items.push({
      id: 'fill_criteria',
      label: 'Renseigner les critères de jugement',
      description: criteria && criteria.length > 0 
        ? `${criteria.length} critère(s) - ${totalWeight}% total` 
        : 'Prix, valeur technique, délais...',
      isComplete: hasCriteria,
      priority: 'medium',
      category: 'preparation',
    });

    // 7. Prepare candidature documents
    const candidatureComplete = candidatureProgress === 100;
    items.push({
      id: 'candidature_docs',
      label: 'Préparer les pièces de candidature',
      description: candidatureDocuments.length > 0 
        ? `${candidatureProgress}% complété (${candidatureDocuments.filter(d => d.is_completed).length}/${candidatureDocuments.length})` 
        : 'DC1, DC2, attestations...',
      isComplete: candidatureComplete,
      priority: 'medium',
      category: 'submission',
    });

    // 8. Prepare offer documents
    const offerComplete = offreProgress === 100;
    items.push({
      id: 'offer_docs',
      label: 'Préparer les pièces de l\'offre',
      description: offreDocuments.length > 0 
        ? `${offreProgress}% complété (${offreDocuments.filter(d => d.is_completed).length}/${offreDocuments.length})` 
        : 'Mémoire technique, planning, DPGF...',
      isComplete: offerComplete,
      priority: 'medium',
      category: 'submission',
    });

    // 9. Submit
    const isSubmitted = tender.status === 'depose' || tender.status === 'gagne' || tender.status === 'perdu';
    items.push({
      id: 'submit',
      label: 'Déposer l\'offre',
      description: isSubmitted 
        ? 'Offre déposée' 
        : submissionDeadline 
          ? `Avant le ${format(submissionDeadline, "dd MMM yyyy à HH:mm", { locale: fr })}` 
          : 'Date limite à définir',
      isComplete: isSubmitted,
      priority: 'high',
      category: 'submission',
    });

    return items;
  }, [tender, documents, teamMembers, criteria, totalWeight, candidatureDocuments, offreDocuments, candidatureProgress, offreProgress]);

  const completedCount = actionItems.filter(i => i.isComplete).length;
  const overallProgress = Math.round((completedCount / actionItems.length) * 100);

  const highPriorityIncomplete = actionItems.filter(i => !i.isComplete && i.priority === 'high');

  const statuses: TenderStatus[] = ['repere', 'en_analyse', 'go', 'en_montage', 'depose', 'gagne'];
  const currentIndex = statuses.indexOf(tender.status);

  return (
    <div className="space-y-6">
      {/* AI Assistant Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Assistant de réponse</CardTitle>
                <CardDescription>
                  {overallProgress}% de préparation complétée
                </CardDescription>
              </div>
            </div>
            {daysRemaining !== null && (
              <Badge 
                variant={daysRemaining < 7 ? "destructive" : daysRemaining < 14 ? "secondary" : "outline"}
                className="font-medium text-sm"
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                {daysRemaining > 0 ? `J-${daysRemaining}` : daysRemaining === 0 ? "Aujourd'hui" : `Dépassé (J+${Math.abs(daysRemaining)})`}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={overallProgress} className="h-2" />
          
          {/* Quick status timeline */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {statuses.map((status, index) => {
              const isActive = status === tender.status;
              const isPast = index < currentIndex;
              
              return (
                <div key={status} className="flex items-center gap-1.5">
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
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                      isActive && TENDER_STATUS_COLORS[status],
                      isPast && "bg-muted text-muted-foreground",
                      !isActive && !isPast && "bg-muted/50 text-muted-foreground/70 hover:bg-muted hover:text-muted-foreground"
                    )}
                  >
                    {TENDER_STATUS_LABELS[status]}
                  </button>
                  {index < statuses.length - 1 && (
                    <ArrowRight className={cn(
                      "h-3 w-3 shrink-0",
                      isPast ? "text-muted-foreground/50" : "text-border"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Alert for high priority items */}
          {highPriorityIncomplete.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  {highPriorityIncomplete.length} action(s) prioritaire(s) à effectuer
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                  {highPriorityIncomplete.slice(0, 2).map(i => i.label).join(', ')}
                  {highPriorityIncomplete.length > 2 && '...'}
                </p>
              </div>
            </div>
          )}

          {/* No-Go reason display - Always visible when No-Go */}
          {tender.status === 'no_go' && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="font-medium text-destructive">Appel d'offres abandonné (No-Go)</span>
              </div>
              {tender.go_decision_notes ? (
                <div className="pl-6">
                  <p className="text-sm text-muted-foreground mb-1">Raison de l'abandon :</p>
                  <p className="text-sm italic bg-background/50 rounded p-2">
                    "{tender.go_decision_notes}"
                  </p>
                  {tender.go_decision_date && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Décision prise le {format(new Date(tender.go_decision_date), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pl-6">Aucune raison spécifiée</p>
              )}
            </div>
          )}

          {/* No-Go button */}
          {tender.status !== 'no_go' && tender.status !== 'perdu' && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setDecisionType('no_go');
                  setShowDecisionDialog(true);
                }}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Marquer No-Go
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main: Action Checklist */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Checklist de préparation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {actionItems.map((item) => (
                <div 
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors",
                    item.isComplete ? "bg-muted/30" : "hover:bg-muted/50"
                  )}
                >
                  <div className="mt-0.5">
                    {item.isComplete ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : item.priority === 'high' ? (
                      <CircleDot className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium",
                      item.isComplete && "text-muted-foreground line-through"
                    )}>
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {!item.isComplete && item.priority === 'high' && (
                    <Badge variant="outline" className="text-xs shrink-0 text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-600">
                      Prioritaire
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Required Documents Quick View */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Pièces à remettre
                </CardTitle>
                <Badge variant={totalProgress === 100 ? "default" : "secondary"}>
                  {totalProgress}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidatureDocuments.length === 0 && offreDocuments.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Aucun document requis défini</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadDefaultDocuments.mutate()}
                    disabled={loadDefaultDocuments.isPending}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Charger la liste par défaut
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Candidature */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Candidature</p>
                      <span className="text-xs text-muted-foreground">{candidatureProgress}%</span>
                    </div>
                    <Progress value={candidatureProgress} className="h-1.5" />
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {candidatureDocuments.map(doc => (
                        <div key={doc.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={doc.is_completed}
                            onCheckedChange={(checked) => toggleComplete.mutate({ id: doc.id, is_completed: !!checked })}
                            className="h-3.5 w-3.5"
                          />
                          <span className={cn("text-xs truncate", doc.is_completed && "line-through text-muted-foreground")}>
                            {doc.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Offre */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Offre</p>
                      <span className="text-xs text-muted-foreground">{offreProgress}%</span>
                    </div>
                    <Progress value={offreProgress} className="h-1.5" />
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {offreDocuments.map(doc => (
                        <div key={doc.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={doc.is_completed}
                            onCheckedChange={(checked) => toggleComplete.mutate({ id: doc.id, is_completed: !!checked })}
                            className="h-3.5 w-3.5"
                          />
                          <span className={cn("text-xs truncate", doc.is_completed && "line-through text-muted-foreground")}>
                            {doc.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Key Info */}
        <div className="space-y-4">
          {/* Key Dates */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dates clés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Deadline */}
              <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-xs text-muted-foreground">Date limite de dépôt</p>
                <p className="font-semibold text-destructive">
                  {submissionDeadline 
                    ? format(submissionDeadline, "EEEE dd MMMM yyyy 'à' HH:mm", { locale: fr })
                    : '-'
                  }
                </p>
              </div>

              {/* Offer validity end */}
              {offerValidityEndDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fin validité offres</span>
                  <span className="font-medium">
                    {format(offerValidityEndDate, "dd/MM/yyyy", { locale: fr })}
                  </span>
                </div>
              )}
              {tender.offer_validity_days && (
                <p className="text-xs text-muted-foreground -mt-2">
                  ({tender.offer_validity_days} jours après dépôt)
                </p>
              )}

              {/* Site Visit */}
              <div className="flex items-center justify-between py-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Visite de site</span>
                </div>
                <Badge variant={
                  tender.site_visit_required === true 
                    ? "destructive" 
                    : tender.site_visit_required === false 
                      ? "secondary" 
                      : "outline"
                }>
                  {tender.site_visit_required === true 
                    ? "Obligatoire" 
                    : tender.site_visit_required === false 
                      ? "Non requise"
                      : "Non défini"
                  }
                </Badge>
              </div>
              {tender.site_visit_date && (
                <div className="flex items-center justify-between text-sm -mt-2">
                  <span className="text-muted-foreground">Date visite</span>
                  <span>{format(new Date(tender.site_visit_date), "dd/MM/yyyy", { locale: fr })}</span>
                </div>
              )}
              {tender.site_visit_contact_name && (
                <div className="text-xs text-muted-foreground -mt-1">
                  Contact: {tender.site_visit_contact_name}
                  {tender.site_visit_contact_phone && ` - ${tender.site_visit_contact_phone}`}
                </div>
              )}

              {/* Other dates */}
              {tender.jury_date && (
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Jury / Commission</span>
                  <span>{format(new Date(tender.jury_date), "dd/MM/yyyy", { locale: fr })}</span>
                </div>
              )}
              {tender.results_date && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Résultats</span>
                  <span>{format(new Date(tender.results_date), "dd/MM/yyyy", { locale: fr })}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Informations</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoRow label="Client" value={tender.client_name} />
              <InfoRow label="Lieu" value={tender.location} />
              <InfoRow 
                label="Budget" 
                value={tender.estimated_budget ? `${(tender.estimated_budget / 1000000).toFixed(2)} M€` : null}
              />
              <InfoRow 
                label="Surface" 
                value={tender.surface_area ? `${tender.surface_area.toLocaleString()} m²` : null}
              />
              <InfoRow 
                label="Procédure" 
                value={tender.procedure_type ? PROCEDURE_TYPE_LABELS[tender.procedure_type] : null}
              />
              
              {/* Criteria summary */}
              {criteria && criteria.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Critères</p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">Prix {priceWeight}%</Badge>
                    <Badge variant="outline" className="text-xs">Technique {technicalWeight}%</Badge>
                  </div>
                </div>
              )}

              {/* Procedure details */}
              <div className="pt-2 border-t space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Groupement</span>
                  <span>{tender.allows_joint_venture ? 'Oui' : 'Non'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Variantes</span>
                  <span>{tender.allows_variants ? 'Oui' : 'Non'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Négociation</span>
                  <span>{tender.allows_negotiation ? 'Oui' : 'Non'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-primary/20">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium">Conseil IA</p>
                  <p className="text-xs text-muted-foreground">
                    {!documents || documents.length === 0 
                      ? "Commencez par uploader les documents DCE pour que l'IA puisse analyser les exigences."
                      : !criteria || criteria.length === 0
                        ? "Renseignez les critères de jugement pour adapter votre stratégie de réponse."
                        : daysRemaining && daysRemaining < 7
                          ? "Échéance proche ! Concentrez-vous sur les éléments prioritaires."
                          : "Tout est en bonne voie. Continuez à préparer vos pièces."
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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

function InfoRow({ 
  label, 
  value,
}: { 
  label: string; 
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate max-w-[60%]">
        {value || <span className="text-muted-foreground font-normal">-</span>}
      </span>
    </div>
  );
}
