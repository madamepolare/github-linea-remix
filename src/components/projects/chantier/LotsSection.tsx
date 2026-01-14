import React, { useState } from "react";
import { Plus, Building2, Calendar, MoreHorizontal, Pencil, Trash2, FileStack, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ProjectLot } from "@/hooks/useChantier";
import { CRMCompany } from "@/lib/crmTypes";
import { DEFAULT_LOTS_TEMPLATES, LotTemplate } from "@/lib/defaultLots";

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
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingLot, setEditingLot] = useState<ProjectLot | null>(null);
  const [deletingLot, setDeletingLot] = useState<ProjectLot | null>(null);
  
  // Template selection state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<LotTemplate | null>(null);
  const [selectedLots, setSelectedLots] = useState<Set<string>>(new Set());
  
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
    if (lot.company?.name) return lot.company.name;
    if (!lot.crm_company_id) return null;
    const company = companies.find(c => c.id === lot.crm_company_id);
    return company?.name || null;
  };

  // Template handling
  const handleOpenTemplateDialog = () => {
    setSelectedCategory("");
    setSelectedTemplate(null);
    setSelectedLots(new Set());
    setShowTemplateDialog(true);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedTemplate(null);
    setSelectedLots(new Set());
  };

  const handleTemplateChange = (templateName: string) => {
    const templates = DEFAULT_LOTS_TEMPLATES[selectedCategory] || [];
    const template = templates.find(t => t.name === templateName) || null;
    setSelectedTemplate(template);
    // Select all lots by default
    if (template) {
      setSelectedLots(new Set(template.lots.map(l => l.name)));
    } else {
      setSelectedLots(new Set());
    }
  };

  const toggleLotSelection = (lotName: string) => {
    const newSelected = new Set(selectedLots);
    if (newSelected.has(lotName)) {
      newSelected.delete(lotName);
    } else {
      newSelected.add(lotName);
    }
    setSelectedLots(newSelected);
  };

  const toggleSelectAll = () => {
    if (!selectedTemplate) return;
    if (selectedLots.size === selectedTemplate.lots.length) {
      setSelectedLots(new Set());
    } else {
      setSelectedLots(new Set(selectedTemplate.lots.map(l => l.name)));
    }
  };

  const handleImportLots = () => {
    if (!selectedTemplate || selectedLots.size === 0) return;
    
    const lotsToImport = selectedTemplate.lots.filter(l => selectedLots.has(l.name));
    lotsToImport.forEach((lot, index) => {
      // Slight delay to avoid race conditions
      setTimeout(() => {
        onCreateLot(lot.name);
      }, index * 50);
    });
    
    setShowTemplateDialog(false);
  };

  const categories = Object.keys(DEFAULT_LOTS_TEMPLATES);
  const categoryLabels: Record<string, string> = {
    interior: "Aménagement intérieur",
    architecture: "Architecture",
    scenography: "Scénographie",
  };

  if (lotsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted/50 animate-pulse rounded-lg" />
        <div className="h-64 bg-muted/50 animate-pulse rounded-lg" />
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOpenTemplateDialog} className="gap-2">
            <FileStack className="h-4 w-4" />
            Charger un template
          </Button>
          <Button onClick={handleOpenAddDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un lot
          </Button>
        </div>
      </div>

      {/* Lots Table */}
      {lots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileStack className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">Aucun lot configuré</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Ajoutez des lots individuellement ou chargez un template prédéfini
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleOpenTemplateDialog} className="gap-2">
                <FileStack className="h-4 w-4" />
                Charger un template
              </Button>
              <Button onClick={handleOpenAddDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un lot
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nom du lot</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.map((lot, index) => {
                const statusConfig = STATUS_CONFIG[lot.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                const companyName = getCompanyName(lot);
                
                return (
                  <TableRow key={lot.id} className="group">
                    <TableCell className="font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{lot.name}</TableCell>
                    <TableCell>
                      {companyName ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {companyName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lot.start_date || lot.end_date ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {lot.start_date && format(new Date(lot.start_date), "dd/MM/yy", { locale: fr })}
                          {lot.start_date && lot.end_date && " → "}
                          {lot.end_date && format(new Date(lot.end_date), "dd/MM/yy", { locale: fr })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${statusConfig.color} text-white text-xs`}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
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
                value={formData.crm_company_id || "__none__"}
                onValueChange={(value) => setFormData({ ...formData, crm_company_id: value === "__none__" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une entreprise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune</SelectItem>
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

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Charger un template de lots</DialogTitle>
            <DialogDescription>
              Sélectionnez un template puis choisissez les lots à importer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {categoryLabels[cat] || cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Selection */}
            {selectedCategory && (
              <div className="space-y-2">
                <Label>Template</Label>
                <Select 
                  value={selectedTemplate?.name || ""} 
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {(DEFAULT_LOTS_TEMPLATES[selectedCategory] || []).map((template) => (
                      <SelectItem key={template.name} value={template.name}>
                        {template.name} ({template.lots.length} lots)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Lots Selection */}
            {selectedTemplate && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Lots à importer</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleSelectAll}
                    className="h-7 text-xs"
                  >
                    {selectedLots.size === selectedTemplate.lots.length ? "Tout désélectionner" : "Tout sélectionner"}
                  </Button>
                </div>
                <ScrollArea className="h-64 rounded-md border">
                  <div className="p-3 space-y-2">
                    {selectedTemplate.lots.map((lot) => (
                      <div 
                        key={lot.name}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleLotSelection(lot.name)}
                      >
                        <Checkbox 
                          checked={selectedLots.has(lot.name)}
                          onCheckedChange={() => toggleLotSelection(lot.name)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{lot.name}</p>
                          {lot.description && (
                            <p className="text-xs text-muted-foreground truncate">{lot.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {selectedLots.size} lot{selectedLots.size !== 1 ? "s" : ""} sélectionné{selectedLots.size !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleImportLots} 
              disabled={!selectedTemplate || selectedLots.size === 0}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Importer {selectedLots.size > 0 ? `(${selectedLots.size})` : ""}
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
                onValueChange={(value) => setFormData({ ...formData, status: value })}
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
