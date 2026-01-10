import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, Edit, Euro, Sparkles, Loader2, Upload, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useQuoteTemplates, PricingGrid, PricingGridItem } from '@/hooks/useQuoteTemplates';
import { toast } from 'sonner';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useWorkspaceDiscipline } from '@/hooks/useDiscipline';
import { useSkills } from '@/hooks/useSkills';
import { supabase } from '@/integrations/supabase/client';

const GRID_TYPE_LABELS = {
  hourly: 'Horaire',
  daily: 'Journalier',
  m2: 'Au m²',
  fixed: 'Forfait'
};

export function PricingGridsSection() {
  const { pricingGrids, isLoadingPricingGrids, createPricingGrid, updatePricingGrid, deletePricingGrid } = useQuoteTemplates();
  const { isGenerating, generatePricingGrid } = useAIGeneration();
  const { data: currentDiscipline } = useWorkspaceDiscipline();
  const { skills } = useSkills();
  const [editingGrid, setEditingGrid] = useState<PricingGrid | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importedItems, setImportedItems] = useState<PricingGridItem[]>([]);
  const [importGridName, setImportGridName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newGrid, setNewGrid] = useState<Partial<PricingGrid>>({
    name: '',
    description: '',
    grid_type: 'hourly',
    items: [],
    is_active: true
  });

  const handleGenerateWithAI = async () => {
    if (!currentDiscipline) {
      toast.error('Veuillez d\'abord sélectionner une discipline dans les paramètres');
      return;
    }

    try {
      const skillNames = skills.map(s => s.setting_value?.label || '').filter(Boolean);
      if (skillNames.length === 0) {
        toast.error('Veuillez d\'abord créer des compétences');
        return;
      }

      const generatedItems = await generatePricingGrid(currentDiscipline.name, skillNames);
      
      const items = generatedItems.map((item, idx) => ({
        id: `gen-${idx}`,
        name: `${item.skill_name} - ${item.experience_level}`,
        description: `Niveau ${item.experience_level}`,
        unit: 'jour',
        unit_price: item.daily_rate,
        category: item.experience_level,
      }));

      await createPricingGrid.mutateAsync({
        name: `Grille ${currentDiscipline.name}`,
        description: 'Générée par IA',
        grid_type: 'daily',
        items,
        is_active: true,
        sort_order: pricingGrids.length
      });

      toast.success('Grille tarifaire générée avec succès');
    } catch (error) {
      console.error('Error generating pricing grid:', error);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const content = await file.text();
      
      const { data, error } = await supabase.functions.invoke('parse-bpu-file', {
        body: {
          fileContent: content,
          fileName: file.name,
          useAI: true
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      if (data.items && data.items.length > 0) {
        setImportedItems(data.items);
        setImportGridName(`Import BPU - ${file.name.replace(/\.[^.]+$/, '')}`);
        setIsImportDialogOpen(true);
        toast.success(`${data.items.length} postes importés`);
      } else {
        toast.error('Aucun poste tarifaire trouvé dans le fichier');
      }
    } catch (error) {
      console.error('Error importing BPU:', error);
      toast.error('Erreur lors de l\'import du fichier');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveImport = async () => {
    if (!importGridName || importedItems.length === 0) return;

    try {
      await createPricingGrid.mutateAsync({
        name: importGridName,
        description: 'Importée depuis BPU',
        grid_type: 'fixed',
        items: importedItems,
        is_active: true,
        sort_order: pricingGrids.length
      });

      setIsImportDialogOpen(false);
      setImportedItems([]);
      setImportGridName('');
      toast.success('Grille créée avec succès');
    } catch (error) {
      console.error('Error saving imported grid:', error);
      toast.error('Erreur lors de la création de la grille');
    }
  };

  const handleSaveNew = async () => {
    if (!newGrid.name) return;
    
    await createPricingGrid.mutateAsync({
      name: newGrid.name,
      description: newGrid.description,
      grid_type: newGrid.grid_type || 'hourly',
      items: newGrid.items || [],
      is_active: true,
      sort_order: pricingGrids.length
    });
    
    setIsCreateOpen(false);
    setNewGrid({
      name: '',
      description: '',
      grid_type: 'hourly',
      items: [],
      is_active: true
    });
  };

  if (isLoadingPricingGrids) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv,.txt,.xlsx,.xls"
        onChange={handleFileImport}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Créez des grilles tarifaires réutilisables
        </p>
        <div className="flex items-center gap-2">
          {/* Import/Generate dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isGenerating || isImporting}
              >
                {isGenerating || isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Générer
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleGenerateWithAI} disabled={!currentDiscipline}>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer par IA
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Importer un BPU
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle grille
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle grille tarifaire</DialogTitle>
                <DialogDescription>
                  Créez une grille de prix réutilisable
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom de la grille</Label>
                  <Input
                    value={newGrid.name || ''}
                    onChange={(e) => setNewGrid({ ...newGrid, name: e.target.value })}
                    placeholder="Ex: Tarifs horaires 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newGrid.description || ''}
                    onChange={(e) => setNewGrid({ ...newGrid, description: e.target.value })}
                    placeholder="Description de la grille..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type de tarification</Label>
                  <Select
                    value={newGrid.grid_type}
                    onValueChange={(v) => setNewGrid({ ...newGrid, grid_type: v as PricingGrid['grid_type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GRID_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveNew} disabled={!newGrid.name || createPricingGrid.isPending}>
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import preview dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import BPU - {importedItems.length} postes
            </DialogTitle>
            <DialogDescription>
              Vérifiez les postes importés avant de créer la grille
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la grille</Label>
              <Input
                value={importGridName}
                onChange={(e) => setImportGridName(e.target.value)}
                placeholder="Nom de la grille..."
              />
            </div>
            <div className="space-y-2">
              <Label>Postes importés ({importedItems.length})</Label>
              <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2">
                {importedItems.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-sm">
                    <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">
                      {item.pricing_ref}
                    </span>
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="font-medium shrink-0">
                      {item.unit_price}€/{item.unit}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => setImportedItems(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveImport} disabled={!importGridName || importedItems.length === 0}>
              Créer la grille
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pricingGrids.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Euro className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucune grille tarifaire</p>
            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une grille
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pricingGrids.map((grid) => (
            <Card key={grid.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{grid.name}</h4>
                      <Badge variant="outline" className="shrink-0">
                        {GRID_TYPE_LABELS[grid.grid_type]}
                      </Badge>
                      {!grid.is_active && (
                        <Badge variant="secondary" className="shrink-0">Inactive</Badge>
                      )}
                    </div>
                    {grid.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {grid.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {grid.items.length} tarifs
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingGrid(grid)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette grille ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePricingGrid.mutate(grid.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Grid Dialog */}
      {editingGrid && (
        <PricingGridEditDialog
          grid={editingGrid}
          onClose={() => setEditingGrid(null)}
          onSave={async (updated) => {
            await updatePricingGrid.mutateAsync(updated);
            setEditingGrid(null);
          }}
        />
      )}
    </div>
  );
}

interface PricingGridEditDialogProps {
  grid: PricingGrid;
  onClose: () => void;
  onSave: (grid: PricingGrid) => Promise<void>;
}

function PricingGridEditDialog({ grid, onClose, onSave }: PricingGridEditDialogProps) {
  const [editedGrid, setEditedGrid] = useState(grid);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedGrid);
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = (index: number, updates: Partial<PricingGridItem>) => {
    const newItems = [...editedGrid.items];
    newItems[index] = { ...newItems[index], ...updates };
    setEditedGrid({ ...editedGrid, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = editedGrid.items.filter((_, i) => i !== index);
    setEditedGrid({ ...editedGrid, items: newItems });
  };

  const addItem = () => {
    const newItem: PricingGridItem = {
      id: `new-${Date.now()}`,
      name: '',
      description: '',
      unit: editedGrid.grid_type === 'hourly' ? 'h' : editedGrid.grid_type === 'daily' ? 'j' : editedGrid.grid_type === 'm2' ? 'm²' : 'forfait',
      unit_price: 0
    };
    setEditedGrid({ ...editedGrid, items: [...editedGrid.items, newItem] });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la grille tarifaire</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={editedGrid.name}
                onChange={(e) => setEditedGrid({ ...editedGrid, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={editedGrid.grid_type}
                onValueChange={(v) => setEditedGrid({ ...editedGrid, grid_type: v as PricingGrid['grid_type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GRID_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={editedGrid.description || ''}
              onChange={(e) => setEditedGrid({ ...editedGrid, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-active"
              checked={editedGrid.is_active}
              onCheckedChange={(checked) => setEditedGrid({ ...editedGrid, is_active: checked })}
            />
            <Label htmlFor="is-active">Grille active</Label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tarifs ({editedGrid.items.length})</Label>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {editedGrid.items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <Input
                    value={item.pricing_ref || ''}
                    onChange={(e) => updateItem(index, { pricing_ref: e.target.value })}
                    className="w-24 font-mono text-xs"
                    placeholder="Réf."
                  />
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                    className="flex-1"
                    placeholder="Désignation"
                  />
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-24 text-right"
                  />
                  <span className="text-sm text-muted-foreground w-8">€/{item.unit}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive shrink-0"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {editedGrid.items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun tarif défini
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
