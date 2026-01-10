import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Edit, Sparkles, Loader2, Euro, Clock } from 'lucide-react';
import { usePricingGrids, PricingGrid, CreatePricingGridInput, PricingGridItem } from '@/hooks/usePricingGrids';
import { useSkills } from '@/hooks/useSkills';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Junior', description: '0-2 ans' },
  { value: 'confirmed', label: 'Confirmé', description: '2-5 ans' },
  { value: 'senior', label: 'Senior', description: '5-10 ans' },
  { value: 'expert', label: 'Expert', description: '10+ ans' },
];

function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

export function PricingGridsSettings() {
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>('');
  
  const { pricingGrids, isLoading, createPricingGrid, updatePricingGrid, deletePricingGrid } = usePricingGrids();
  const { skills } = useSkills();
  const { isGenerating, generatePricingGrid } = useAIGeneration();
  
  const [editingGrid, setEditingGrid] = useState<PricingGrid | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGrid, setNewGrid] = useState<Partial<CreatePricingGridInput>>({
    name: '',
    description: '',
    items: [],
  });

  const handleCreate = async () => {
    if (!newGrid.name) return;
    
    await createPricingGrid.mutateAsync({
      name: newGrid.name,
      description: newGrid.description,
      discipline_id: selectedDisciplineId || undefined,
      items: newGrid.items,
      sort_order: pricingGrids.length,
    });
    
    setIsCreateOpen(false);
    setNewGrid({ name: '', description: '', items: [] });
  };

  const handleGenerateAI = async () => {
    if (skills.length === 0) {
      toast.error('Aucune compétence définie. Générez d\'abord les compétences.');
      return;
    }

    try {
      const skillNames = skills.map(s => s.setting_value?.label || '').filter(Boolean);
      const generatedItems = await generatePricingGrid('Général', skillNames);
      
      if (generatedItems && generatedItems.length > 0) {
        await createPricingGrid.mutateAsync({
          name: `Grille tarifaire`,
          description: `Grille générée par IA`,
          items: generatedItems as unknown as Json[],
          grid_type: 'experience',
          sort_order: pricingGrids.length,
        });
        toast.success('Grille tarifaire générée par IA');
      }
    } catch (error) {
      console.error('Error generating pricing grid:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="font-medium">Grilles tarifaires</h4>
          <p className="text-sm text-muted-foreground">
            Définissez les tarifs par compétence et niveau d'expérience
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAI}
            disabled={isGenerating || skills.length === 0}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Générer par IA
          </Button>

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
                  Créez une grille tarifaire personnalisée
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={newGrid.name || ''}
                    onChange={(e) => setNewGrid({ ...newGrid, name: e.target.value })}
                    placeholder="Ex: Grille standard 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newGrid.description || ''}
                    onChange={(e) => setNewGrid({ ...newGrid, description: e.target.value })}
                    placeholder="Description optionnelle..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={!newGrid.name || createPricingGrid.isPending}
                >
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {pricingGrids.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Euro className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucune grille tarifaire définie</p>
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline"
                onClick={handleGenerateAI} 
                disabled={isGenerating || skills.length === 0}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Générer par IA
              </Button>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer manuellement
              </Button>
            </div>
            {skills.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Générez d'abord les compétences pour utiliser l'IA
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pricingGrids.map((grid) => (
            <Card key={grid.id} className={!grid.is_active ? 'opacity-50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{grid.name}</CardTitle>
                    {grid.description && (
                      <p className="text-sm text-muted-foreground">{grid.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
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
              </CardHeader>
              <CardContent>
                {grid.items && Array.isArray(grid.items) && grid.items.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Compétence</TableHead>
                          <TableHead>Niveau</TableHead>
                          <TableHead className="text-right">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Horaire
                          </TableHead>
                          <TableHead className="text-right">Journalier</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(grid.items as unknown as PricingGridItem[]).slice(0, 8).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.skill_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {EXPERIENCE_LEVELS.find(e => e.value === item.experience_level)?.label || item.experience_level}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.hourly_rate)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.daily_rate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {grid.items.length > 8 && (
                      <div className="p-2 text-center text-sm text-muted-foreground border-t">
                        +{grid.items.length - 8} autres lignes
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun tarif défini dans cette grille
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
