import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { AttentionItemsSection } from "../AttentionItemsSection";
import { ObservationsSection } from "../ObservationsSection";
import { ReportData, TechnicalDecision, BlockingPoint } from "@/hooks/useMeetingReportData";
import { ProjectObservation, ProjectLot } from "@/hooks/useChantier";
import { MeetingAttentionItem, CreateAttentionItemInput } from "@/hooks/useMeetingAttentionItems";
import { ProjectMOEMember } from "@/hooks/useProjectMOE";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Lightbulb, AlertOctagon, Calendar, Plus, Trash2, FileText, Clock, CheckCircle2,
  AlertTriangle, CircleDot,
} from "lucide-react";

interface PointsTabProps {
  reportData: ReportData;
  onUpdateReportData: <K extends keyof ReportData>(section: K, value: ReportData[K]) => void;
  onUpdateField: <K extends keyof ReportData>(section: K, field: keyof ReportData[K], value: unknown) => void;
  meetingId: string;
  // Attention items
  attentionItems: MeetingAttentionItem[];
  onCreateAttentionItem: (item: CreateAttentionItemInput) => void;
  onUpdateAttentionItem: (id: string, updates: Partial<MeetingAttentionItem>) => void;
  onDeleteAttentionItem: (id: string) => void;
  // Observations
  meetingObservations: ProjectObservation[];
  allProjectObservations: ProjectObservation[];
  lots: ProjectLot[];
  companies: Array<{ id: string; name: string }>;
  moeTeam: ProjectMOEMember[];
  onStatusChange: (id: string, status: string) => void;
  onAddObservation: (obs: Omit<ProjectObservation, "id" | "created_at" | "updated_at" | "workspace_id" | "project_id">) => void;
  onUpdateObservation: (id: string, updates: Partial<ProjectObservation>) => void;
  observationComments: Record<string, string>;
  onUpdateObservationComment: (id: string, comment: string) => void;
}

