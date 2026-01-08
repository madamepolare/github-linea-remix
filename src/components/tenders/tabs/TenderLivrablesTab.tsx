import { useState } from "react";
import {
  Plus,
  FileCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTenderDeliverables } from "@/hooks/useTenderDeliverables";
import { useTenderTeam } from "@/hooks/useTenderTeam";
import { useTender } from "@/hooks/useTenders";
import { DELIVERABLE_TYPES } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeliverableQuickAdd } from "../deliverables/DeliverableQuickAdd";
import { DeliverableAIExtract } from "../deliverables/DeliverableAIExtract";
import { DeliverableMemberGrid } from "../deliverables/DeliverableMemberGrid";

interface TenderLivrablesTabProps {
  tenderId: string;
}

// Responsible types
const RESPONSIBLE_TYPES = [
  { value: 'mandataire', label: 'Mandataire' },
  { value: 'tous', label: 'Tous les membres' },
  { value: 'cotraitant', label: 'Cotraitant' },
  { value: 'sous_traitant', label: 'Sous-traitant' },
];

export function TenderLivrablesTab({ tenderId }: TenderLivrablesTabProps) {
  const { teamMembers } = useTenderTeam(tenderId);
  const { data: tender } = useTender(tenderId);
  const { 
    deliverables, 
    isLoading, 
    addDeliverable, 
    updateDeliverable,
    toggleMemberComplete,
    deleteDeliverable 
  } = useTenderDeliverables(tenderId, teamMembers);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(true);
  const [showAIExtract, setShowAIExtract] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState({
    deliverable_type: '',
    name: '',
    responsible_type: 'mandataire',
    due_date: '',
  });

  // Get unique companies from team
  const companies = teamMembers
    .filter(m => m.company?.id)
    .reduce((acc, m) => {
      if (!acc.find(c => c.id === m.company?.id)) {
        acc.push({
          id: m.company!.id,
          name: m.company!.name,
          role: m.role,
          isMandataire: m.role === "mandataire",
        });
      }
      return acc;
    }, [] as { id: string; name: string; role: string; isMandataire: boolean }[])
    .sort((a, b) => (a.isMandataire ? -1 : b.isMandataire ? 1 : 0));

  // Export to Excel
  const handleExportExcel = () => {
    if (deliverables.length === 0) {
      toast.error("Aucun livrable à exporter");
      return;
    }

    const CANDIDATURE_TYPES = ["dc1", "dc2", "dc4", "urssaf", "kbis", "attestation_fiscale", "attestation_assurance", "references", "cv", "habilitations"];

    // Build data rows
    const data = deliverables.map(d => {
      const memberCompletion = (d.member_completion || {}) as Record<string, boolean>;
      const isCandidature = CANDIDATURE_TYPES.includes(d.deliverable_type);
      
      // Check if deliverable is complete
      const isComplete = companies.every(company => {
        const shouldCheck = 
          d.responsible_type === "tous" ||
          (d.responsible_type === "mandataire" && company.isMandataire) ||
          (d.responsible_type === "cotraitant" && !company.isMandataire) ||
          (d.responsible_company_ids && d.responsible_company_ids.includes(company.id));
        
        if (!shouldCheck) return true;
        return memberCompletion[company.id] === true;
      });

      const row: Record<string, string> = {
        "Livrable": d.name,
        "Type": isCandidature ? "Candidature" : "Offre",
        "Responsable": RESPONSIBLE_TYPES.find(r => r.value === d.responsible_type)?.label || d.responsible_type,
        "Statut global": isComplete ? "✓ Complet" : "○ En cours",
      };

      // Add column for each company
      companies.forEach(company => {
        const shouldCheck = 
          d.responsible_type === "tous" ||
          (d.responsible_type === "mandataire" && company.isMandataire) ||
          (d.responsible_type === "cotraitant" && !company.isMandataire) ||
          (d.responsible_company_ids && d.responsible_company_ids.includes(company.id));
        
        if (!shouldCheck) {
          row[company.name] = "—";
        } else {
          row[company.name] = memberCompletion[company.id] ? "✓ Fait" : "○ À faire";
        }
      });

      row["Échéance"] = d.due_date ? new Date(d.due_date).toLocaleDateString("fr-FR") : "";

      return row;
    });

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Livrables");

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key] || "").length)) + 2
    }));
    ws["!cols"] = colWidths;

    // Generate filename
    const tenderName = tender?.title?.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30) || "AO";
    const date = new Date().toISOString().split("T")[0];
    const filename = `Livrables_${tenderName}_${date}.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);
    toast.success("Export Excel téléchargé");
  };

  // Calculate overall progress based on member completion
  const calculateProgress = () => {
    if (deliverables.length === 0) return 0;
    
    const companies = teamMembers
      .filter(m => m.company?.id)
      .reduce((acc, m) => {
        if (!acc.find(c => c.id === m.company?.id)) {
          acc.push({
            id: m.company!.id,
            isMandataire: m.role === "mandataire",
          });
        }
        return acc;
      }, [] as { id: string; isMandataire: boolean }[]);

    if (companies.length === 0) {
      // Fallback to is_completed if no team
      const completed = deliverables.filter(d => d.is_completed).length;
      return Math.round((completed / deliverables.length) * 100);
    }

    let totalChecks = 0;
    let completedChecks = 0;

    for (const d of deliverables) {
      const memberCompletion = (d.member_completion || {}) as Record<string, boolean>;
      
      for (const company of companies) {
        const shouldCheck = 
          d.responsible_type === "tous" ||
          (d.responsible_type === "mandataire" && company.isMandataire) ||
          (d.responsible_type === "cotraitant" && !company.isMandataire);
        
        if (shouldCheck) {
          totalChecks++;
          if (memberCompletion[company.id]) {
            completedChecks++;
          }
        }
      }
    }

    return totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
  };

  const progressPercent = calculateProgress();
  const existingTypes = deliverables.map(d => d.deliverable_type);

  const handleAdd = () => {
    if (!newDeliverable.deliverable_type && !newDeliverable.name) {
      toast.error("Veuillez sélectionner un type ou saisir un nom");
      return;
    }

    const type = DELIVERABLE_TYPES.find(t => t.value === newDeliverable.deliverable_type);
    
    addDeliverable.mutate({
      deliverable_type: newDeliverable.deliverable_type || 'autre',
      name: newDeliverable.name || type?.label || 'Livrable',
      responsible_type: newDeliverable.responsible_type,
      due_date: newDeliverable.due_date || undefined,
    });
    
    setShowAddDialog(false);
    setNewDeliverable({
      deliverable_type: '',
      name: '',
      responsible_type: 'mandataire',
      due_date: '',
    });
  };

  const handleQuickAdd = (item: { deliverable_type: string; name: string; responsible_type: string }) => {
    addDeliverable.mutate(item);
  };

  const handleAIImport = (items: { deliverable_type: string; name: string; responsible_type: string }[]) => {
    items.forEach(item => {
      addDeliverable.mutate(item);
    });
    toast.success(`${items.length} livrable${items.length > 1 ? 's' : ''} importé${items.length > 1 ? 's' : ''}`);
  };

  const handleToggleMemberComplete = (deliverableId: string, companyId: string, currentValue: boolean) => {
    toggleMemberComplete.mutate({ deliverableId, companyId, currentValue });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Progression des livrables
            </CardTitle>
            <span className={cn(
              "text-3xl font-bold tabular-nums",
              progressPercent === 100 ? "text-green-600" : "text-foreground"
            )}>
              {progressPercent}%
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress 
            value={progressPercent} 
            className={cn(
              "h-4",
              progressPercent === 100 && "[&>div]:bg-green-500"
            )} 
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{deliverables.length} livrables</span>
            <div className="flex items-center gap-2">
              {deliverables.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportExcel}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter manuellement
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Section */}
      <Collapsible open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-4 py-2 h-auto">
            <span className="text-sm font-medium">⚡ Ajout rapide</span>
            {showQuickAdd ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <DeliverableQuickAdd
            existingTypes={existingTypes}
            onAdd={handleQuickAdd}
            isLoading={addDeliverable.isPending}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* AI Extract Section */}
      <Collapsible open={showAIExtract} onOpenChange={setShowAIExtract}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-4 py-2 h-auto">
            <span className="text-sm font-medium">🤖 Extraction IA depuis le RC</span>
            {showAIExtract ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <DeliverableAIExtract
            existingTypes={existingTypes}
            onImport={handleAIImport}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Main Grid */}
      {deliverables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun livrable défini</p>
            <p className="text-sm text-muted-foreground mt-1">
              Utilisez les boutons rapides ci-dessus ou importez depuis le RC
            </p>
          </CardContent>
        </Card>
      ) : (
        <DeliverableMemberGrid
          deliverables={deliverables}
          teamMembers={teamMembers}
          onToggleMemberComplete={handleToggleMemberComplete}
          onDelete={(id) => deleteDeliverable.mutate(id)}
          onUpdate={(id, updates) => updateDeliverable.mutate({ id, ...updates })}
          onAddDeliverable={() => setShowAddDialog(true)}
        />
      )}

      {/* Add Deliverable Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un livrable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de livrable</Label>
              <Select
                value={newDeliverable.deliverable_type}
                onValueChange={(v) => {
                  const type = DELIVERABLE_TYPES.find(t => t.value === v);
                  setNewDeliverable({ 
                    ...newDeliverable, 
                    deliverable_type: v,
                    name: type?.label || ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERABLE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nom personnalisé</Label>
              <Input
                value={newDeliverable.name}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, name: e.target.value })}
                placeholder="Laisser vide pour utiliser le nom par défaut"
              />
            </div>

            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select
                value={newDeliverable.responsible_type}
                onValueChange={(v) => setNewDeliverable({ ...newDeliverable, responsible_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSIBLE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date d'échéance (optionnel)</Label>
              <Input
                type="date"
                value={newDeliverable.due_date}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={addDeliverable.isPending}>
              {addDeliverable.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
