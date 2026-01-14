import { useState } from "react";
import { format, isPast, isToday, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useInvoiceSchedule, InvoiceScheduleItem } from "@/hooks/useInvoiceSchedule";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Sparkles,
  ChevronRight,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InvoiceScheduleTabProps {
  projectId: string;
  onCreateInvoice?: (scheduleItem: InvoiceScheduleItem) => void;
}

// Predefined schedule templates
const SCHEDULE_TEMPLATES = [
  { name: "30/40/30", items: [{ title: "Acompte de démarrage", percentage: 30, daysFromStart: 0 }, { title: "Situation intermédiaire", percentage: 40, daysFromStart: 45 }, { title: "Solde", percentage: 30, daysFromStart: 90 }] },
  { name: "50/50", items: [{ title: "Acompte 50%", percentage: 50, daysFromStart: 0 }, { title: "Solde 50%", percentage: 50, daysFromStart: 60 }] },
  { name: "30/30/30/10", items: [{ title: "Acompte", percentage: 30, daysFromStart: 0 }, { title: "Esquisse", percentage: 30, daysFromStart: 30 }, { title: "APD/DCE", percentage: 30, daysFromStart: 60 }, { title: "Réception", percentage: 10, daysFromStart: 90 }] },
];

export function InvoiceScheduleTab({ projectId, onCreateInvoice }: InvoiceScheduleTabProps) {
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

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cette échéance ?")) {
      await deleteScheduleItem.mutateAsync(id);
    }
  };

  const handleEdit = (item: InvoiceScheduleItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      percentage: item.percentage || 0,
      amount_ht: item.amount_ht,
      vat_rate: item.vat_rate,
      planned_date: item.planned_date,
      milestone: item.milestone || "",
    });
    setCreateDialogOpen(true);
  };

  const getStatusConfig = (item: InvoiceScheduleItem) => {
    if (item.status === 'paid') {
      return { label: "Payé", variant: "default" as const, icon: CheckCircle, color: "text-emerald-500" };
    }
    if (item.status === 'invoiced') {
      return { label: "Facturé", variant: "secondary" as const, icon: Receipt, color: "text-blue-500" };
    }
    if (item.status === 'cancelled') {
      return { label: "Annulé", variant: "outline" as const, icon: AlertTriangle, color: "text-muted-foreground" };
    }
    
    const isOverdue = isPast(new Date(item.planned_date)) && !isToday(new Date(item.planned_date));
    if (isOverdue) {
      return { label: "En retard", variant: "destructive" as const, icon: AlertTriangle, color: "text-destructive" };
    }
    
    return { label: "À venir", variant: "outline" as const, icon: Clock, color: "text-muted-foreground" };
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

  // Calculate progress
  const progressPercentage = summary.totalAmountHt > 0 
    ? ((summary.invoicedAmountHt + summary.paidAmountHt) / summary.totalAmountHt) * 100 / 2 + 
      (summary.paidAmountHt / summary.totalAmountHt) * 100 / 2
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
      {/* Summary Header with Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Progression de la facturation
              </CardTitle>
              <CardDescription>
                {summary.count} échéance(s) planifiée(s) • {summary.paidCount} payée(s)
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(summary.totalAmountHt)}</p>
              <p className="text-xs text-muted-foreground">Budget total prévu</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{summary.totalAmountHt > 0 ? Math.round((summary.paidAmountHt / summary.totalAmountHt) * 100) : 0}%</span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
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
              </div>
              <span>Reste: {formatCurrency(summary.pendingAmountHt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
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
            <Button variant="destructive" size="sm">
              <Receipt className="h-4 w-4 mr-2" />
              Facturer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Échéancier de facturation</h3>
        <div className="flex items-center gap-2">
          {projectQuotes.length > 0 && scheduleItems.length === 0 && (
            <Button variant="outline" onClick={() => setGenerateDialogOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer depuis devis
            </Button>
          )}
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Schedule Timeline */}
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
        <div className="space-y-3">
          {scheduleItems.map((item, index) => {
            const statusConfig = getStatusConfig(item);
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card key={item.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center border-2",
                      item.status === 'paid' ? "border-emerald-500 bg-emerald-50" :
                      item.status === 'invoiced' ? "border-blue-500 bg-blue-50" :
                      "border-muted bg-background"
                    )}>
                      <span className="font-semibold text-sm">{index + 1}</span>
                    </div>
                    {index < scheduleItems.length - 1 && (
                      <div className="w-0.5 h-6 bg-muted mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      <Badge variant={statusConfig.variant} className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      {item.percentage && (
                        <Badge variant="outline" className="text-xs">
                          {item.percentage}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(item.planned_date), "d MMMM yyyy", { locale: fr })}
                      </span>
                      {item.milestone && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {item.milestone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatCurrency(item.amount_ht)}</p>
                    <p className="text-xs text-muted-foreground">
                      TTC: {formatCurrency(item.amount_ttc || 0)}
                    </p>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.status === 'pending' && onCreateInvoice && (
                        <DropdownMenuItem onClick={() => onCreateInvoice(item)}>
                          <Receipt className="h-4 w-4 mr-2" />
                          Créer la facture
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, amount_ht: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Pourcentage</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
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
    </div>
  );
}
