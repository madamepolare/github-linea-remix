import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Users,
  Check,
  Square,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useTenderDeliverables } from "@/hooks/useTenderDeliverables";
import { useTenderTeam } from "@/hooks/useTenderTeam";
import { DELIVERABLE_TYPES, TEAM_ROLE_LABELS } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";

interface TenderDeliverablesTabProps {
  tenderId: string;
}

export function TenderDeliverablesTab({ tenderId }: TenderDeliverablesTabProps) {
  const { deliverables, progress, isLoading, addDeliverable, toggleComplete, deleteDeliverable } = useTenderDeliverables(tenderId);
  const { teamMembers } = useTenderTeam(tenderId);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState({
    deliverable_type: "dc1",
    name: "",
    responsible_type: "mandataire",
    due_date: "",
  });

  const handleAdd = () => {
    const typeLabel = DELIVERABLE_TYPES.find(t => t.value === newDeliverable.deliverable_type)?.label || newDeliverable.deliverable_type;
    addDeliverable.mutate({
      deliverable_type: newDeliverable.deliverable_type,
      name: newDeliverable.name || typeLabel,
      responsible_type: newDeliverable.responsible_type,
      due_date: newDeliverable.due_date || undefined,
    });
    setShowAddDialog(false);
    setNewDeliverable({ deliverable_type: "dc1", name: "", responsible_type: "mandataire", due_date: "" });
  };

  const addDefaultDeliverables = () => {
    const defaults = [
      { type: "dc1", name: "DC1 - Lettre de candidature", responsible: "mandataire" },
      { type: "dc2", name: "DC2 - Déclaration du candidat", responsible: "all_members" },
      { type: "ae", name: "Acte d'Engagement", responsible: "mandataire" },
      { type: "memoire", name: "Mémoire technique", responsible: "mandataire" },
      { type: "attestation", name: "Attestations d'assurance", responsible: "all_members" },
      { type: "reference", name: "Références projets", responsible: "all_members" },
    ];

    defaults.forEach(d => {
      addDeliverable.mutate({
        deliverable_type: d.type,
        name: d.name,
        responsible_type: d.responsible,
      });
    });
  };

  const groupedDeliverables = deliverables.reduce((acc, d) => {
    const type = d.deliverable_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(d);
    return acc;
  }, {} as Record<string, typeof deliverables>);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression des livrables</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {deliverables.filter(d => d.is_completed).length} / {deliverables.length} livrables complétés
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un livrable
        </Button>
        {deliverables.length === 0 && (
          <Button variant="outline" onClick={addDefaultDeliverables}>
            Charger la liste par défaut
          </Button>
        )}
      </div>

      {/* Deliverables Table */}
      {deliverables.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-8"></th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Livrable</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Responsable</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Échéance</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {deliverables.map((deliverable) => (
                    <tr key={deliverable.id} className="hover:bg-muted/30">
                      <td className="py-2 px-3">
                        <Checkbox
                          checked={deliverable.is_completed}
                          onCheckedChange={() => toggleComplete.mutate(deliverable.id)}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <span className={cn(
                          "text-sm",
                          deliverable.is_completed && "line-through text-muted-foreground"
                        )}>
                          {deliverable.name}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">
                          {DELIVERABLE_TYPES.find(t => t.value === deliverable.deliverable_type)?.label || deliverable.deliverable_type}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <ResponsibleBadge type={deliverable.responsible_type} />
                      </td>
                      <td className="py-2 px-3 text-sm text-muted-foreground">
                        {deliverable.due_date 
                          ? format(new Date(deliverable.due_date), "dd MMM", { locale: fr })
                          : "-"
                        }
                      </td>
                      <td className="py-2 px-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteDeliverable.mutate(deliverable.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {deliverables.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun livrable défini</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez des livrables ou chargez la liste par défaut
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add Dialog */}
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
                onValueChange={(v) => setNewDeliverable({ ...newDeliverable, deliverable_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERABLE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nom personnalisé (optionnel)</Label>
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
                  <SelectItem value="mandataire">Mandataire uniquement</SelectItem>
                  <SelectItem value="all_members">Tous les membres</SelectItem>
                  <SelectItem value="cotraitant">Cotraitants</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date limite</Label>
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
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResponsibleBadge({ type }: { type: string }) {
  const config = {
    mandataire: { icon: Building2, label: "Mandataire", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
    all_members: { icon: Users, label: "Tous", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
    cotraitant: { icon: Users, label: "Cotraitants", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  }[type] || { icon: Building2, label: type, className: "bg-muted" };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
