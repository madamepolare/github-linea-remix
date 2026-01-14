import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { useInvoiceSchedule, InvoiceScheduleItem } from "@/hooks/useInvoiceSchedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface InvoiceScheduleTabProps {
  projectId: string;
  onCreateInvoice?: (scheduleItem: InvoiceScheduleItem) => void;
}

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
  } = useInvoiceSchedule(projectId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceScheduleItem | null>(null);
  
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-4 w-4" />
              <span>Total prévu</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalAmountHt)}</p>
            <p className="text-xs text-muted-foreground">{summary.count} échéance(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Receipt className="h-4 w-4" />
              <span>Facturé</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.invoicedAmountHt)}</p>
            <p className="text-xs text-muted-foreground">{summary.invoicedCount} facture(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle className="h-4 w-4" />
              <span>Encaissé</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.paidAmountHt)}</p>
            <p className="text-xs text-muted-foreground">{summary.paidCount} paiement(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="h-4 w-4" />
              <span>En attente</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.pendingAmountHt)}</p>
            <p className="text-xs text-muted-foreground">{summary.pendingCount} à facturer</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {overdueItems.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">
                {overdueItems.length} échéance(s) en retard
              </p>
              <p className="text-sm text-muted-foreground">
                Total : {formatCurrency(overdueItems.reduce((s, i) => s + i.amount_ht, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Échéancier de facturation</h3>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une échéance
        </Button>
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
              Planifiez vos facturations pour ce projet en définissant des échéances.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un échéancier
            </Button>
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
    </div>
  );
}
