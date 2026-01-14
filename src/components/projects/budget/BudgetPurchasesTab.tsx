import { useState } from "react";
import { Plus, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PURCHASE_STATUSES, KANBAN_COLUMNS, PurchaseStatus } from "@/lib/purchaseTypes";
import { PurchaseCard } from "./PurchaseCard";
import { CreatePurchaseDialog } from "./CreatePurchaseDialog";
import { useProjectPurchases, ProjectPurchase, CreatePurchaseInput } from "@/hooks/useProjectPurchases";

interface BudgetPurchasesTabProps {
  projectId: string;
}

export function BudgetPurchasesTab({ projectId }: BudgetPurchasesTabProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<ProjectPurchase | null>(null);

  const {
    purchases,
    isLoading,
    byStatus,
    totals,
    createPurchase,
    updatePurchase,
    updateStatus,
    deletePurchase,
  } = useProjectPurchases(projectId);

  const handleSubmit = (data: CreatePurchaseInput) => {
    if (editingPurchase) {
      updatePurchase.mutate({ id: editingPurchase.id, ...data }, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingPurchase(null);
        },
      });
    } else {
      createPurchase.mutate(data, {
        onSuccess: () => {
          setDialogOpen(false);
        },
      });
    }
  };

  const handleEdit = (purchase: ProjectPurchase) => {
    setEditingPurchase(purchase);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Supprimer cet achat ?")) {
      deletePurchase.mutate(id);
    }
  };

  const handleStatusChange = (id: string, status: PurchaseStatus) => {
    updateStatus.mutate({ id, status });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format(value);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[400px] w-[280px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Achats & Provisions</h3>
          <Badge variant="secondary">{totals.count} éléments</Badge>
          <span className="text-sm text-muted-foreground">
            Total HT : {formatCurrency(totals.totalHT)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={() => { setEditingPurchase(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel achat
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((statusKey) => {
            const status = PURCHASE_STATUSES[statusKey];
            const items = byStatus[statusKey] || [];
            const columnTotal = items.reduce((sum, p) => sum + p.amount_ht, 0);
            const StatusIcon = status.icon;

            return (
              <div
                key={statusKey}
                className="flex-shrink-0 w-[280px] bg-muted/30 rounded-lg p-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn("h-4 w-4", status.color)} />
                    <span className="font-medium text-sm">{status.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {items.length}
                    </Badge>
                  </div>
                </div>

                {/* Column Total */}
                {columnTotal > 0 && (
                  <div className="text-xs text-muted-foreground mb-3">
                    {formatCurrency(columnTotal)} HT
                  </div>
                )}

                {/* Cards */}
                <div className="space-y-3">
                  {items.map((purchase) => (
                    <PurchaseCard
                      key={purchase.id}
                      purchase={purchase}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))}

                  {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Aucun achat
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {purchases.map((purchase) => (
            <PurchaseCard
              key={purchase.id}
              purchase={purchase}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
          {purchases.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Aucun achat enregistré
            </div>
          )}
        </div>
      )}

      {/* Dialog */}
      <CreatePurchaseDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingPurchase(null);
        }}
        projectId={projectId}
        purchase={editingPurchase}
        onSubmit={handleSubmit}
        isLoading={createPurchase.isPending || updatePurchase.isPending}
      />
    </div>
  );
}
