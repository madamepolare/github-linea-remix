import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  GripVertical,
  Settings2,
  FileText,
  Sparkles,
  Building2,
  Award,
  HardHat,
  Frame,
  Calendar,
  Megaphone,
  Globe,
  FileStack,
  ChevronDown,
  ChevronRight,
  Wand2,
  Edit2,
  Trash2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useTenderTypeConfigs,
  DEFAULT_TENDER_TYPES,
  type TenderTypeConfig,
  type TenderTypeField,
  type CreateTenderTypeInput,
} from "@/hooks/useTenderTypeConfigs";
import { type DisciplineSlug } from "@/lib/tenderDisciplineConfig";
import { useWorkspaceDisciplines } from "@/hooks/useWorkspaceDisciplines";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Building2,
  Award,
  HardHat,
  Frame,
  Calendar,
  Sparkles,
  Megaphone,
  Globe,
  FileStack,
  Settings2,
};

const DISCIPLINES: { slug: DisciplineSlug; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { slug: 'architecture', label: 'Architecture', icon: Building2 },
  { slug: 'scenographie', label: 'Scénographie', icon: Frame },
  { slug: 'communication', label: 'Communication', icon: Megaphone },
];

const COLOR_OPTIONS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#EF4444', '#6366F1', '#14B8A6',
];

interface TenderTypeEditorProps {
  type: TenderTypeConfig | null;
  disciplineSlug: DisciplineSlug;
  onSave: (data: CreateTenderTypeInput) => void;
  onCancel: () => void;
  isNew?: boolean;
}

