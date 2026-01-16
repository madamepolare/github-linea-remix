import { useState } from "react";
import { format, isPast, isToday, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useInvoiceSchedule, InvoiceScheduleItem } from "@/hooks/useInvoiceSchedule";
import { useProjectFinancialSummary } from "@/hooks/useProjectFinancialSummary";
import { useCommercialDocuments } from "@/hooks/useCommercialDocuments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BudgetVsCAAlert } from "./BudgetVsCAAlert";
import { InvoiceScheduleInlineRow } from "./InvoiceScheduleInlineRow";
import { AdjustBudgetDialog } from "./AdjustBudgetDialog";

interface InvoiceScheduleTabProps {
  projectId: string;
  onCreateInvoice?: (scheduleItem: InvoiceScheduleItem) => void;
  onViewInvoice?: (invoiceId: string) => void;
}

// Predefined schedule templates
const SCHEDULE_TEMPLATES = [
  { name: "30/40/30", items: [{ title: "Acompte de démarrage", percentage: 30, daysFromStart: 0 }, { title: "Situation intermédiaire", percentage: 40, daysFromStart: 45 }, { title: "Solde", percentage: 30, daysFromStart: 90 }] },
  { name: "50/50", items: [{ title: "Acompte 50%", percentage: 50, daysFromStart: 0 }, { title: "Solde 50%", percentage: 50, daysFromStart: 60 }] },
  { name: "30/30/30/10", items: [{ title: "Acompte", percentage: 30, daysFromStart: 0 }, { title: "Esquisse", percentage: 30, daysFromStart: 30 }, { title: "APD/DCE", percentage: 30, daysFromStart: 60 }, { title: "Réception", percentage: 10, daysFromStart: 90 }] },
];

