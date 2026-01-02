import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { ReportData, DocumentItem } from "@/hooks/useMeetingReportData";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DollarSign, Shield, FileText, Plus, Trash2, Calendar, Upload, Download,
  CheckCircle2, Circle, ExternalLink,
} from "lucide-react";

interface AnnexesTabProps {
  reportData: ReportData;
  onUpdateReportData: <K extends keyof ReportData>(section: K, value: ReportData[K]) => void;
  onUpdateField: <K extends keyof ReportData>(section: K, field: keyof ReportData[K], value: unknown) => void;
}

export function AnnexesTab({
  reportData,
  onUpdateReportData,
  onUpdateField,
}: AnnexesTabProps) {
  const [isAddDocumentOpen, setIsAddDocumentOpen] = useState(false);
  const [newDocument, setNewDocument] = useState<Omit<DocumentItem, "id">>({
    name: "",
    type: "transmitted",
    due_date: null,
    file_url: "",
  });

  const handleAddDocument = () => {
    if (!newDocument.name.trim()) return;
    
    onUpdateReportData("documents", [
      ...reportData.documents,
      { ...newDocument, id: crypto.randomUUID() },
    ]);
    
    setNewDocument({ name: "", type: "transmitted", due_date: null, file_url: "" });
    setIsAddDocumentOpen(false);
  };

  const handleRemoveDocument = (id: string) => {
    onUpdateReportData(
      "documents",
      reportData.documents.filter(d => d.id !== id)
    );
  };

  const transmittedDocs = reportData.documents.filter(d => d.type === "transmitted");
  const expectedDocs = reportData.documents.filter(d => d.type === "expected");

  return (
    <div className="space-y-4">
      {/* Section 9 - Questions financières (optionnel) */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Questions financières
              <Badge variant="outline" className="text-xs">Optionnel</Badge>
            </CardTitle>
            <Switch
              checked={reportData.financial.enabled}
              onCheckedChange={(checked) => onUpdateField("financial", "enabled", checked)}
            />
          </div>
        </CardHeader>
        {reportData.financial.enabled && (
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Travaux supplémentaires</Label>
              <Textarea
                value={reportData.financial.supplementary_works}
                onChange={(e) => onUpdateField("financial", "supplementary_works", e.target.value)}
                placeholder="Décrire les travaux supplémentaires identifiés..."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Devis en attente</Label>
              <Textarea
                value={reportData.financial.pending_quotes}
                onChange={(e) => onUpdateField("financial", "pending_quotes", e.target.value)}
                placeholder="Liste des devis attendus..."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ordres de service</Label>
              <Textarea
                value={reportData.financial.service_orders}
                onChange={(e) => onUpdateField("financial", "service_orders", e.target.value)}
                placeholder="OS émis ou à émettre..."
                rows={2}
                className="resize-none"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Section 10 - Sécurité, Qualité, Environnement */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Sécurité - Qualité - Environnement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="safety_ok"
                  checked={reportData.sqe.safety_ok}
                  onCheckedChange={(checked) => onUpdateField("sqe", "safety_ok", !!checked)}
                />
                <Label htmlFor="safety_ok" className="text-sm cursor-pointer">
                  Règles de sécurité respectées
                </Label>
              </div>
              {reportData.sqe.safety_ok ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cleanliness_ok"
                  checked={reportData.sqe.cleanliness_ok}
                  onCheckedChange={(checked) => onUpdateField("sqe", "cleanliness_ok", !!checked)}
                />
                <Label htmlFor="cleanliness_ok" className="text-sm cursor-pointer">
                  Propreté du chantier
                </Label>
              </div>
              {reportData.sqe.cleanliness_ok ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Observations SPS</Label>
            <Textarea
              value={reportData.sqe.sps_observations}
              onChange={(e) => onUpdateField("sqe", "sps_observations", e.target.value)}
              placeholder="Observations du coordonnateur SPS..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nuisances / Environnement</Label>
            <Textarea
              value={reportData.sqe.nuisances_comment}
              onChange={(e) => onUpdateField("sqe", "nuisances_comment", e.target.value)}
              placeholder="Bruit, poussière, impact environnemental..."
              rows={2}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 11 - Documents échangés */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Documents échangés / à produire
              <Badge variant="secondary" className="text-xs">{reportData.documents.length}</Badge>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsAddDocumentOpen(true)} className="h-7">
              <Plus className="h-3 w-3 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {reportData.documents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun document enregistré.</p>
            </div>
          ) : (
            <>
              {/* Documents transmis */}
              {transmittedDocs.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Upload className="h-3 w-3" />
                    Documents transmis ce jour
                  </Label>
                  {transmittedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{doc.name}</span>
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveDocument(doc.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents attendus */}
              {expectedDocs.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    Documents attendus
                  </Label>
                  {expectedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border bg-orange-50 dark:bg-orange-950/20">
                      <div className="flex items-center gap-2">
                        <Circle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">{doc.name}</span>
                        {doc.due_date && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(parseISO(doc.due_date), "d MMM", { locale: fr })}
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveDocument(doc.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog - Add Document */}
      <Dialog open={isAddDocumentOpen} onOpenChange={setIsAddDocumentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom du document</Label>
              <Input
                value={newDocument.name}
                onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                placeholder="Plan, fiche technique, DOE..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={newDocument.type}
                onValueChange={(v) => setNewDocument({ ...newDocument, type: v as "transmitted" | "expected" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transmitted">Transmis ce jour</SelectItem>
                  <SelectItem value="expected">Attendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newDocument.type === "expected" && (
              <div className="space-y-1.5">
                <Label>Date d'échéance</Label>
                <InlineDatePicker
                  value={newDocument.due_date ? parseISO(newDocument.due_date) : undefined}
                  onChange={(date) => setNewDocument({ ...newDocument, due_date: date?.toISOString().split("T")[0] || null })}
                  className="w-full"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>URL du fichier (optionnel)</Label>
              <Input
                value={newDocument.file_url || ""}
                onChange={(e) => setNewDocument({ ...newDocument, file_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDocumentOpen(false)}>Annuler</Button>
            <Button onClick={handleAddDocument} disabled={!newDocument.name.trim()}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
