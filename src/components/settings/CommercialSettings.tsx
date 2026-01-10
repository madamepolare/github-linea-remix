import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, Edit, Copy, GripVertical, FileText, Euro, Download, Sparkles, ChevronDown, FolderKanban, UserCog, Loader2 } from 'lucide-react';
import { useQuoteTemplates, QuoteTemplate, QuoteTemplatePhase, PricingGrid, PricingGridItem } from '@/hooks/useQuoteTemplates';
import { ProjectType, PROJECT_TYPE_LABELS, PHASES_BY_PROJECT_TYPE } from '@/lib/commercialTypes';
import { Skeleton } from '@/components/ui/skeleton';
import { ALL_MISSION_TEMPLATES, getMissionCategories, MissionTemplate } from '@/lib/defaultMissionTemplates';
import { toast } from 'sonner';
import { ContractTypesSettings } from './ContractTypesSettings';
import { SkillsSettings } from './SkillsSettings';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useWorkspaceDiscipline } from '@/hooks/useDiscipline';
import { useSkills } from '@/hooks/useSkills';

const GRID_TYPE_LABELS = {
  hourly: 'Horaire',
  daily: 'Journalier',
  m2: 'Au m²',
  fixed: 'Forfait'
};

export function CommercialSettings() {
  const [activeTab, setActiveTab] = useState('contracts');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Paramètres Finance</h3>
        <p className="text-sm text-muted-foreground">
          Gérez vos types de contrats, templates de devis et grilles tarifaires.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="contracts" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Types de contrats
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-2">
            <UserCog className="h-4 w-4" />
            Compétences
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates de devis
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <Euro className="h-4 w-4" />
            Grilles tarifaires
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="mt-6">
          <ContractTypesSettings />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillsSettings />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <QuoteTemplatesSection />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <PricingGridsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuoteTemplatesSection() {
  const { templates, isLoadingTemplates, createTemplate, updateTemplate, deleteTemplate, initializeDefaults } = useQuoteTemplates();
  const { isGenerating, generateQuoteTemplate } = useAIGeneration();
  const { data: currentDiscipline } = useWorkspaceDiscipline();
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<QuoteTemplate>>({
    name: '',
    description: '',
    project_type: 'interior',
    phases: [],
    is_default: false
  });

  const handleGenerateWithAI = async () => {
    if (!currentDiscipline) {
      toast.error('Veuillez d\'abord sélectionner une discipline dans les paramètres');
      return;
    }

    try {
      const generated = await generateQuoteTemplate(currentDiscipline.name);
      
      // Convert generated phases to expected format
      const phases = generated.default_phases.map((p, idx) => ({
        code: p.phase_code,
        name: p.phase_name,
        description: p.description,
        defaultPercentage: p.percentage,
        deliverables: [] as string[],
        category: idx < 3 ? 'base' : 'complementary' as 'base' | 'complementary'
      }));

      await createTemplate.mutateAsync({
        name: generated.name,
        description: generated.description,
        project_type: 'interior',
        phases,
        is_default: false,
        sort_order: templates.length
      });

      toast.success('Template généré avec succès');
    } catch (error) {
      console.error('Error generating quote template:', error);
    }
  };

  const handleCreateFromDefaults = async (projectType: ProjectType) => {
    const defaultPhases = PHASES_BY_PROJECT_TYPE[projectType];
    await createTemplate.mutateAsync({
      name: `Nouveau template ${PROJECT_TYPE_LABELS[projectType]}`,
      description: '',
      project_type: projectType,
      phases: defaultPhases,
      is_default: false,
      sort_order: templates.length
    });
  };

  const handleLoadMissionTemplate = async (missionTemplate: MissionTemplate) => {
    await createTemplate.mutateAsync({
      name: missionTemplate.name,
      description: missionTemplate.description,
      project_type: missionTemplate.projectType,
      phases: missionTemplate.phases,
      is_default: false,
      sort_order: templates.length
    });
    toast.success(`Template "${missionTemplate.name}" ajouté`);
  };

  const handleLoadAllTemplates = async () => {
    setIsLoadingDefaults(true);
    try {
      for (const template of ALL_MISSION_TEMPLATES) {
        // Check if already exists
        const exists = templates.some(t => t.name === template.name);
        if (!exists) {
          await createTemplate.mutateAsync({
            name: template.name,
            description: template.description,
            project_type: template.projectType,
            phases: template.phases,
            is_default: false,
            sort_order: templates.length
          });
        }
      }
      toast.success(`${ALL_MISSION_TEMPLATES.length} templates chargés`);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoadingDefaults(false);
    }
  };

  const missionCategories = getMissionCategories();

  const handleSaveNew = async () => {
    if (!newTemplate.name) return;
    
    await createTemplate.mutateAsync({
      name: newTemplate.name,
      description: newTemplate.description,
      project_type: newTemplate.project_type || 'interior',
      phases: newTemplate.phases || PHASES_BY_PROJECT_TYPE[newTemplate.project_type || 'interior'],
      is_default: false,
      sort_order: templates.length
    });
    
    setIsCreateOpen(false);
    setNewTemplate({
      name: '',
      description: '',
      project_type: 'interior',
      phases: [],
      is_default: false
    });
  };

  const handleDuplicate = async (template: QuoteTemplate) => {
    await createTemplate.mutateAsync({
      name: `${template.name} (copie)`,
      description: template.description,
      project_type: template.project_type,
      phases: template.phases,
      is_default: false,
      sort_order: templates.length
    });
  };

  if (isLoadingTemplates) {
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Créez des templates de phases réutilisables pour vos devis
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateWithAI}
            disabled={isGenerating || !currentDiscipline}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Générer par IA
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoadingDefaults}>
                <Download className="h-4 w-4 mr-2" />
                Charger templates
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Templates prédéfinis
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLoadAllTemplates} disabled={isLoadingDefaults}>
                <Download className="h-4 w-4 mr-2" />
                Charger tous les templates ({ALL_MISSION_TEMPLATES.length})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {missionCategories.map((category) => (
                <DropdownMenuSub key={category.type}>
                  <DropdownMenuSubTrigger>
                    {category.label} ({category.templates.length})
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64">
                    {category.templates.map((template) => (
                      <DropdownMenuItem
                        key={template.id}
                        onClick={() => handleLoadMissionTemplate(template)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {template.phases.length} phases
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
              <DialogTitle>Nouveau template de devis</DialogTitle>
              <DialogDescription>
                Créez un template avec des phases prédéfinies
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du template</Label>
                <Input
                  value={newTemplate.name || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="Ex: Mission complète résidentiel"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newTemplate.description || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Description du template..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Type de projet</Label>
                <Select
                  value={newTemplate.project_type}
                  onValueChange={(v) => setNewTemplate({ 
                    ...newTemplate, 
                    project_type: v as ProjectType,
                    phases: PHASES_BY_PROJECT_TYPE[v as ProjectType]
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['interior', 'architecture', 'scenography'] as ProjectType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {PROJECT_TYPE_LABELS[type]}
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
                <Button onClick={handleSaveNew} disabled={!newTemplate.name || createTemplate.isPending}>
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucun template créé</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {(['interior', 'architecture', 'scenography'] as ProjectType[]).map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => handleCreateFromDefaults(type)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {PROJECT_TYPE_LABELS[type]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{template.name}</h4>
                      <Badge variant="outline" className="shrink-0">
                        {PROJECT_TYPE_LABELS[template.project_type]}
                      </Badge>
                      {template.is_default && (
                        <Badge variant="secondary" className="shrink-0">Par défaut</Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {template.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.phases.length} phases
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingTemplate(template)}
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
                          <AlertDialogTitle>Supprimer ce template ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTemplate.mutate(template.id)}
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

      {/* Edit Template Dialog */}
      {editingTemplate && (
        <QuoteTemplateEditDialog
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSave={async (updated) => {
            await updateTemplate.mutateAsync(updated);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}

interface QuoteTemplateEditDialogProps {
  template: QuoteTemplate;
  onClose: () => void;
  onSave: (template: QuoteTemplate) => Promise<void>;
}

function QuoteTemplateEditDialog({ template, onClose, onSave }: QuoteTemplateEditDialogProps) {
  const [editedTemplate, setEditedTemplate] = useState(template);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedTemplate);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePhase = (index: number, updates: Partial<QuoteTemplatePhase>) => {
    const newPhases = [...editedTemplate.phases];
    newPhases[index] = { ...newPhases[index], ...updates };
    setEditedTemplate({ ...editedTemplate, phases: newPhases });
  };

  const removePhase = (index: number) => {
    const newPhases = editedTemplate.phases.filter((_, i) => i !== index);
    setEditedTemplate({ ...editedTemplate, phases: newPhases });
  };

  const addPhase = () => {
    const newPhase: QuoteTemplatePhase = {
      code: 'NEW',
      name: 'Nouvelle phase',
      description: '',
      defaultPercentage: 10,
      deliverables: [],
      category: 'base'
    };
    setEditedTemplate({ ...editedTemplate, phases: [...editedTemplate.phases, newPhase] });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le template</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={editedTemplate.name}
                onChange={(e) => setEditedTemplate({ ...editedTemplate, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type de projet</Label>
              <Select
                value={editedTemplate.project_type}
                onValueChange={(v) => setEditedTemplate({ ...editedTemplate, project_type: v as ProjectType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['interior', 'architecture', 'scenography'] as ProjectType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {PROJECT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={editedTemplate.description || ''}
              onChange={(e) => setEditedTemplate({ ...editedTemplate, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-default"
              checked={editedTemplate.is_default}
              onCheckedChange={(checked) => setEditedTemplate({ ...editedTemplate, is_default: checked })}
            />
            <Label htmlFor="is-default">Template par défaut pour ce type de projet</Label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Phases ({editedTemplate.phases.length})</Label>
              <Button size="sm" variant="outline" onClick={addPhase}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {editedTemplate.phases.map((phase, index) => (
                <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    value={phase.code}
                    onChange={(e) => updatePhase(index, { code: e.target.value })}
                    className="w-20"
                    placeholder="Code"
                  />
                  <Input
                    value={phase.name}
                    onChange={(e) => updatePhase(index, { name: e.target.value })}
                    className="flex-1"
                    placeholder="Nom de la phase"
                  />
                  <Input
                    type="number"
                    value={phase.defaultPercentage}
                    onChange={(e) => updatePhase(index, { defaultPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive shrink-0"
                    onClick={() => removePhase(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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

function PricingGridsSection() {
  const { pricingGrids, isLoadingPricingGrids, createPricingGrid, updatePricingGrid, deletePricingGrid } = useQuoteTemplates();
  const { isGenerating, generatePricingGrid } = useAIGeneration();
  const { data: currentDiscipline } = useWorkspaceDiscipline();
  const { skills } = useSkills();
  const [editingGrid, setEditingGrid] = useState<PricingGrid | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
      
      // Create pricing grid with generated items
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Créez des grilles tarifaires réutilisables
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateWithAI}
            disabled={isGenerating || !currentDiscipline}
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