const BLOCKING_STATUS_CONFIG = {
  open: { label: "Ouvert", color: "bg-red-100 text-red-700", icon: CircleDot },
  in_progress: { label: "En cours", color: "bg-orange-100 text-orange-700", icon: Clock },
  resolved: { label: "Levé", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
};

export function PointsTab({
  reportData,
  onUpdateReportData,
  onUpdateField,
  meetingId,
  attentionItems,
  onCreateAttentionItem,
  onUpdateAttentionItem,
  onDeleteAttentionItem,
  meetingObservations,
  allProjectObservations,
  lots,
  companies,
  moeTeam,
  onStatusChange,
  onAddObservation,
  onUpdateObservation,
  observationComments,
  onUpdateObservationComment,
}: PointsTabProps) {
  const [isAddDecisionOpen, setIsAddDecisionOpen] = useState(false);
  const [isAddBlockingOpen, setIsAddBlockingOpen] = useState(false);
  
  const [newDecision, setNewDecision] = useState<Omit<TechnicalDecision, "id">>({
    description: "",
    decision: "",
    reference_doc: "",
  });
  
  const [newBlocking, setNewBlocking] = useState<Omit<BlockingPoint, "id">>({
    description: "",
    lot_id: null,
    responsibility: "",
    consequence: "",
    resolution_date: null,
    status: "open",
  });

  const handleAddDecision = () => {
    if (!newDecision.description.trim()) return;
    
    onUpdateReportData("technical_decisions", [
      ...reportData.technical_decisions,
      { ...newDecision, id: crypto.randomUUID() },
    ]);
    
    setNewDecision({ description: "", decision: "", reference_doc: "" });
    setIsAddDecisionOpen(false);
  };

  const handleRemoveDecision = (id: string) => {
    onUpdateReportData(
      "technical_decisions",
      reportData.technical_decisions.filter(d => d.id !== id)
    );
  };

  const handleAddBlocking = () => {
    if (!newBlocking.description.trim()) return;
    
    onUpdateReportData("blocking_points", [
      ...reportData.blocking_points,
      { ...newBlocking, id: crypto.randomUUID() },
    ]);
    
    setNewBlocking({
      description: "",
      lot_id: null,
      responsibility: "",
      consequence: "",
      resolution_date: null,
      status: "open",
    });
    setIsAddBlockingOpen(false);
  };

  const handleRemoveBlocking = (id: string) => {
    onUpdateReportData(
      "blocking_points",
      reportData.blocking_points.filter(b => b.id !== id)
    );
  };

  const handleUpdateBlocking = (id: string, updates: Partial<BlockingPoint>) => {
    onUpdateReportData(
      "blocking_points",
      reportData.blocking_points.map(b => b.id === id ? { ...b, ...updates } : b)
    );
  };

  return (
    <div className="space-y-4">
      {/* Points abordés (Attention Items) - existing component */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Points abordés
            <Badge variant="secondary" className="text-xs">{attentionItems.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttentionItemsSection
            items={attentionItems}
            companies={companies}
            lots={lots}
            moeTeam={moeTeam}
            meetingId={meetingId}
            onCreateItem={onCreateAttentionItem}
            onUpdateItem={onUpdateAttentionItem}
            onDeleteItem={onDeleteAttentionItem}
          />
        </CardContent>
      </Card>

      {/* Section 6 - Points techniques et décisions */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Points techniques & Décisions
              <Badge variant="secondary" className="text-xs">{reportData.technical_decisions.length}</Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsAddDecisionOpen(true)} className="h-7">
              <Plus className="h-3 w-3 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {reportData.technical_decisions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun point technique enregistré.</p>
            </div>
          ) : (
            reportData.technical_decisions.map((decision, index) => (
              <div key={decision.id} className="p-3 rounded-lg border bg-card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{decision.description}</p>
                    {decision.decision && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Décision :</span> {decision.decision}
                      </p>
                    )}
                    {decision.reference_doc && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {decision.reference_doc}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleRemoveDecision(decision.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Section 7 - Points bloquants / Réserves */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-destructive" />
              Points bloquants / Réserves
              <Badge variant="secondary" className="text-xs">{reportData.blocking_points.length}</Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsAddBlockingOpen(true)} className="h-7">
              <Plus className="h-3 w-3 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {reportData.blocking_points.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <AlertOctagon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun point bloquant enregistré.</p>
            </div>
          ) : (
            reportData.blocking_points.map((point) => {
              const lot = point.lot_id ? lots.find(l => l.id === point.lot_id) : null;
              const statusConfig = BLOCKING_STATUS_CONFIG[point.status];
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={point.id} className="p-3 rounded-lg border bg-card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", statusConfig.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {lot && (
                          <Badge variant="outline" className="text-xs">
                            {lot.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{point.description}</p>
                      {point.responsibility && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Responsabilité :</span> {point.responsibility}
                        </p>
                      )}
                      {point.consequence && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Conséquence :</span> {point.consequence}
                        </p>
                      )}
                      {point.resolution_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Levée demandée : {format(parseISO(point.resolution_date), "d MMM yyyy", { locale: fr })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Select
                        value={point.status}
                        onValueChange={(value) => handleUpdateBlocking(point.id, { status: value as BlockingPoint["status"] })}
                      >
                        <SelectTrigger className="h-7 w-[100px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Ouvert</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="resolved">Levé</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleRemoveBlocking(point.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Observations & Réserves - existing component */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Observations & Réserves du chantier
            <Badge variant="secondary" className="text-xs">{meetingObservations.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ObservationsSection
            observations={meetingObservations}
            allProjectObservations={allProjectObservations}
            lots={lots}
            meetingId={meetingId}
            onStatusChange={onStatusChange}
            onAddObservation={onAddObservation}
            onUpdateObservation={onUpdateObservation}
            onUpdateComment={onUpdateObservationComment}
            observationComments={observationComments}
          />
        </CardContent>
      </Card>

      {/* Section 8 - Planning */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Planning & Délais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Rappel du planning contractuel</Label>
            <Textarea
              value={reportData.planning.contractual_reminder}
              onChange={(e) => onUpdateField("planning", "contractual_reminder", e.target.value)}
              placeholder="Dates clés, jalons..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Décalages constatés</Label>
            <Textarea
              value={reportData.planning.delays_noted}
              onChange={(e) => onUpdateField("planning", "delays_noted", e.target.value)}
              placeholder="Retards, avances..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Actions correctives demandées</Label>
            <Textarea
              value={reportData.planning.corrective_actions}
              onChange={(e) => onUpdateField("planning", "corrective_actions", e.target.value)}
              placeholder="Mesures à prendre..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <Label className="text-sm">Impact sur la date de livraison ?</Label>
            <Switch
              checked={reportData.planning.delivery_impact}
              onCheckedChange={(checked) => onUpdateField("planning", "delivery_impact", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog - Add Technical Decision */}
      <Dialog open={isAddDecisionOpen} onOpenChange={setIsAddDecisionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un point technique</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Description du point</Label>
              <Textarea
                value={newDecision.description}
                onChange={(e) => setNewDecision({ ...newDecision, description: e.target.value })}
                placeholder="Décrire le point technique..."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Décision prise</Label>
              <Textarea
                value={newDecision.decision}
                onChange={(e) => setNewDecision({ ...newDecision, decision: e.target.value })}
                placeholder="Solution retenue..."
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Référence document (optionnel)</Label>
              <Input
                value={newDecision.reference_doc || ""}
                onChange={(e) => setNewDecision({ ...newDecision, reference_doc: e.target.value })}
                placeholder="Plan, CCTP..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDecisionOpen(false)}>Annuler</Button>
            <Button onClick={handleAddDecision} disabled={!newDecision.description.trim()}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Add Blocking Point */}
      <Dialog open={isAddBlockingOpen} onOpenChange={setIsAddBlockingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un point bloquant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={newBlocking.description}
                onChange={(e) => setNewBlocking({ ...newBlocking, description: e.target.value })}
                placeholder="Décrire le point bloquant..."
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lot concerné</Label>
              <Select
                value={newBlocking.lot_id || "none"}
                onValueChange={(v) => setNewBlocking({ ...newBlocking, lot_id: v === "none" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non spécifié</SelectItem>
                  {lots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>{lot.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Responsabilité présumée</Label>
              <Input
                value={newBlocking.responsibility}
                onChange={(e) => setNewBlocking({ ...newBlocking, responsibility: e.target.value })}
                placeholder="Entreprise, MOA..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Conséquence</Label>
              <Input
                value={newBlocking.consequence}
                onChange={(e) => setNewBlocking({ ...newBlocking, consequence: e.target.value })}
                placeholder="Retard, surcoût..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Délai de levée demandé</Label>
              <InlineDatePicker
                value={newBlocking.resolution_date ? parseISO(newBlocking.resolution_date) : undefined}
                onChange={(date) => setNewBlocking({ ...newBlocking, resolution_date: date?.toISOString().split("T")[0] || null })}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddBlockingOpen(false)}>Annuler</Button>
            <Button onClick={handleAddBlocking} disabled={!newBlocking.description.trim()}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
