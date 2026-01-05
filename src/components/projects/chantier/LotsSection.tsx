import React, { useState } from "react";
import { Plus, Building2, Calendar, MoreHorizontal, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ProjectLot } from "@/hooks/useChantier";
import { CRMCompany } from "@/lib/crmTypes";

interface LotsSectionProps {
  projectId: string;
  lots: ProjectLot[];
  lotsLoading: boolean;
  onCreateLot: (name: string, startDate?: string, endDate?: string, companyId?: string) => void;
  onUpdateLot: (id: string, updates: Partial<ProjectLot>) => void;
  onDeleteLot: (id: string) => void;
  companies: CRMCompany[];
}

const STATUS_CONFIG = {
  pending: { label: "En attente", color: "bg-slate-500" },
  in_progress: { label: "En cours", color: "bg-blue-500" },
  completed: { label: "Terminé", color: "bg-green-500" },
  delayed: { label: "En retard", color: "bg-red-500" },
};

export function LotsSection({
  projectId,
  lots,
  lotsLoading,
  onCreateLot,
  onUpdateLot,
  onDeleteLot,
  companies,
}: LotsSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLot, setEditingLot] = useState<ProjectLot | null>(null);
  const [deletingLot, setDeletingLot] = useState<ProjectLot | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    crm_company_id: "",
    start_date: "",
    end_date: "",
    status: "pending" as string,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      crm_company_id: "",
      start_date: "",
      end_date: "",
      status: "pending",
    });
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleOpenEditDialog = (lot: ProjectLot) => {
    setFormData({
      name: lot.name,
      crm_company_id: lot.crm_company_id || "",
      start_date: lot.start_date || "",
      end_date: lot.end_date || "",
      status: lot.status,
    });
    setEditingLot(lot);
  };

  const handleCreateLot = () => {
    if (!formData.name.trim()) return;
    onCreateLot(
      formData.name,
      formData.start_date || undefined,
      formData.end_date || undefined,
      formData.crm_company_id || undefined
    );
    setShowAddDialog(false);
    resetForm();
  };

  const handleUpdateLot = () => {
    if (!editingLot || !formData.name.trim()) return;
    onUpdateLot(editingLot.id, {
      name: formData.name,
      crm_company_id: formData.crm_company_id || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      status: formData.status,
    });
    setEditingLot(null);
    resetForm();
  };

  const handleDeleteLot = () => {
    if (!deletingLot) return;
    onDeleteLot(deletingLot.id);
    setDeletingLot(null);
  };

  const getCompanyName = (lot: ProjectLot) => {
    // Use the joined company data if available
    if (lot.company?.name) return lot.company.name;
    // Fallback to looking up by crm_company_id
    if (!lot.crm_company_id) return null;
    const company = companies.find(c => c.id === lot.crm_company_id);
    return company?.name || null;
  };

  if (lotsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted/50 animate-pulse rounded-lg" />
        <div className="h-32 bg-muted/50 animate-pulse rounded-lg" />
        <div className="h-32 bg-muted/50 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Gestion des lots</h2>
          <p className="text-sm text-muted-foreground">
            {lots.length} lot{lots.length !== 1 ? "s" : ""} configuré{lots.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleOpenAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un lot
        </Button>
      </div>

      {/* Lots Grid */}
      {lots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <GripVertical className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Aucun lot configuré</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Ajoutez des lots pour organiser les interventions de votre chantier par corps de métier
            </p>
            <Button onClick={handleOpenAddDialog} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter le premier lot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lots.map((lot, index) => {
            const statusConfig = STATUS_CONFIG[lot.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
            const companyName = getCompanyName(lot);
            
            return (
              <Card key={lot.id} className="group hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base">{lot.name}</CardTitle>
                        {companyName && (
                          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {companyName}
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(lot)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingLot(lot)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={`${statusConfig.color} text-white`}>
                      {statusConfig.label}
                    </Badge>
                    {(lot.start_date || lot.end_date) && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {lot.start_date && format(new Date(lot.start_date), "dd MMM", { locale: fr })}
                        {lot.start_date && lot.end_date && " - "}
                        {lot.end_date && format(new Date(lot.end_date), "dd MMM", { locale: fr })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Lot Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un lot</DialogTitle>
            <DialogDescription>
              Créez un nouveau lot pour organiser les interventions du chantier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du lot *</Label>
              <Input
                id="name"
                placeholder="Ex: Gros œuvre, Électricité, Plomberie..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Entreprise</Label>
              <Select
                value={formData.crm_company_id}
                onValueChange={(value) => setFormData({ ...formData, crm_company_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une entreprise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Date de début</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Date de fin</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateLot} disabled={!formData.name.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lot Dialog */}
      <Dialog open={!!editingLot} onOpenChange={(open) => !open && setEditingLot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le lot</DialogTitle>
            <DialogDescription>
              Modifiez les informations du lot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom du lot *</Label>
              <Input
                id="edit-name"
                placeholder="Ex: Gros œuvre, Électricité, Plomberie..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Entreprise</Label>
              <Select
                value={formData.crm_company_id}
                onValueChange={(value) => setFormData({ ...formData, crm_company_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une entreprise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ProjectLot["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start_date">Date de début</Label>
                <Input
                  id="edit-start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end_date">Date de fin</Label>
                <Input
                  id="edit-end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLot(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateLot} disabled={!formData.name.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingLot} onOpenChange={(open) => !open && setDeletingLot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le lot</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le lot "{deletingLot?.name}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLot(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteLot}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