function TenderTypeEditor({ type, disciplineSlug, onSave, onCancel, isNew = false }: TenderTypeEditorProps) {
  const [formData, setFormData] = useState<CreateTenderTypeInput>({
    discipline_slug: disciplineSlug,
    type_key: type?.type_key || '',
    label: type?.label || '',
    description: type?.description || '',
    icon: type?.icon || 'FileText',
    color: type?.color || '#3B82F6',
    is_active: type?.is_active ?? true,
    is_default: type?.is_default ?? false,
    specific_fields: type?.specific_fields || [],
    required_documents: type?.required_documents || { candidature: [], offre: [] },
    default_criteria: type?.default_criteria || [],
    ai_prompts: type?.ai_prompts || { dce_analysis: '', memoire_generation: '' },
    particularities: type?.particularities || {},
  });

  const [newField, setNewField] = useState<Partial<TenderTypeField>>({
    key: '',
    label: '',
    type: 'text',
    section: 'project',
  });

  const handleSave = () => {
    if (!formData.type_key || !formData.label) return;
    onSave(formData);
  };

  const addField = () => {
    if (!newField.key || !newField.label) return;
    setFormData(prev => ({
      ...prev,
      specific_fields: [
        ...(prev.specific_fields || []),
        newField as TenderTypeField,
      ],
    }));
    setNewField({ key: '', label: '', type: 'text', section: 'project' });
  };

  const removeField = (key: string) => {
    setFormData(prev => ({
      ...prev,
      specific_fields: prev.specific_fields?.filter(f => f.key !== key) || [],
    }));
  };

  return (
    <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isNew ? <Plus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
          {isNew ? 'Nouveau type d\'appel d\'offres' : `Modifier "${type?.label}"`}
        </DialogTitle>
        <DialogDescription>
          Configurez les champs, documents et prompts IA pour ce type d'AO
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="flex-1 pr-4">
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="fields">Champs</TabsTrigger>
            <TabsTrigger value="criteria">Critères</TabsTrigger>
            <TabsTrigger value="ai">Prompts IA</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clé unique</Label>
                <Input
                  value={formData.type_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, type_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                  placeholder="moe, concours, accord_cadre..."
                  disabled={!isNew}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom affiché</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Maîtrise d'œuvre"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description courte du type d'AO..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icône</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, icon: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ICONS).map(iconName => {
                      const Icon = ICONS[iconName];
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform",
                        formData.color === color && "ring-2 ring-offset-2 ring-primary scale-110"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Actif</p>
                <p className="text-sm text-muted-foreground">Afficher ce type dans le sélecteur</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Par défaut</p>
                <p className="text-sm text-muted-foreground">Sélectionné par défaut lors de la création</p>
              </div>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
              />
            </div>
          </TabsContent>

          <TabsContent value="fields" className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Champs spécifiques</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Ces champs apparaîtront dans le formulaire de création pour ce type d'AO
              </p>

              <div className="space-y-2 mb-4">
                {formData.specific_fields?.map((field) => (
                  <div
                    key={field.key}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                    <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                      <span className="font-medium">{field.label}</span>
                      <span className="text-muted-foreground">{field.key}</span>
                      <Badge variant="secondary">{field.type}</Badge>
                      <span className="text-muted-foreground">{field.section}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={() => removeField(field.key)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-3 border border-dashed rounded-lg">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Clé"
                  value={newField.key || ''}
                  onChange={(e) => setNewField(prev => ({ ...prev, key: e.target.value }))}
                  className="h-9 w-28"
                />
                <Input
                  placeholder="Label"
                  value={newField.label || ''}
                  onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                  className="h-9 flex-1"
                />
                <Select
                  value={newField.type}
                  onValueChange={(v) => setNewField(prev => ({ ...prev, type: v as TenderTypeField['type'] }))}
                >
                  <SelectTrigger className="h-9 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texte</SelectItem>
                    <SelectItem value="number">Nombre</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Liste</SelectItem>
                    <SelectItem value="textarea">Zone texte</SelectItem>
                    <SelectItem value="checkbox">Case à cocher</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newField.section}
                  onValueChange={(v) => setNewField(prev => ({ ...prev, section: v as TenderTypeField['section'] }))}
                >
                  <SelectTrigger className="h-9 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="project">Projet</SelectItem>
                    <SelectItem value="financial">Financier</SelectItem>
                    <SelectItem value="procedure">Procédure</SelectItem>
                    <SelectItem value="dates">Dates</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={addField} disabled={!newField.key || !newField.label}>
                  Ajouter
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="criteria" className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Critères par défaut</h4>
              <p className="text-sm text-muted-foreground">
                Ces critères seront proposés automatiquement pour ce type d'AO
              </p>
            </div>

            <div className="space-y-2">
              {formData.default_criteria?.map((criterion, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <Input
                    value={criterion.label}
                    onChange={(e) => {
                      const updated = [...(formData.default_criteria || [])];
                      updated[idx] = { ...updated[idx], label: e.target.value };
                      setFormData(prev => ({ ...prev, default_criteria: updated }));
                    }}
                    className="h-9 flex-1"
                  />
                  <Input
                    type="number"
                    value={criterion.default_weight}
                    onChange={(e) => {
                      const updated = [...(formData.default_criteria || [])];
                      updated[idx] = { ...updated[idx], default_weight: parseInt(e.target.value) || 0 };
                      setFormData(prev => ({ ...prev, default_criteria: updated }));
                    }}
                    className="h-9 w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        default_criteria: prev.default_criteria?.filter((_, i) => i !== idx),
                      }));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    default_criteria: [
                      ...(prev.default_criteria || []),
                      { type: 'custom', label: 'Nouveau critère', default_weight: 20 },
                    ],
                  }));
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un critère
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Prompts IA personnalisés
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Ces prompts permettent d'entraîner l'IA pour une lecture optimale de ce type d'AO
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Analyse DCE</Label>
                <Textarea
                  value={formData.ai_prompts?.dce_analysis || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ai_prompts: { ...prev.ai_prompts!, dce_analysis: e.target.value },
                  }))}
                  placeholder="Instructions pour l'analyse des documents DCE..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Ce prompt guide l'IA lors de l'analyse des documents DCE pour extraire les informations pertinentes
                </p>
              </div>

              <div className="space-y-2">
                <Label>Génération de mémoire</Label>
                <Textarea
                  value={formData.ai_prompts?.memoire_generation || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ai_prompts: { ...prev.ai_prompts!, memoire_generation: e.target.value },
                  }))}
                  placeholder="Instructions pour la génération de mémoires techniques..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Ce prompt guide l'IA lors de la rédaction du mémoire technique
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ScrollArea>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={handleSave} disabled={!formData.type_key || !formData.label}>
          {isNew ? 'Créer' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function TenderTypesSection() {
  const { activeDisciplines, activeDisciplineConfigs: workspaceDisciplines } = useWorkspaceDisciplines();
  const [activeDiscipline, setActiveDiscipline] = useState<DisciplineSlug>(activeDisciplines[0] || 'architecture');
  const { configs, isLoading, createConfig, updateConfig, deleteConfig, initializeDefaults } = useTenderTypeConfigs();
  
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingType, setEditingType] = useState<TenderTypeConfig | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Ensure activeDiscipline is in activeDisciplines
  const effectiveDiscipline = activeDisciplines.includes(activeDiscipline) 
    ? activeDiscipline 
    : activeDisciplines[0] || 'architecture';

  const disciplineConfigs = configs.filter(c => c.discipline_slug === effectiveDiscipline);
  const hasConfigs = disciplineConfigs.length > 0;

  const handleEdit = (type: TenderTypeConfig) => {
    setEditingType(type);
    setIsNew(false);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingType(null);
    setIsNew(true);
    setEditorOpen(true);
  };

  const handleSave = async (data: CreateTenderTypeInput) => {
    if (isNew) {
      await createConfig.mutateAsync(data);
    } else if (editingType) {
      await updateConfig.mutateAsync({ id: editingType.id, ...data });
    }
    setEditorOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce type d\'AO ?')) {
      await deleteConfig.mutateAsync(id);
    }
  };

  const handleInitialize = async () => {
    await initializeDefaults.mutateAsync(effectiveDiscipline);
  };

  const displayTypes = hasConfigs 
    ? disciplineConfigs 
    : DEFAULT_TENDER_TYPES[effectiveDiscipline]?.map((t, idx) => ({
        ...t,
        id: `default-${idx}`,
        workspace_id: '',
      })) || [];

  // Filter disciplines to only show active ones
  const displayedDisciplines = DISCIPLINES.filter(d => activeDisciplines.includes(d.slug));

  return (
    <div className="space-y-6">
      {/* Discipline tabs */}
      {displayedDisciplines.length > 1 && (
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
          {displayedDisciplines.map(d => {
            const Icon = d.icon;
            return (
              <button
                key={d.slug}
                onClick={() => setActiveDiscipline(d.slug)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  effectiveDiscipline === d.slug
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {d.label}
              </button>
            );
          })}
        </div>
      )}

      {displayedDisciplines.length === 1 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {(() => {
            const Icon = displayedDisciplines[0].icon;
            return <Icon className="h-4 w-4" />;
          })()}
          <span>Configuration pour <strong>{displayedDisciplines[0].label}</strong></span>
        </div>
      )}

      {/* Types list */}
      <div className="space-y-3">
        {!hasConfigs && (
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-dashed">
            <div>
              <p className="font-medium">Types par défaut</p>
              <p className="text-sm text-muted-foreground">
                Initialisez les types pour personnaliser les champs et prompts IA
              </p>
            </div>
            <Button onClick={handleInitialize} disabled={initializeDefaults.isPending}>
              <Sparkles className="h-4 w-4 mr-2" />
              Initialiser
            </Button>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {displayTypes.map((type, idx) => {
            const Icon = ICONS[type.icon] || FileText;
            const isDefault = type.id.startsWith('default-');

            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  if (isDefault) {
                    // For default types, initialize first then edit
                    handleInitialize();
                  } else {
                    handleEdit(type as TenderTypeConfig);
                  }
                }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer group",
                  type.is_active ? "bg-card hover:bg-accent/50" : "bg-muted/30 opacity-60 hover:opacity-80"
                )}
              >
                <div
                  className="p-2 rounded-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${type.color}20` }}
                >
                  <Icon className="h-5 w-5" style={{ color: type.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{type.label}</span>
                    {type.is_default && (
                      <Badge variant="secondary" className="text-xs">Par défaut</Badge>
                    )}
                    {!type.is_active && (
                      <Badge variant="outline" className="text-xs">Désactivé</Badge>
                    )}
                    {isDefault && (
                      <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                        Non personnalisé
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {type.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {type.specific_fields?.length || 0} champs
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {type.default_criteria?.length || 0} critères
                  </Badge>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDefault) {
                        handleInitialize();
                      } else {
                        handleEdit(type as TenderTypeConfig);
                      }
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {!isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(type.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {hasConfigs && (
          <Button variant="outline" className="w-full" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un type d'AO
          </Button>
        )}
      </div>

      {/* Editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        {editorOpen && (
          <TenderTypeEditor
            type={editingType}
            disciplineSlug={activeDiscipline}
            onSave={handleSave}
            onCancel={() => setEditorOpen(false)}
            isNew={isNew}
          />
        )}
      </Dialog>
    </div>
  );
}
