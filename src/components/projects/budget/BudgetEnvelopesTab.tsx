import { useState } from "react";
import { useProjectBudgetEnvelopes, BudgetEnvelope } from "@/hooks/useProjectBudgetEnvelopes";
import { useProjectPurchases, ProjectPurchase, CreatePurchaseInput } from "@/hooks/useProjectPurchases";
import { useCommercialDocuments } from "@/hooks/useCommercialDocuments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Wallet,
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Archive,
  FileText,
  TrendingDown,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatePurchaseDialog } from "./CreatePurchaseDialog";
import { PURCHASE_STATUSES, PURCHASE_CATEGORIES, PurchaseStatus } from "@/lib/purchaseTypes";

interface BudgetEnvelopesTabProps {
  projectId: string;
}

export function BudgetEnvelopesTab({ projectId }: BudgetEnvelopesTabProps) {
  const { envelopes, isLoading, summary, createEnvelope, updateEnvelope, deleteEnvelope } = useProjectBudgetEnvelopes(projectId);
  const { purchases, createPurchase, updatePurchase, deletePurchase } = useProjectPurchases(projectId);
  const { documents: commercialDocuments } = useCommercialDocuments();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEnvelope, setSelectedEnvelope] = useState<BudgetEnvelope | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<ProjectPurchase | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: string;
    source_type: 'manual' | 'quote_phase' | 'quote_grouped';
    source_document_id: string;
    budget_amount: number;
    alert_threshold: number;
  }>({
    name: "",
    description: "",
    category: "",
    source_type: "manual",
    source_document_id: "",
    budget_amount: 0,
    alert_threshold: 80,
  });

  // Get accepted quotes for this project
  const projectQuotes = commercialDocuments.filter(
    d => d.project_id === projectId && (d.status === 'accepted' || d.status === 'signed')
  );

  // Get purchases for selected envelope
  const envelopePurchases = selectedEnvelope 
    ? purchases.filter(p => p.budget_envelope_id === selectedEnvelope.id)
    : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      source_type: "manual",
      source_document_id: "",
      budget_amount: 0,
      alert_threshold: 80,
    });
  };

  const handleCreate = async () => {
    await createEnvelope.mutateAsync({
      project_id: projectId,
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category || undefined,
      source_type: formData.source_type,
      source_document_id: formData.source_document_id || undefined,
      budget_amount: formData.budget_amount,
      alert_threshold: formData.alert_threshold,
    });
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cette enveloppe budgétaire ?")) {
      await deleteEnvelope.mutateAsync(id);
    }
  };

  const handleCloseEnvelope = async (envelope: BudgetEnvelope) => {
    await updateEnvelope.mutateAsync({
      id: envelope.id,
      status: 'closed',
    });
  };

  const handlePurchaseSubmit = async (data: CreatePurchaseInput) => {
    if (editingPurchase) {
      await updatePurchase.mutateAsync({ id: editingPurchase.id, ...data });
    } else {
      await createPurchase.mutateAsync({
        ...data,
        budget_envelope_id: selectedEnvelope?.id,
      });
    }
    setPurchaseDialogOpen(false);
    setEditingPurchase(null);
  };

  const handleRemovePurchaseFromEnvelope = async (purchase: ProjectPurchase) => {
    await updatePurchase.mutateAsync({
      id: purchase.id,
      budget_envelope_id: undefined,
    });
  };

  const getStatusColor = (envelope: BudgetEnvelope) => {
    if (envelope.status === 'closed') return "bg-muted text-muted-foreground";
    if (envelope.status === 'exhausted') return "bg-destructive/10 text-destructive";
    
    const consumedPct = (envelope.consumed_amount / envelope.budget_amount) * 100;
    if (consumedPct >= envelope.alert_threshold) return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
  };

  const getProgressColor = (envelope: BudgetEnvelope) => {
    if (envelope.status === 'closed') return "bg-muted";
    if (envelope.status === 'exhausted') return "bg-destructive";
    
    const consumedPct = (envelope.consumed_amount / envelope.budget_amount) * 100;
    if (consumedPct >= envelope.alert_threshold) return "bg-amber-500";
    return "bg-emerald-500";
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
              <Wallet className="h-4 w-4" />
              <span>Budget total</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingDown className="h-4 w-4" />
              <span>Consommé</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalConsumed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle className="h-4 w-4" />
              <span>Restant</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalRemaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span>Alertes</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{summary.alertEnvelopes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Enveloppes budgétaires</h3>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle enveloppe
        </Button>
      </div>

      {/* Envelopes Grid */}
      {envelopes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Wallet className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucune enveloppe budgétaire</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Créez des enveloppes pour gérer vos budgets par poste et suivre la consommation en temps réel.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une enveloppe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {envelopes.map((envelope) => {
            const envelopePurchasesCount = purchases.filter(p => p.budget_envelope_id === envelope.id).length;
            const consumedPct = envelope.budget_amount > 0 
              ? Math.min((envelope.consumed_amount / envelope.budget_amount) * 100, 100)
              : 0;
            
            return (
              <Card 
                key={envelope.id} 
                className={cn(
                  "hover:shadow-md transition-shadow cursor-pointer",
                  envelope.status === 'closed' && "opacity-60"
                )}
                onClick={() => {
                  setSelectedEnvelope(envelope);
                  setDetailSheetOpen(true);
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{envelope.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {envelope.category && (
                          <Badge variant="outline" className="text-xs">
                            {envelope.category}
                          </Badge>
                        )}
                        {envelopePurchasesCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            {envelopePurchasesCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", getStatusColor(envelope))}>
                        {envelope.status === 'active' ? 'Actif' : 
                         envelope.status === 'exhausted' ? 'Épuisé' : 'Clôturé'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEnvelope(envelope);
                            setDetailSheetOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Voir les détails
                          </DropdownMenuItem>
                          {envelope.status === 'active' && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleCloseEnvelope(envelope);
                            }}>
                              <Archive className="h-4 w-4 mr-2" />
                              Clôturer
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(envelope.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {envelope.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {envelope.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Consommé</span>
                      <span className="font-medium">{consumedPct.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={consumedPct} 
                      className={cn("h-2", getProgressColor(envelope))}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(envelope.consumed_amount)}</span>
                      <span>{formatCurrency(envelope.budget_amount)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Reste</span>
                    <span className={cn(
                      "font-semibold",
                      envelope.remaining_amount < 0 ? "text-destructive" : "text-emerald-600"
                    )}>
                      {formatCurrency(envelope.remaining_amount)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle enveloppe budgétaire</DialogTitle>
            <DialogDescription>
              Créez une enveloppe pour gérer un budget spécifique au projet.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'enveloppe *</Label>
              <Input
                placeholder="Ex: Impression supports"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Description optionnelle..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget (€ HT) *</Label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={formData.budget_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget_amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Seuil d'alerte (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.alert_threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, alert_threshold: parseInt(e.target.value) || 80 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="impression">Impression</SelectItem>
                  <SelectItem value="prestataires">Prestataires</SelectItem>
                  <SelectItem value="materiel">Matériel</SelectItem>
                  <SelectItem value="logiciels">Logiciels</SelectItem>
                  <SelectItem value="deplacement">Déplacement</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {projectQuotes.length > 0 && (
              <div className="space-y-2">
                <Label>Créer depuis un devis (optionnel)</Label>
                <Select
                  value={formData.source_document_id}
                  onValueChange={(value) => {
                    const quote = projectQuotes.find(q => q.id === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      source_document_id: value,
                      source_type: value ? 'quote_grouped' : 'manual',
                      budget_amount: quote?.total_amount || prev.budget_amount,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un devis" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectQuotes.map(quote => (
                      <SelectItem key={quote.id} value={quote.id}>
                        {quote.document_number} - {formatCurrency(quote.total_amount || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!formData.name || formData.budget_amount <= 0 || createEnvelope.isPending}
            >
              {createEnvelope.isPending ? "Création..." : "Créer l'enveloppe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet with Purchases */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {selectedEnvelope?.name}
            </SheetTitle>
          </SheetHeader>
          
          {selectedEnvelope && (
            <div className="mt-6 space-y-6">
              {/* Envelope info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(selectedEnvelope)}>
                    {selectedEnvelope.status === 'active' ? 'Actif' : 
                     selectedEnvelope.status === 'exhausted' ? 'Épuisé' : 'Clôturé'}
                  </Badge>
                  {selectedEnvelope.category && (
                    <Badge variant="outline">{selectedEnvelope.category}</Badge>
                  )}
                </div>

                {selectedEnvelope.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedEnvelope.description}
                  </p>
                )}

                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="text-lg font-semibold">{formatCurrency(selectedEnvelope.budget_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Consommé</p>
                        <p className="text-lg font-semibold text-orange-600">
                          {formatCurrency(selectedEnvelope.consumed_amount)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progression</span>
                        <span>
                          {((selectedEnvelope.consumed_amount / selectedEnvelope.budget_amount) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={(selectedEnvelope.consumed_amount / selectedEnvelope.budget_amount) * 100}
                        className={cn("h-3", getProgressColor(selectedEnvelope))}
                      />
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Restant</p>
                      <p className={cn(
                        "text-xl font-bold",
                        selectedEnvelope.remaining_amount < 0 ? "text-destructive" : "text-emerald-600"
                      )}>
                        {formatCurrency(selectedEnvelope.remaining_amount)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Purchases section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Achats ({envelopePurchases.length})
                  </h4>
                  {selectedEnvelope.status === 'active' && (
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setEditingPurchase(null);
                        setPurchaseDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  )}
                </div>

                {envelopePurchases.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Aucun achat dans cette enveloppe
                      </p>
                      {selectedEnvelope.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => {
                            setEditingPurchase(null);
                            setPurchaseDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Créer un achat
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2 pr-4">
                      {envelopePurchases.map((purchase) => {
                        const status = PURCHASE_STATUSES[purchase.status];
                        const category = PURCHASE_CATEGORIES[purchase.purchase_category];
                        const StatusIcon = status?.icon;
                        const CategoryIcon = category?.icon;

                        return (
                          <Card key={purchase.id} className="hover:bg-muted/50">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {CategoryIcon && (
                                      <CategoryIcon className={cn("h-4 w-4 shrink-0", category.color)} />
                                    )}
                                    <span className="font-medium text-sm truncate">
                                      {purchase.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant="secondary" 
                                      className={cn("text-xs", status?.color)}
                                    >
                                      {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                                      {status?.label}
                                    </Badge>
                                    {purchase.supplier_name && (
                                      <span className="text-xs text-muted-foreground truncate">
                                        {purchase.supplier_name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-semibold text-sm">
                                    {formatCurrency(purchase.amount_ht)}
                                  </p>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setEditingPurchase(purchase);
                                        setPurchaseDialogOpen(true);
                                      }}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleRemovePurchaseFromEnvelope(purchase)}>
                                        <Archive className="h-4 w-4 mr-2" />
                                        Retirer de l'enveloppe
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-destructive"
                                        onClick={() => {
                                          if (confirm("Supprimer cet achat ?")) {
                                            deletePurchase.mutate(purchase.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>

              {/* Alert threshold */}
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium">Seuil d'alerte</p>
                <p className="text-sm text-muted-foreground">
                  Notification à partir de {selectedEnvelope.alert_threshold}% de consommation
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Purchase Dialog */}
      <CreatePurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        projectId={projectId}
        purchase={editingPurchase}
        defaultEnvelopeId={selectedEnvelope?.id}
        onSubmit={handlePurchaseSubmit}
        isLoading={createPurchase.isPending || updatePurchase.isPending}
      />
    </div>
  );
}
