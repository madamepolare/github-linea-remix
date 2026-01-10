import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Trash2, Edit, UserCog, Euro } from 'lucide-react';
import { useSkills, Skill, CreateSkillInput } from '@/hooks/useSkills';

const PRESET_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function SkillsSettings() {
  const { skills, isLoading, createSkill, updateSkill, deleteSkill } = useSkills();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [newSkill, setNewSkill] = useState<CreateSkillInput>({
    label: '',
    daily_rate: 0,
    cost_daily_rate: 0,
    color: PRESET_COLORS[0],
    description: '',
  });

  const handleCreate = async () => {
    if (!newSkill.label) return;
    await createSkill.mutateAsync(newSkill);
    setIsCreateOpen(false);
    setNewSkill({ label: '', daily_rate: 0, cost_daily_rate: 0, color: PRESET_COLORS[0], description: '' });
  };

  const handleUpdate = async () => {
    if (!editingSkill) return;
    await updateSkill.mutateAsync({
      id: editingSkill.id,
      label: editingSkill.setting_value.label,
      daily_rate: editingSkill.setting_value.daily_rate,
      cost_daily_rate: editingSkill.setting_value.cost_daily_rate,
      color: editingSkill.setting_value.color,
      description: editingSkill.setting_value.description,
    });
    setEditingSkill(null);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const calculateMargin = (dailyRate: number, costRate: number) => {
    if (dailyRate <= 0) return 0;
    return ((dailyRate - costRate) / dailyRate * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Compétences & Taux</h4>
          <p className="text-sm text-muted-foreground">
            Définissez les compétences avec leurs taux de vente et de coût pour calculer la marge automatiquement
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle compétence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle compétence</DialogTitle>
              <DialogDescription>
                Définissez une compétence avec ses taux journaliers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de la compétence</Label>
                <Input
                  value={newSkill.label}
                  onChange={(e) => setNewSkill({ ...newSkill, label: e.target.value })}
                  placeholder="Ex: Chef de projet, Designer senior..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Taux journalier vente
                  </Label>
                  <Input
                    type="number"
                    value={newSkill.daily_rate || ''}
                    onChange={(e) => setNewSkill({ ...newSkill, daily_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="600"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Taux journalier coût
                  </Label>
                  <Input
                    type="number"
                    value={newSkill.cost_daily_rate || ''}
                    onChange={(e) => setNewSkill({ ...newSkill, cost_daily_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="350"
                  />
                </div>
              </div>

              {newSkill.daily_rate > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Marge calculée</span>
                    <span className={`font-medium ${calculateMargin(newSkill.daily_rate, newSkill.cost_daily_rate) >= 30 ? 'text-green-600' : calculateMargin(newSkill.daily_rate, newSkill.cost_daily_rate) >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
                      {calculateMargin(newSkill.daily_rate, newSkill.cost_daily_rate).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${newSkill.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewSkill({ ...newSkill, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description (optionnel)</Label>
                <Input
                  value={newSkill.description || ''}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  placeholder="Description de la compétence..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={!newSkill.label || createSkill.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {skills.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucune compétence définie</p>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une compétence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {skills.map((skill) => {
            const margin = calculateMargin(skill.setting_value.daily_rate, skill.setting_value.cost_daily_rate);
            return (
              <Card key={skill.id}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: skill.setting_value.color || '#6366f1' }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{skill.setting_value.label}</h5>
                      </div>
                      {skill.setting_value.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {skill.setting_value.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(skill.setting_value.daily_rate)}/jour
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Coût: {formatCurrency(skill.setting_value.cost_daily_rate)}/jour
                        </div>
                      </div>

                      <Badge 
                        variant="secondary"
                        className={margin >= 30 ? 'bg-green-100 text-green-700' : margin >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                      >
                        {margin.toFixed(0)}% marge
                      </Badge>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingSkill(skill)}
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
                            <AlertDialogTitle>Supprimer cette compétence ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSkill.mutate(skill.id)}
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
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      {editingSkill && (
        <Dialog open={!!editingSkill} onOpenChange={() => setEditingSkill(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la compétence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de la compétence</Label>
                <Input
                  value={editingSkill.setting_value.label}
                  onChange={(e) => setEditingSkill({
                    ...editingSkill,
                    setting_value: { ...editingSkill.setting_value, label: e.target.value }
                  })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taux journalier vente (€)</Label>
                  <Input
                    type="number"
                    value={editingSkill.setting_value.daily_rate || ''}
                    onChange={(e) => setEditingSkill({
                      ...editingSkill,
                      setting_value: { ...editingSkill.setting_value, daily_rate: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Taux journalier coût (€)</Label>
                  <Input
                    type="number"
                    value={editingSkill.setting_value.cost_daily_rate || ''}
                    onChange={(e) => setEditingSkill({
                      ...editingSkill,
                      setting_value: { ...editingSkill.setting_value, cost_daily_rate: parseFloat(e.target.value) || 0 }
                    })}
                  />
                </div>
              </div>

              {editingSkill.setting_value.daily_rate > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Marge calculée</span>
                    <span className={`font-medium ${calculateMargin(editingSkill.setting_value.daily_rate, editingSkill.setting_value.cost_daily_rate) >= 30 ? 'text-green-600' : 'text-amber-600'}`}>
                      {calculateMargin(editingSkill.setting_value.daily_rate, editingSkill.setting_value.cost_daily_rate).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${editingSkill.setting_value.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditingSkill({
                        ...editingSkill,
                        setting_value: { ...editingSkill.setting_value, color }
                      })}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingSkill.setting_value.description || ''}
                  onChange={(e) => setEditingSkill({
                    ...editingSkill,
                    setting_value: { ...editingSkill.setting_value, description: e.target.value }
                  })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSkill(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate} disabled={updateSkill.isPending}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
