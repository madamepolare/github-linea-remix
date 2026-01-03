import { useState } from "react";
import { format } from "date-fns";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
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

interface TenderGeneralTabProps {
  tender: Tender;
  onUpdateStatus: (status: TenderStatus, notes?: string) => void;
}

export function TenderGeneralTab({ tender, onUpdateStatus }: TenderGeneralTabProps) {
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decisionType, setDecisionType] = useState<"go" | "no_go" | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(['dates', 'project', 'client', 'procedure', 'criteria']);

  const { criteria, addCriterion, deleteCriterion, totalWeight, priceWeight, technicalWeight } = useTenderCriteria(tender.id);
  const { 
    candidatureDocuments, 
    offreDocuments, 
    candidatureProgress, 
    offreProgress, 
    totalProgress,
    toggleComplete,
    loadDefaultDocuments,
  } = useTenderRequiredDocuments(tender.id);

  const [newCriterion, setNewCriterion] = useState({ name: '', weight: 0, type: 'technical' as CriterionType });

  const handleDecision = () => {
    if (decisionType) {
      onUpdateStatus(decisionType, decisionNotes);
      setShowDecisionDialog(false);
      setDecisionNotes("");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const statuses: TenderStatus[] = ['repere', 'en_analyse', 'go', 'en_montage', 'depose', 'gagne'];
  const currentIndex = statuses.indexOf(tender.status);

  const getDaysUntilDeadline = () => {
    if (!tender.submission_deadline) return null;
    const deadline = new Date(tender.submission_deadline);
    const now = new Date();
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = getDaysUntilDeadline();

  return (
    <div className="space-y-6">
      {/* Status Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Progression</span>
            {daysRemaining !== null && (
              <Badge 
                variant={daysRemaining < 7 ? "destructive" : daysRemaining < 14 ? "secondary" : "outline"}
                className="font-normal"
              >
                <Clock className="h-3 w-3 mr-1" />
                {daysRemaining > 0 ? `J-${daysRemaining}` : daysRemaining === 0 ? "Aujourd'hui" : "Dépassé"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {statuses.map((status, index) => {
              const isActive = status === tender.status;
              const isPast = index < currentIndex;
              
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Market Identification */}
        <Card>
          <Collapsible open={expandedSections.includes('market')} onOpenChange={() => toggleSection('market')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Identification du marché
                  </span>
                  {expandedSections.includes('market') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3 pt-0">
                <InfoRow label="Référence" value={tender.reference} />
                <InfoRow label="N° consultation" value={tender.consultation_number} />
                <InfoRow label="Code groupe" value={tender.group_code} />
                {tender.market_object && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Objet du marché</p>
                    <p className="text-sm">{tender.market_object}</p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Client Info */}
        <Card>
          <Collapsible open={expandedSections.includes('client')} onOpenChange={() => toggleSection('client')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Maître d'ouvrage
                  </span>
                  {expandedSections.includes('client') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3 pt-0">
                <InfoRow label="Nom" value={tender.client_name} />
                <InfoRow 
                  label="Type" 
                  value={tender.client_type ? CLIENT_TYPES.find(t => t.value === tender.client_type)?.label : null} 
                />
                <InfoRow label="Direction" value={tender.client_direction} />
                <InfoRow label="Pouvoir adjudicateur" value={tender.contracting_authority} />
                {(tender.client_contact_name || tender.client_contact_phone || tender.client_contact_email) && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Contact</p>
                    {tender.client_contact_name && (
                      <p className="text-sm">{tender.client_contact_name}</p>
                    )}
                    {tender.client_contact_phone && (
                      <p className="text-sm flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" /> {tender.client_contact_phone}
                      </p>
                    )}
                    {tender.client_contact_email && (
                      <p className="text-sm flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {tender.client_contact_email}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Project Info */}
        <Card>
          <Collapsible open={expandedSections.includes('project')} onOpenChange={() => toggleSection('project')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Projet
                  </span>
                  {expandedSections.includes('project') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3 pt-0">
                <InfoRow label="Localisation" value={tender.location} />
                <InfoRow label="Région" value={tender.region} />
                <InfoRow 
                  label="Surface" 
                  value={tender.surface_area ? `${tender.surface_area.toLocaleString()} m²` : null}
                  icon={<Ruler className="h-3 w-3" />}
                />
                <InfoRow 
                  label="Budget estimé" 
                  value={tender.estimated_budget ? `${(tender.estimated_budget / 1000000).toFixed(2)} M€` : null}
                  icon={<Euro className="h-3 w-3" />}
                  badge={tender.budget_disclosed ? 'Affiché' : 'Non affiché'}
                />
                {tender.work_nature_tags && tender.work_nature_tags.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Nature des travaux</p>
                    <div className="flex flex-wrap gap-1">
                      {tender.work_nature_tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Procedure */}
        <Card>
          <Collapsible open={expandedSections.includes('procedure')} onOpenChange={() => toggleSection('procedure')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Procédure
                  </span>
                  {expandedSections.includes('procedure') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3 pt-0">
                <InfoRow 
                  label="Type" 
                  value={tender.procedure_type ? PROCEDURE_TYPE_LABELS[tender.procedure_type] : null} 
                />
                <InfoRow 
                  label="Groupement" 
                  value={tender.allows_joint_venture ? 'Autorisé' : 'Non autorisé'}
                  badge={tender.joint_venture_type ? JOINT_VENTURE_TYPE_LABELS[tender.joint_venture_type as keyof typeof JOINT_VENTURE_TYPE_LABELS] : undefined}
                />
                <InfoRow 
                  label="Variantes" 
                  value={tender.allows_variants ? 'Autorisées' : 'Non autorisées'}
                />
                <InfoRow 
                  label="Négociation" 
                  value={tender.allows_negotiation ? 'Prévue' : 'Non prévue'}
                  badge={tender.negotiation_candidates_count ? `${tender.negotiation_candidates_count} candidats` : undefined}
                />
                <InfoRow 
                  label="Validité offres" 
                  value={tender.offer_validity_days ? `${tender.offer_validity_days} jours` : null}
                />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      {/* Key Dates */}
      <Card>
        <Collapsible open={expandedSections.includes('dates')} onOpenChange={() => toggleSection('dates')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates clés
                </span>
                {expandedSections.includes('dates') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
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
                </div>
                <div className="space-y-3">
                  {tender.go_decision_date && (
                    <DateRow 
                      label="Décision Go/No-Go" 
                      date={tender.go_decision_date}
                      badge={tender.status === 'go' ? 'Go' : tender.status === 'no_go' ? 'No-Go' : undefined}
                      badgeVariant={tender.status === 'go' ? 'success' : 'destructive'}
                    />
                  )}
                  {tender.site_visit_required && (tender.site_visit_contact_name || tender.site_visit_contact_phone) && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium mb-1">Contact visite</p>
                      {tender.site_visit_contact_name && (
                        <p className="text-sm">{tender.site_visit_contact_name}</p>
                      )}
                      {tender.site_visit_contact_phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {tender.site_visit_contact_phone}
                        </p>
                      )}
                      {tender.site_visit_contact_email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {tender.site_visit_contact_email}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Judgment Criteria */}
      <Card>
        <Collapsible open={expandedSections.includes('criteria')} onOpenChange={() => toggleSection('criteria')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Critères de jugement
                  {criteria.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      Prix {priceWeight}% / Technique {technicalWeight}%
                    </Badge>
                  )}
                </span>
                {expandedSections.includes('criteria') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {criteria.length > 0 ? (
                <div className="space-y-3">
                  {criteria.map(criterion => (
                    <div key={criterion.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{criterion.name}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {CRITERION_TYPE_LABELS[criterion.criterion_type]}
                            </Badge>
                            <span className="text-sm font-medium">{criterion.weight}%</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => deleteCriterion.mutate(criterion.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <Progress value={criterion.weight} className="h-2" />
                        {criterion.sub_criteria && criterion.sub_criteria.length > 0 && (
                          <div className="mt-2 pl-4 space-y-1">
                            {criterion.sub_criteria.map(sub => (
                              <div key={sub.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>• {sub.name}</span>
                                <span>{sub.weight}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {totalWeight !== 100 && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Total: {totalWeight}% (doit être 100%)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun critère défini</p>
              )}
              
              {/* Add criterion form */}
              <div className="flex items-end gap-2 pt-2 border-t">
                <div className="flex-1">
                  <Input
                    placeholder="Nom du critère"
                    value={newCriterion.name}
                    onChange={(e) => setNewCriterion(prev => ({ ...prev, name: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    placeholder="%"
                    value={newCriterion.weight || ''}
                    onChange={(e) => setNewCriterion(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                    className="h-8 text-sm"
                  />
                </div>
                <Select
                  value={newCriterion.type}
                  onValueChange={(v) => setNewCriterion(prev => ({ ...prev, type: v as CriterionType }))}
                >
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CRITERION_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="h-8"
                  disabled={!newCriterion.name || !newCriterion.weight}
                  onClick={() => {
                    addCriterion.mutate({
                      name: newCriterion.name,
                      weight: newCriterion.weight,
                      criterion_type: newCriterion.type,
                    });
                    setNewCriterion({ name: '', weight: 0, type: 'technical' });
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Required Documents Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pièces à remettre
            </span>
            <Badge variant={totalProgress === 100 ? "default" : "secondary"}>
              {totalProgress}% complété
            </Badge>
          </CardTitle>
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
                Charger les documents par défaut
              </Button>
            </div>
          ) : (
            <>
              {/* Candidature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Candidature</p>
                  <span className="text-xs text-muted-foreground">{candidatureProgress}%</span>
                </div>
                <Progress value={candidatureProgress} className="h-2 mb-2" />
                <div className="space-y-1">
                  {candidatureDocuments.slice(0, 4).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={doc.is_completed}
                        onCheckedChange={(checked) => toggleComplete.mutate({ id: doc.id, is_completed: !!checked })}
                      />
                      <span className={cn("text-xs", doc.is_completed && "line-through text-muted-foreground")}>
                        {doc.name}
                      </span>
                      {doc.is_mandatory && <Badge variant="outline" className="text-[10px] px-1">Requis</Badge>}
                    </div>
                  ))}
                  {candidatureDocuments.length > 4 && (
                    <p className="text-xs text-muted-foreground pl-6">+{candidatureDocuments.length - 4} autres</p>
                  )}
                </div>
              </div>

              {/* Offre */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Offre</p>
                  <span className="text-xs text-muted-foreground">{offreProgress}%</span>
                </div>
                <Progress value={offreProgress} className="h-2 mb-2" />
                <div className="space-y-1">
                  {offreDocuments.slice(0, 4).map(doc => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={doc.is_completed}
                        onCheckedChange={(checked) => toggleComplete.mutate({ id: doc.id, is_completed: !!checked })}
                      />
                      <span className={cn("text-xs", doc.is_completed && "line-through text-muted-foreground")}>
                        {doc.name}
                      </span>
                      {doc.is_mandatory && <Badge variant="outline" className="text-[10px] px-1">Requis</Badge>}
                    </div>
                  ))}
                  {offreDocuments.length > 4 && (
                    <p className="text-xs text-muted-foreground pl-6">+{offreDocuments.length - 4} autres</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
  icon,
}: { 
  label: string; 
  value: string | null | undefined;
  badge?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-sm flex items-center gap-2">
        {value || <span className="text-muted-foreground">-</span>}
        {badge && value && (
          <Badge variant="secondary" className="text-xs">{badge}</Badge>
        )}
      </span>
    </div>
  );
}
