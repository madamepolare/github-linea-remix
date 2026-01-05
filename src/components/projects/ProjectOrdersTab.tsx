import { useState } from "react";
import { useProjectObjects, useDesignObjects, ProjectObject } from "@/hooks/useDesignObjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MoreVertical,
  ExternalLink,
  Calendar,
  MapPin,
  Bell,
  Pencil,
  Trash2,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { format, parseISO, isPast, addDays, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectOrdersTabProps {
  projectId: string;
}

const ORDER_STATUSES = [
  { value: "to_order", label: "À commander", icon: ShoppingCart, color: "bg-muted text-muted-foreground" },
  { value: "ordered", label: "Commandé", icon: Package, color: "bg-blue-500/10 text-blue-500" },
  { value: "in_transit", label: "En transit", icon: Truck, color: "bg-amber-500/10 text-amber-500" },
  { value: "delivered", label: "Livré", icon: CheckCircle2, color: "bg-green-500/10 text-green-500" },
  { value: "installed", label: "Installé", icon: CheckCircle2, color: "bg-primary/10 text-primary" },
  { value: "cancelled", label: "Annulé", icon: AlertTriangle, color: "bg-destructive/10 text-destructive" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Basse", color: "text-muted-foreground" },
  { value: "medium", label: "Moyenne", color: "text-amber-500" },
  { value: "high", label: "Haute", color: "text-orange-500" },
  { value: "urgent", label: "Urgente", color: "text-destructive" },
];

export function ProjectOrdersTab({ projectId }: ProjectOrdersTabProps) {
  const { projectObjects, isLoading, updateProjectObject, removeObjectFromProject, addObjectToProject } = useProjectObjects(projectId);
  const { objects: catalogObjects } = useDesignObjects();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<ProjectObject | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Form state for add/edit
  const [formData, setFormData] = useState({
    object_id: "",
    room: "",
    quantity: 1,
    supplier_name: "",
    supplier_url: "",
    order_reference: "",
    order_date: "",
    expected_delivery_date: "",
    price_unit: "",
    tracking_number: "",
    tracking_url: "",
    priority: "medium",
    alert_enabled: false,
    alert_days_before: 3,
    notes: "",
  });

  // Filter orders
  const filteredOrders = (projectObjects as any[]).filter((order) => {
    const matchesSearch = !search || 
      order.object?.name?.toLowerCase().includes(search.toLowerCase()) ||
      order.room?.toLowerCase().includes(search.toLowerCase()) ||
      order.supplier_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.order_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: projectObjects.length,
    toOrder: projectObjects.filter((o: any) => o.order_status === "to_order").length,
    ordered: projectObjects.filter((o: any) => o.order_status === "ordered").length,
    inTransit: projectObjects.filter((o: any) => o.order_status === "in_transit").length,
    delivered: projectObjects.filter((o: any) => o.order_status === "delivered").length,
    installed: projectObjects.filter((o: any) => o.order_status === "installed").length,
  };

  const progressPercent = stats.total > 0 
    ? Math.round(((stats.delivered + stats.installed) / stats.total) * 100) 
    : 0;

  const handleAddOrder = async () => {
    if (!formData.object_id) return;
    
    await addObjectToProject.mutateAsync({
      objectId: formData.object_id,
      room: formData.room || undefined,
      quantity: formData.quantity,
      notes: formData.notes || undefined,
    });

    // Update with additional order fields
    // Note: This would need the ID of the newly created order
    setAddDialogOpen(false);
    resetForm();
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    await updateProjectObject.mutateAsync({
      id: selectedOrder.id,
      room: formData.room || undefined,
      quantity: formData.quantity,
      status: selectedOrder.status,
      notes: formData.notes || undefined,
    });

    setEditDialogOpen(false);
    setSelectedOrder(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      object_id: "",
      room: "",
      quantity: 1,
      supplier_name: "",
      supplier_url: "",
      order_reference: "",
      order_date: "",
      expected_delivery_date: "",
      price_unit: "",
      tracking_number: "",
      tracking_url: "",
      priority: "medium",
      alert_enabled: false,
      alert_days_before: 3,
      notes: "",
    });
  };

  const openEditDialog = (order: ProjectObject) => {
    setSelectedOrder(order);
    setFormData({
      object_id: order.object_id,
      room: order.room || "",
      quantity: order.quantity,
      supplier_name: (order as any).supplier_name || "",
      supplier_url: (order as any).supplier_url || "",
      order_reference: (order as any).order_reference || "",
      order_date: (order as any).order_date || "",
      expected_delivery_date: (order as any).expected_delivery_date || "",
      price_unit: (order as any).price_unit?.toString() || "",
      tracking_number: (order as any).tracking_number || "",
      tracking_url: (order as any).tracking_url || "",
      priority: (order as any).priority || "medium",
      alert_enabled: (order as any).alert_enabled || false,
      alert_days_before: (order as any).alert_days_before || 3,
      notes: order.notes || "",
    });
    setEditDialogOpen(true);
  };

  const getStatusConfig = (status: string) => {
    return ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];
  };

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_OPTIONS.find((p) => p.value === priority) || PRIORITY_OPTIONS[1];
  };

  const isOverdue = (order: any) => {
    if (!order.expected_delivery_date) return false;
    if (order.order_status === "delivered" || order.order_status === "installed") return false;
    return isPast(parseISO(order.expected_delivery_date));
  };

  const getDeliveryAlert = (order: any) => {
    if (!order.expected_delivery_date || !order.alert_enabled) return null;
    if (order.order_status === "delivered" || order.order_status === "installed") return null;
    
    const daysUntil = differenceInDays(parseISO(order.expected_delivery_date), new Date());
    if (daysUntil <= order.alert_days_before && daysUntil >= 0) {
      return `Livraison dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""}`;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Suivi des commandes</h2>
              <p className="text-sm text-muted-foreground">
                {stats.total} produit{stats.total > 1 ? "s" : ""} • {progressPercent}% livré{progressPercent > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.slice(0, 5).map((status) => {
                const count = projectObjects.filter((o: any) => o.order_status === status.value).length;
                return (
                  <Badge
                    key={status.value}
                    variant="outline"
                    className={cn("gap-1.5", statusFilter === status.value && status.color)}
                    onClick={() => setStatusFilter(statusFilter === status.value ? "all" : status.value)}
                    role="button"
                  >
                    <status.icon className="h-3 w-3" />
                    {status.label} ({count})
                  </Badge>
                );
              })}
            </div>
          </div>
          <Progress value={progressPercent} className="mt-4 h-2" />
        </CardContent>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par produit, pièce, fournisseur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                <div className="flex items-center gap-2">
                  <status.icon className="h-4 w-4" />
                  {status.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Aucune commande</h3>
            <p className="text-muted-foreground text-center mb-4">
              Ajoutez des produits du catalogue pour les commander
            </p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order: any) => {
            const statusConfig = getStatusConfig(order.order_status);
            const priorityConfig = getPriorityConfig(order.priority);
            const overdue = isOverdue(order);
            const alert = getDeliveryAlert(order);

            return (
              <Card
                key={order.id}
                className={cn(
                  "group cursor-pointer hover:shadow-md transition-all",
                  overdue && "border-destructive"
                )}
                onClick={() => setSelectedOrder(order)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {order.object?.name || "Produit"}
                      </h3>
                      {order.object?.brand && (
                        <p className="text-sm text-muted-foreground truncate">
                          {order.object.brand}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(order); }}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        {order.tracking_url && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(order.tracking_url, "_blank"); }}>
                            <Truck className="h-4 w-4 mr-2" />
                            Suivre la livraison
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); removeObjectFromProject.mutate(order.id); }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={cn("gap-1", statusConfig.color)}>
                      <statusConfig.icon className="h-3 w-3" />
                      {statusConfig.label}
                    </Badge>
                    {order.priority && order.priority !== "medium" && (
                      <Badge variant="outline" className={priorityConfig.color}>
                        {priorityConfig.label}
                      </Badge>
                    )}
                    {overdue && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        En retard
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 text-sm">
                    {order.room && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{order.room}</span>
                      </div>
                    )}
                    {order.quantity > 1 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        <span>Qté: {order.quantity}</span>
                      </div>
                    )}
                    {order.expected_delivery_date && (
                      <div className={cn(
                        "flex items-center gap-2",
                        overdue ? "text-destructive" : "text-muted-foreground"
                      )}>
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {format(parseISO(order.expected_delivery_date), "d MMM yyyy", { locale: fr })}
                        </span>
                      </div>
                    )}
                    {order.supplier_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span className="truncate">{order.supplier_name}</span>
                      </div>
                    )}
                  </div>

                  {alert && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
                      <Bell className="h-3 w-3" />
                      {alert}
                    </div>
                  )}

                  {order.price_total && (
                    <div className="mt-3 pt-3 border-t text-right">
                      <span className="font-semibold">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: order.currency || "EUR",
                        }).format(order.price_total)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une commande</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Produit du catalogue *</Label>
              <Select value={formData.object_id} onValueChange={(v) => setFormData({ ...formData, object_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {catalogObjects.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id}>
                      {obj.name} {obj.brand && `(${obj.brand})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pièce / Emplacement</Label>
                <Input
                  placeholder="ex: Salon, Chambre 1..."
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Informations complémentaires..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddOrder} disabled={!formData.object_id}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrder && !editDialogOpen} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedOrder.object?.name || "Commande"}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Status */}
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Statut</Label>
                  <div className="mt-2">
                    <Select
                      value={(selectedOrder as any).order_status || "to_order"}
                      onValueChange={(v) => updateProjectObject.mutate({ id: selectedOrder.id, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <status.icon className="h-4 w-4" />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Product Info */}
                {selectedOrder.object && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex gap-4">
                      {selectedOrder.object.image_url && (
                        <img
                          src={selectedOrder.object.image_url}
                          alt={selectedOrder.object.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-medium">{selectedOrder.object.name}</h4>
                        {selectedOrder.object.brand && (
                          <p className="text-sm text-muted-foreground">{selectedOrder.object.brand}</p>
                        )}
                        {selectedOrder.object.source_url && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => window.open(selectedOrder.object!.source_url!, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Voir le produit
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedOrder.room && (
                    <div>
                      <span className="text-muted-foreground">Pièce:</span>
                      <p className="font-medium">{selectedOrder.room}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Quantité:</span>
                    <p className="font-medium">{selectedOrder.quantity}</p>
                  </div>
                  {(selectedOrder as any).supplier_name && (
                    <div>
                      <span className="text-muted-foreground">Fournisseur:</span>
                      <p className="font-medium">{(selectedOrder as any).supplier_name}</p>
                    </div>
                  )}
                  {(selectedOrder as any).order_reference && (
                    <div>
                      <span className="text-muted-foreground">Référence:</span>
                      <p className="font-medium">{(selectedOrder as any).order_reference}</p>
                    </div>
                  )}
                  {(selectedOrder as any).expected_delivery_date && (
                    <div>
                      <span className="text-muted-foreground">Livraison prévue:</span>
                      <p className="font-medium">
                        {format(parseISO((selectedOrder as any).expected_delivery_date), "d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  )}
                  {(selectedOrder as any).price_total && (
                    <div>
                      <span className="text-muted-foreground">Prix total:</span>
                      <p className="font-medium">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: (selectedOrder as any).currency || "EUR",
                        }).format((selectedOrder as any).price_total)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tracking */}
                {(selectedOrder as any).tracking_number && (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">N° de suivi</p>
                        <p className="font-mono">{(selectedOrder as any).tracking_number}</p>
                      </div>
                      {(selectedOrder as any).tracking_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open((selectedOrder as any).tracking_url, "_blank")}
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Suivre
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase tracking-wide">Notes</Label>
                    <p className="mt-1 text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => openEditDialog(selectedOrder)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      removeObjectFromProject.mutate(selectedOrder.id);
                      setSelectedOrder(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la commande</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Location & Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pièce / Emplacement</Label>
                <Input
                  placeholder="ex: Salon, Chambre 1..."
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantité</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            {/* Supplier Info */}
            <div className="space-y-4">
              <h4 className="font-medium">Informations fournisseur</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du fournisseur</Label>
                  <Input
                    placeholder="ex: Maison du Monde"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL fournisseur</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.supplier_url}
                    onChange={(e) => setFormData({ ...formData, supplier_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Référence commande</Label>
                  <Input
                    placeholder="ex: CMD-2024-001"
                    value={formData.order_reference}
                    onChange={(e) => setFormData({ ...formData, order_reference: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de commande</Label>
                  <Input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="space-y-4">
              <h4 className="font-medium">Livraison</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de livraison prévue</Label>
                  <Input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priorité</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>N° de suivi</Label>
                  <Input
                    placeholder="Numéro de tracking"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL de suivi</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.tracking_url}
                    onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label>Prix unitaire (€)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price_unit}
                onChange={(e) => setFormData({ ...formData, price_unit: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Informations complémentaires..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateOrder}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
