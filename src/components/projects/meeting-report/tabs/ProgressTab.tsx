import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ReportData, LotProgress } from "@/hooks/useMeetingReportData";
import { ProjectLot } from "@/hooks/useChantier";
import { cn } from "@/lib/utils";
import { TrendingUp, Clock, AlertTriangle, Package, ChevronDown, ChevronUp, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProgressTabProps {
  reportData: ReportData;
  onUpdateReportData: <K extends keyof ReportData>(section: K, value: ReportData[K]) => void;
  onUpdateField: <K extends keyof ReportData>(section: K, field: keyof ReportData[K], value: unknown) => void;
  lots: ProjectLot[];
  companies: Array<{ id: string; name: string }>;
  onCreateLot?: (input: { name: string; crm_company_id?: string; color?: string }) => Promise<void>;
  isCreatingLot?: boolean;
}

const STATUS_CONFIG = {
  on_track: {
    label: "À l'heure",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300",
    icon: TrendingUp,
  },
  slight_delay: {
    label: "Léger retard",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300",
    icon: Clock,
  },
  critical: {
    label: "Critique",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300",
    icon: AlertTriangle,
  },
};

export function ProgressTab({
  reportData,
  onUpdateReportData,
  onUpdateField,
  lots,
  companies,
  onCreateLot,
  isCreatingLot,
}: ProgressTabProps) {
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  const [isAddLotDialogOpen, setIsAddLotDialogOpen] = useState(false);
  const [newLotName, setNewLotName] = useState("");
  const [newLotCompanyId, setNewLotCompanyId] = useState<string | null>(null);
  const [newLotColor, setNewLotColor] = useState("#3b82f6");

  const handleAddLot = async () => {
    if (!newLotName.trim() || !onCreateLot) return;
    
    await onCreateLot({
      name: newLotName.trim(),
      crm_company_id: newLotCompanyId || undefined,
      color: newLotColor,
    });
    
    setNewLotName("");
    setNewLotCompanyId(null);
    setNewLotColor("#3b82f6");
    setIsAddLotDialogOpen(false);
  };

  const toggleLotExpanded = (lotId: string) => {
    setExpandedLots(prev => {
      const next = new Set(prev);
      if (next.has(lotId)) {
        next.delete(lotId);
      } else {
        next.add(lotId);
      }
      return next;
    });
  };

  const getLotProgress = (lotId: string): LotProgress | undefined => {
    return reportData.lot_progress.find(lp => lp.lot_id === lotId);
  };

  const updateLotProgress = (lotId: string, updates: Partial<LotProgress>) => {
    const existingIndex = reportData.lot_progress.findIndex(lp => lp.lot_id === lotId);
    const newProgress = [...reportData.lot_progress];
    
    if (existingIndex >= 0) {
      newProgress[existingIndex] = { ...newProgress[existingIndex], ...updates };
    } else {
      newProgress.push({
        lot_id: lotId,
        progress_percent: 0,
        works_done: "",
        works_planned: "",
        observations: "",
        ...updates,
      });
    }
    
    onUpdateReportData("lot_progress", newProgress);
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 75) return "bg-green-500";
    if (percent >= 50) return "bg-blue-500";
    if (percent >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-4">
      {/* Section 4 - Avancement général */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Avancement général des travaux
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">État global</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => {
                const config = STATUS_CONFIG[status];
                const Icon = config.icon;
                const isSelected = reportData.general_progress.status === status;
                
                return (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateField("general_progress", "status", status)}
                    className={cn(
                      "h-9 px-4 transition-all",
                      isSelected && config.color,
                      isSelected && "border-2"
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Commentaire</Label>
            <Textarea
              value={reportData.general_progress.comment}
              onChange={(e) => onUpdateField("general_progress", "comment", e.target.value)}
              placeholder="Résumé de l'état d'avancement global..."
              rows={2}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 5 - Avancement par lots */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Avancement par lots
              <Badge variant="secondary" className="text-xs">{lots.length} lots</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {onCreateLot && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddLotDialogOpen(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter un lot
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedLots(new Set(lots.map(l => l.id)))}
                className="h-7 text-xs"
              >
                Tout déplier
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {lots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun lot configuré pour ce projet.</p>
              {onCreateLot ? (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setIsAddLotDialogOpen(true)}
                  className="mt-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter un lot
                </Button>
              ) : (
                <p className="text-xs mt-1">Ajoutez des lots dans l'onglet Chantier.</p>
              )}
            </div>
          ) : (
            lots.map((lot) => {
              const progress = getLotProgress(lot.id);
              const isExpanded = expandedLots.has(lot.id);
              const company = lot.crm_company_id ? companies.find(c => c.id === lot.crm_company_id) : null;
              const progressPercent = progress?.progress_percent || 0;

              return (
                <div
                  key={lot.id}
                  className={cn(
                    "border rounded-lg overflow-hidden transition-all",
                    isExpanded && "ring-1 ring-primary/20"
                  )}
                >
                  {/* Lot header */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleLotExpanded(lot.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-8 rounded-full"
                        style={{ backgroundColor: lot.color || "#888" }}
                      />
                      <div>
                        <p className="font-medium text-sm">{lot.name}</p>
                        {company && (
                          <p className="text-xs text-muted-foreground">{company.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Progress indicator */}
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full transition-all", getProgressColor(progressPercent))}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-10 text-right">{progressPercent}%</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Lot details */}
                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-4 border-t bg-muted/20">
                      {/* Progress slider */}
                      <div className="space-y-2 pt-3">
                        <Label className="text-xs text-muted-foreground">Avancement</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[progressPercent]}
                            onValueChange={([value]) => updateLotProgress(lot.id, { progress_percent: value })}
                            max={100}
                            step={5}
                            className="flex-1"
                          />
                          <Badge variant="outline" className="min-w-[50px] justify-center">
                            {progressPercent}%
                          </Badge>
                        </div>
                      </div>

                      {/* Works done */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Travaux réalisés depuis le dernier CR
                        </Label>
                        <Textarea
                          value={progress?.works_done || ""}
                          onChange={(e) => updateLotProgress(lot.id, { works_done: e.target.value })}
                          placeholder="Décrire les travaux réalisés..."
                          rows={2}
                          className="resize-none text-sm"
                        />
                      </div>

                      {/* Works planned */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Travaux à venir
                        </Label>
                        <Textarea
                          value={progress?.works_planned || ""}
                          onChange={(e) => updateLotProgress(lot.id, { works_planned: e.target.value })}
                          placeholder="Décrire les travaux prévus..."
                          rows={2}
                          className="resize-none text-sm"
                        />
                      </div>

                      {/* Observations */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Observations
                        </Label>
                        <Textarea
                          value={progress?.observations || ""}
                          onChange={(e) => updateLotProgress(lot.id, { observations: e.target.value })}
                          placeholder="Observations particulières..."
                          rows={2}
                          className="resize-none text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Add Lot Dialog */}
      <Dialog open={isAddLotDialogOpen} onOpenChange={setIsAddLotDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un lot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du lot *</Label>
              <Input
                placeholder="Ex: Gros œuvre, Électricité..."
                value={newLotName}
                onChange={(e) => setNewLotName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Entreprise (optionnel)</Label>
              <Select 
                value={newLotCompanyId || "none"} 
                onValueChange={(v) => setNewLotCompanyId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une entreprise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune entreprise</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newLotColor}
                  onChange={(e) => setNewLotColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <span className="text-sm text-muted-foreground">{newLotColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLotDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddLot} disabled={!newLotName.trim() || isCreatingLot}>
              {isCreatingLot ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le lot"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
