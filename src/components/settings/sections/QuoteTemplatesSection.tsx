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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, Edit, Copy, GripVertical, FileText, Download, Sparkles, ChevronDown, Loader2, CheckCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuoteTemplates, QuoteTemplate, QuoteTemplatePhase } from '@/hooks/useQuoteTemplates';
import { ProjectType, PROJECT_TYPE_LABELS, PHASES_BY_PROJECT_TYPE } from '@/lib/commercialTypes';
import { ALL_MISSION_TEMPLATES, getMissionCategories, MissionTemplate } from '@/lib/defaultMissionTemplates';
import { toast } from 'sonner';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useWorkspaceDiscipline } from '@/hooks/useDiscipline';

export function QuoteTemplatesSection() {
  const { templates, isLoadingTemplates, createTemplate, updateTemplate, deleteTemplate } = useQuoteTemplates();
  const { isGenerating, generateQuoteTemplate } = useAIGeneration();
  const { data: currentDiscipline } = useWorkspaceDiscipline();
  const [editingTemplate, setEditingTemplate] = useState<QuoteTemplate | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedTemplate, setGeneratedTemplate] = useState<{
    name: string;
    description: string;
    phases: QuoteTemplatePhase[];
  } | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<QuoteTemplate>>({
    name: '',
    description: '',
    project_type: 'interior',
    phases: [],
    is_default: false
  });

  const handleOpenAIDialog = () => {
    setAiPrompt('');
    setGeneratedTemplate(null);
    setShowAIDialog(true);
  };

  const handleGenerateWithAI = async () => {
    if (!currentDiscipline) {
      toast.error('Veuillez d\'abord sélectionner une discipline dans les paramètres');
      return;
    }

    try {
      const generated = await generateQuoteTemplate(
        currentDiscipline.name,
        undefined,
        aiPrompt || undefined
      );
      
      const phases: QuoteTemplatePhase[] = generated.default_phases.map((p, idx) => ({
        code: p.phase_code,
        name: p.phase_name,
        description: p.description,
        defaultPercentage: p.percentage,
        deliverables: [] as string[],
        category: idx < 3 ? 'base' : 'complementary' as 'base' | 'complementary'
      }));

      setGeneratedTemplate({
        name: generated.name,
        description: generated.description,
        phases
      });
    } catch (error) {
      console.error('Error generating quote template:', error);
    }
  };

  const handleApplyGeneratedTemplate = async () => {
    if (!generatedTemplate) return;
    
    await createTemplate.mutateAsync({
      name: generatedTemplate.name,
      description: generatedTemplate.description,
      project_type: 'interior',
      phases: generatedTemplate.phases,
      is_default: false,
      sort_order: templates.length
    });

    toast.success('Template généré avec succès');
    setShowAIDialog(false);
    setGeneratedTemplate(null);
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
            onClick={handleOpenAIDialog}
            disabled={!currentDiscipline}
          >
            <Sparkles className="h-4 w-4 mr-2" />
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

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Générer un template avec l'IA
            </DialogTitle>
            <DialogDescription>
              {currentDiscipline 
                ? `Génération basée sur la discipline : ${currentDiscipline.name}`
                : 'Sélectionnez une discipline dans les paramètres'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Description du template (optionnel)</Label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Template pour une mission de rénovation d'appartement haussmannien avec suivi de chantier complet..."
                rows={3}
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide pour générer un template standard basé sur votre discipline.
              </p>
            </div>

            {!generatedTemplate && (
              <Button 
                onClick={handleGenerateWithAI} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer le template
                  </>
                )}
              </Button>
            )}

            {generatedTemplate && (
              <ScrollArea className="max-h-[300px] pr-4">
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <h4 className="font-medium">{generatedTemplate.name}</h4>
                    <p className="text-sm text-muted-foreground">{generatedTemplate.description}</p>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Phases générées ({generatedTemplate.phases.length})</Label>
                    <div className="space-y-2">
                      {generatedTemplate.phases.map((phase, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded bg-background">
                          <Badge variant="outline" className="font-mono text-xs shrink-0">
                            {phase.code}
                          </Badge>
                          <span className="flex-1 text-sm truncate">{phase.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {phase.defaultPercentage}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Annuler
            </Button>
            {generatedTemplate ? (
              <Button 
                onClick={handleApplyGeneratedTemplate}
                disabled={createTemplate.isPending}
              >
                {createTemplate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Appliquer ce template
                  </>
                )}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
