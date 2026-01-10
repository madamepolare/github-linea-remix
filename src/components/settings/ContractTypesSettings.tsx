import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Trash2, Edit, Download, GripVertical, Building2, Sofa, Theater, Megaphone, Palette, Globe, FileText } from 'lucide-react';
import { useContractTypes, ContractType, CreateContractTypeInput, ContractTypeFields } from '@/hooks/useContractTypes';
import { Checkbox } from '@/components/ui/checkbox';

const ICON_OPTIONS = [
  { value: 'FileText', label: 'Document', icon: FileText },
  { value: 'Building2', label: 'Bâtiment', icon: Building2 },
  { value: 'Sofa', label: 'Intérieur', icon: Sofa },
  { value: 'Theater', label: 'Scène', icon: Theater },
  { value: 'Megaphone', label: 'Publicité', icon: Megaphone },
  { value: 'Palette', label: 'Design', icon: Palette },
  { value: 'Globe', label: 'Web', icon: Globe },
];

const FIELD_OPTIONS: { key: keyof ContractTypeFields; label: string }[] = [
  { key: 'surface', label: 'Surface (m²)' },
  { key: 'construction_budget', label: 'Budget travaux' },
  { key: 'address', label: 'Adresse' },
  { key: 'city', label: 'Ville' },
  { key: 'budget', label: 'Budget global' },
];

const COLOR_OPTIONS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#EF4444', '#6366F1'
];

function getIconComponent(iconName: string) {
  const option = ICON_OPTIONS.find(o => o.value === iconName);
  if (option) {
    const IconComponent = option.icon;
    return <IconComponent className="h-4 w-4" />;
  }
  return <FileText className="h-4 w-4" />;
}

export function ContractTypesSettings() {
  const { contractTypes, isLoading, createContractType, updateContractType, deleteContractType, initializeDefaults } = useContractTypes();
  const [editingType, setEditingType] = useState<ContractType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newType, setNewType] = useState<Partial<CreateContractTypeInput>>({
    name: '',
    code: '',
    description: '',
    icon: 'FileText',
    color: '#3B82F6',
    default_fields: {},
    is_default: false
  });

  const handleCreate = async () => {
    if (!newType.name || !newType.code) return;
    
    await createContractType.mutateAsync({
      name: newType.name,
      code: newType.code.toUpperCase(),
      description: newType.description,
      icon: newType.icon,
      color: newType.color,
      default_fields: newType.default_fields,
      is_default: newType.is_default,
      sort_order: contractTypes.length
    });
    
    setIsCreateOpen(false);
    setNewType({
      name: '',
      code: '',
      description: '',
      icon: 'FileText',
      color: '#3B82F6',
      default_fields: {},
      is_default: false
    });
  };

  const handleUpdate = async () => {
    if (!editingType) return;
    
    await updateContractType.mutateAsync({
      id: editingType.id,
      name: editingType.name,
      code: editingType.code,
      description: editingType.description,
      icon: editingType.icon,
      color: editingType.color,
      default_fields: editingType.default_fields,
      is_default: editingType.is_default,
      is_active: editingType.is_active
    });
    
    setEditingType(null);
  };

  const toggleField = (fields: ContractTypeFields, key: keyof ContractTypeFields): ContractTypeFields => {
    return { ...fields, [key]: !fields[key] };
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="font-medium">Types de contrats</h4>
          <p className="text-sm text-muted-foreground">
            Définissez les typologies de contrats pour vos devis (architecture, pub, branding...)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {contractTypes.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => initializeDefaults.mutate()}
              disabled={initializeDefaults.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              Charger par défaut
            </Button>
          )}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau type de contrat</DialogTitle>
                <DialogDescription>
                  Créez un type de contrat personnalisé avec ses champs spécifiques
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      value={newType.name || ''}
                      onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                      placeholder="Ex: Campagne publicitaire"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input
                      value={newType.code || ''}
                      onChange={(e) => setNewType({ ...newType, code: e.target.value.toUpperCase() })}
                      placeholder="Ex: PUB"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newType.description || ''}
                    onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                    placeholder="Description du type de contrat..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icône</Label>
                    <div className="flex flex-wrap gap-2">
                      {ICON_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setNewType({ ...newType, icon: option.value })}
                          className={`p-2 rounded border transition-colors ${
                            newType.icon === option.value 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <option.icon className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewType({ ...newType, color })}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            newType.color === color 
                              ? 'border-foreground scale-110' 
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Champs à afficher</Label>
                  <div className="flex flex-wrap gap-3">
                    {FIELD_OPTIONS.map(field => (
                      <label key={field.key} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={newType.default_fields?.[field.key] || false}
                          onCheckedChange={() => setNewType({ 
                            ...newType, 
                            default_fields: toggleField(newType.default_fields || {}, field.key)
                          })}
                        />
                        {field.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={!newType.name || !newType.code || createContractType.isPending}
                >
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {contractTypes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucun type de contrat défini</p>
            <Button onClick={() => initializeDefaults.mutate()} disabled={initializeDefaults.isPending}>
              <Download className="h-4 w-4 mr-2" />
              Charger les types par défaut
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {contractTypes.map((type) => (
            <Card key={type.id} className={!type.is_active ? 'opacity-50' : ''}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="cursor-grab shrink-0 p-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div 
                      className="p-2 rounded shrink-0"
                      style={{ backgroundColor: `${type.color}20`, color: type.color }}
                    >
                      {getIconComponent(type.icon || 'FileText')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{type.name}</span>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {type.code}
                        </Badge>
                        {type.is_default && (
                          <Badge variant="secondary" className="shrink-0 text-xs">Par défaut</Badge>
                        )}
                      </div>
                      {type.description && (
                        <p className="text-sm text-muted-foreground truncate">{type.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingType(type)}
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
                          <AlertDialogTitle>Supprimer ce type de contrat ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible. Les documents utilisant ce type ne seront pas supprimés.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteContractType.mutate(type.id)}
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

      {/* Edit Dialog */}
      {editingType && (
        <Dialog open onOpenChange={() => setEditingType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le type de contrat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={editingType.name}
                    onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={editingType.code}
                    onChange={(e) => setEditingType({ ...editingType, code: e.target.value.toUpperCase() })}
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingType.description || ''}
                  onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icône</Label>
                  <div className="flex flex-wrap gap-2">
                    {ICON_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setEditingType({ ...editingType, icon: option.value })}
                        className={`p-2 rounded border transition-colors ${
                          editingType.icon === option.value 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-muted-foreground'
                        }`}
                      >
                        <option.icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Couleur</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditingType({ ...editingType, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          editingType.color === color 
                            ? 'border-foreground scale-110' 
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Champs à afficher</Label>
                <div className="flex flex-wrap gap-3">
                  {FIELD_OPTIONS.map(field => (
                    <label key={field.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={editingType.default_fields?.[field.key] || false}
                        onCheckedChange={() => setEditingType({ 
                          ...editingType, 
                          default_fields: toggleField(editingType.default_fields, field.key)
                        })}
                      />
                      {field.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={editingType.is_active}
                    onCheckedChange={(checked) => setEditingType({ ...editingType, is_active: checked })}
                  />
                  Actif
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={editingType.is_default}
                    onCheckedChange={(checked) => setEditingType({ ...editingType, is_default: checked })}
                  />
                  Par défaut
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingType(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate} disabled={updateContractType.isPending}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