export function InvoiceScheduleTab({ projectId, onCreateInvoice, onViewInvoice }: InvoiceScheduleTabProps) {
  const { 
    scheduleItems, 
    isLoading, 
    summary, 
    nextDue, 
    overdueItems,
    createScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    generateFromQuote,
  } = useInvoiceSchedule(projectId);

  const financialSummary = useProjectFinancialSummary(projectId);

  const { documents } = useCommercialDocuments();
  
  // Filter accepted quotes for this project
  const projectQuotes = documents.filter(
    d => d.project_id === projectId && 
    (d.status === 'accepted' || d.status === 'signed') &&
    d.document_type === 'quote'
  );

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceScheduleItem | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("30/40/30");
  const [adjustCADialogOpen, setAdjustCADialogOpen] = useState(false);
  const [adjustBudgetDialogOpen, setAdjustBudgetDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    percentage: 0,
    amount_ht: 0,
    vat_rate: 20,
    planned_date: "",
    milestone: "",
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      percentage: 0,
      amount_ht: 0,
      vat_rate: 20,
      planned_date: "",
      milestone: "",
    });
    setEditingItem(null);
  };

  const handleCreate = async () => {
    const nextNumber = scheduleItems.length + 1;
    
    await createScheduleItem.mutateAsync({
      project_id: projectId,
      schedule_number: nextNumber,
      title: formData.title,
      description: formData.description || undefined,
      percentage: formData.percentage || undefined,
      amount_ht: formData.amount_ht,
      vat_rate: formData.vat_rate,
      planned_date: formData.planned_date,
      milestone: formData.milestone || undefined,
    });
    
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    
    await updateScheduleItem.mutateAsync({
      id: editingItem.id,
      title: formData.title,
      description: formData.description || undefined,
      percentage: formData.percentage || undefined,
      amount_ht: formData.amount_ht,
      vat_rate: formData.vat_rate,
      planned_date: formData.planned_date,
      milestone: formData.milestone || undefined,
    });
    
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleInlineUpdate = async (data: { 
    id: string; 
    percentage?: number; 
    amount_ht?: number; 
    planned_date?: string;
    vat_rate?: number;
  }) => {
    await updateScheduleItem.mutateAsync(data);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cette échéance ?")) {
      await deleteScheduleItem.mutateAsync(id);
    }
  };

  const handleGenerateFromQuote = async () => {
    if (!selectedQuoteId || !selectedTemplate) return;
    
    const template = SCHEDULE_TEMPLATES.find(t => t.name === selectedTemplate);
    if (!template) return;

    try {
      await generateFromQuote.mutateAsync({
        quoteId: selectedQuoteId,
        schedule: template.items,
      });
      setGenerateDialogOpen(false);
      toast.success("Échéancier généré avec succès");
    } catch (error) {
      toast.error("Erreur lors de la génération");
    }
  };

  const handleAdjustCA = () => {
    setAdjustCADialogOpen(true);
  };

  const handleRedistribute = () => {
    toast.info("Fonctionnalité de répartition à venir");
  };

  // Calculate progress
  const progressPercentage = summary.totalAmountHt > 0 
    ? (summary.paidAmountHt / summary.totalAmountHt) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CA Header with Budget Alert */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">CA du projet</CardTitle>
                <CardDescription>
                  Chiffre d'affaires prévu sur l'ensemble des échéances
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{formatCurrency(summary.totalAmountHt)}</p>
              <div className="flex items-center gap-2 justify-end text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <span>Budget: {formatCurrency(financialSummary.currentBudget)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Budget vs CA Alert */}
          <BudgetVsCAAlert
            totalCA={summary.totalAmountHt}
            projectBudget={financialSummary.currentBudget}
            onAdjustBudget={() => setAdjustBudgetDialogOpen(true)}
            onAdjustCA={handleAdjustCA}
            onRedistribute={handleRedistribute}
          />

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression facturation</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
              {/* Pending (full bar background) */}
              <div 
                className="absolute left-0 top-0 h-full bg-amber-200 dark:bg-amber-900/30 transition-all"
                style={{ width: `${summary.totalAmountHt > 0 ? ((summary.invoicedAmountHt + summary.pendingAmountHt) / summary.totalAmountHt) * 100 : 0}%` }}
              />
              {/* Invoiced portion */}
              <div 
                className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
                style={{ width: `${summary.totalAmountHt > 0 ? ((summary.invoicedAmountHt) / summary.totalAmountHt) * 100 : 0}%` }}
              />
              {/* Paid portion */}
              <div 
                className="absolute left-0 top-0 h-full bg-emerald-500 transition-all"
                style={{ width: `${summary.totalAmountHt > 0 ? (summary.paidAmountHt / summary.totalAmountHt) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Encaissé: {formatCurrency(summary.paidAmountHt)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Facturé: {formatCurrency(summary.invoicedAmountHt)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-200 dark:bg-amber-900" />
                  En attente: {formatCurrency(summary.pendingAmountHt)}
                </span>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4 pt-2">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{summary.count}</p>
              <p className="text-xs text-muted-foreground">Échéances</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
              <p className="text-2xl font-bold text-emerald-600">{summary.paidCount}</p>
              <p className="text-xs text-muted-foreground">Payées</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <p className="text-2xl font-bold text-blue-600">{summary.invoicedCount}</p>
              <p className="text-xs text-muted-foreground">Facturées</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <p className="text-2xl font-bold text-amber-600">{summary.pendingCount}</p>
              <p className="text-xs text-muted-foreground">À facturer</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Alert */}
      {overdueItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive">
                {overdueItems.length} échéance(s) en retard
              </p>
              <p className="text-sm text-muted-foreground">
                Total : {formatCurrency(overdueItems.reduce((s, i) => s + i.amount_ht, 0))} HT
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => onCreateInvoice?.(overdueItems[0])}>
              <Receipt className="h-4 w-4 mr-2" />
              Facturer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          Échéancier de facturation
        </h3>
        <div className="flex items-center gap-2">
          {projectQuotes.length > 0 && scheduleItems.length === 0 && (
            <Button variant="outline" onClick={() => setGenerateDialogOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer depuis devis
            </Button>
          )}
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une facture
          </Button>
        </div>
      </div>

      {/* Schedule Timeline - Inline Editable */}
      {scheduleItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun échéancier</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Planifiez vos facturations pour ce projet en définissant des échéances liées aux différentes phases de votre mission.
            </p>
            <div className="flex gap-2">
              {projectQuotes.length > 0 && (
                <Button variant="outline" onClick={() => setGenerateDialogOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer depuis devis
                </Button>
              )}
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer manuellement
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {scheduleItems.map((item, index) => (
            <InvoiceScheduleInlineRow
              key={item.id}
              item={item}
              index={index}
              totalCA={summary.totalAmountHt}
              isLast={index === scheduleItems.length - 1}
              onUpdate={handleInlineUpdate}
              onDelete={handleDelete}
              onCreateInvoice={onCreateInvoice}
              onViewInvoice={onViewInvoice}
              isUpdating={updateScheduleItem.isPending}
            />
          ))}
          
          {/* Add new schedule item button */}
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            Ajouter une facture
          </button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifier l'échéance" : "Nouvelle échéance"}
            </DialogTitle>
            <DialogDescription>
              {editingItem 
                ? "Modifiez les informations de cette échéance de facturation."
                : "Ajoutez une nouvelle échéance à l'échéancier de facturation."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                placeholder="Ex: Acompte 30%"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Montant HT *</Label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={formData.amount_ht}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    const percentage = summary.totalAmountHt > 0 ? (amount / summary.totalAmountHt) * 100 : 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      amount_ht: amount,
                      percentage: Math.round(percentage * 10) / 10
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Pourcentage</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.percentage}
                  onChange={(e) => {
                    const percentage = parseFloat(e.target.value) || 0;
                    const amount = summary.totalAmountHt > 0 ? (percentage / 100) * summary.totalAmountHt : 0;
                    setFormData(prev => ({ 
                      ...prev, 
                      percentage,
                      amount_ht: Math.round(amount)
                    }));
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date prévue *</Label>
                <Input
                  type="date"
                  value={formData.planned_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, planned_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Taux TVA</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.vat_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, vat_rate: parseFloat(e.target.value) || 20 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jalon / Événement déclencheur</Label>
              <Input
                placeholder="Ex: Livraison des maquettes"
                value={formData.milestone}
                onChange={(e) => setFormData(prev => ({ ...prev, milestone: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateDialogOpen(false);
              resetForm();
            }}>
              Annuler
            </Button>
            <Button 
              onClick={editingItem ? handleUpdate : handleCreate}
              disabled={
                !formData.title || 
                formData.amount_ht <= 0 || 
                !formData.planned_date ||
                createScheduleItem.isPending ||
                updateScheduleItem.isPending
              }
            >
              {editingItem ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate from Quote Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Générer l'échéancier</DialogTitle>
                <DialogDescription>
                  Créez automatiquement un échéancier à partir d'un devis signé.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Devis source</Label>
              <Select value={selectedQuoteId || ""} onValueChange={setSelectedQuoteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un devis" />
                </SelectTrigger>
                <SelectContent>
                  {projectQuotes.map((quote) => (
                    <SelectItem key={quote.id} value={quote.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{quote.document_number}</span>
                        <span className="text-muted-foreground">
                          - {formatCurrency(quote.total_amount || 0)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modèle d'échéancier</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_TEMPLATES.map((template) => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && (
              <Card className="bg-muted/50">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium">Aperçu des échéances :</p>
                  {SCHEDULE_TEMPLATES.find(t => t.name === selectedTemplate)?.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        {item.title}
                      </span>
                      <Badge variant="secondary">{item.percentage}%</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleGenerateFromQuote}
              disabled={!selectedQuoteId || generateFromQuote.isPending}
            >
              {generateFromQuote.isPending ? "Génération..." : "Générer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust CA Dialog */}
      <Dialog open={adjustCADialogOpen} onOpenChange={setAdjustCADialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajuster le CA</DialogTitle>
            <DialogDescription>
              Réduisez les montants de l'échéancier pour correspondre au budget.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between text-sm">
              <span>CA actuel</span>
              <span className="font-medium">{formatCurrency(summary.totalAmountHt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Budget</span>
              <span className="font-medium">{formatCurrency(financialSummary.currentBudget)}</span>
            </div>
            <div className="flex justify-between text-sm text-amber-600">
              <span>Excédent</span>
              <span className="font-medium">
                {formatCurrency(summary.totalAmountHt - financialSummary.currentBudget)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Modifiez individuellement les montants des échéances dans le tableau ci-dessous pour ajuster le CA total.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustCADialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Budget Dialog */}
      <AdjustBudgetDialog
        open={adjustBudgetDialogOpen}
        onOpenChange={setAdjustBudgetDialogOpen}
        projectId={projectId}
        currentBudget={financialSummary.currentBudget}
      />
    </div>
  );
}
