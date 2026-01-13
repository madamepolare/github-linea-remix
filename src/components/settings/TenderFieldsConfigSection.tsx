import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Building2,
  MapPin,
  Euro,
  FileCheck,
  Calendar,
  Users,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Asterisk,
  GripVertical,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  ALL_TENDER_FIELDS,
  FIELD_SECTIONS,
  type TenderFieldDefinition,
  type FieldSection,
} from "@/lib/tenderFieldsConfig";
import { useWorkspaceDisciplines } from "@/hooks/useWorkspaceDisciplines";
import { useTenderTypeConfigs } from "@/hooks/useTenderTypeConfigs";
import { type DisciplineSlug } from "@/lib/tenderDisciplineConfig";

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  general: FileText,
  client: Building2,
  project: MapPin,
  financial: Euro,
  procedure: FileCheck,
  dates: Calendar,
  site_visit: MapPin,
  groupement: Users,
};

const FIELD_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date et heure' },
  { value: 'select', label: 'Liste déroulante' },
  { value: 'textarea', label: 'Zone de texte' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'tags', label: 'Tags' },
];

interface FieldConfigState {
  visible: boolean;
  required: boolean;
  customLabel?: string;
  customUnit?: string;
}

interface CustomField extends TenderFieldDefinition {
  isCustom: true;
}

interface FieldEditorProps {
  field: TenderFieldDefinition | null;
  isNew: boolean;
  onSave: (field: TenderFieldDefinition) => void;
  onCancel: () => void;
  activeDisciplines: DisciplineSlug[];
}

function FieldEditor({ field, isNew, onSave, onCancel, activeDisciplines }: FieldEditorProps) {
  const [formData, setFormData] = useState<Partial<TenderFieldDefinition>>({
    key: field?.key || '',
    dbColumn: field?.dbColumn || '',
    label: field?.label || '',
    type: field?.type || 'text',
    section: field?.section || 'general',
    placeholder: field?.placeholder || '',
    unit: field?.unit || '',
    defaultVisible: field?.defaultVisible ?? true,
    defaultRequired: field?.defaultRequired ?? false,
    disciplines: field?.disciplines || undefined,
  });

  const [selectOptions, setSelectOptions] = useState<string>(
    field?.options?.map(o => `${o.value}:${o.label}`).join('\n') || ''
  );

  const handleSave = () => {
    if (!formData.key || !formData.label) return;

    const options = formData.type === 'select' && selectOptions.trim()
      ? selectOptions.split('\n').filter(Boolean).map(line => {
          const [value, label] = line.split(':');
          return { value: value.trim(), label: (label || value).trim() };
        })
      : undefined;

    onSave({
      key: formData.key!,
      dbColumn: formData.dbColumn || formData.key!,
      label: formData.label!,
      type: formData.type as TenderFieldDefinition['type'],
      section: formData.section as FieldSection,
      placeholder: formData.placeholder || undefined,
      unit: formData.unit || undefined,
      options,
      defaultVisible: formData.defaultVisible,
      defaultRequired: formData.defaultRequired,
      disciplines: formData.disciplines,
    });
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isNew ? <Plus className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
          {isNew ? 'Nouveau champ' : `Modifier "${field?.label}"`}
        </DialogTitle>
        <DialogDescription>
          Configurez les propriétés du champ
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Clé technique</Label>
            <Input
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                dbColumn: prev.dbColumn || e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
              }))}
              placeholder="nom_du_champ"
              disabled={!isNew}
            />
          </div>
          <div className="space-y-2">
            <Label>Libellé affiché</Label>
            <Input
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Nom du champ"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type de champ</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as TenderFieldDefinition['type'] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Section</Label>
            <Select
              value={formData.section}
              onValueChange={(v) => setFormData(prev => ({ ...prev, section: v as FieldSection }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_SECTIONS.map(s => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Placeholder</Label>
            <Input
              value={formData.placeholder || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
              placeholder="Texte d'aide..."
            />
          </div>
          <div className="space-y-2">
            <Label>Unité</Label>
            <Input
              value={formData.unit || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              placeholder="€, m², jours..."
            />
          </div>
        </div>

        {formData.type === 'select' && (
          <div className="space-y-2">
            <Label>Options (valeur:libellé, une par ligne)</Label>
            <textarea
              value={selectOptions}
              onChange={(e) => setSelectOptions(e.target.value)}
              placeholder="option1:Option 1&#10;option2:Option 2"
              className="w-full h-24 px-3 py-2 rounded-md border bg-background text-sm resize-none"
            />
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Visible par défaut</p>
              <p className="text-xs text-muted-foreground">Afficher ce champ dans les formulaires</p>
            </div>
            <Switch
              checked={formData.defaultVisible}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, defaultVisible: checked }))}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Obligatoire par défaut</p>
              <p className="text-xs text-muted-foreground">Rendre ce champ obligatoire</p>
            </div>
            <Switch
              checked={formData.defaultRequired}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                defaultRequired: checked,
                defaultVisible: checked ? true : prev.defaultVisible,
              }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Disciplines (laisser vide pour toutes)</Label>
          <div className="flex gap-2">
            {(['architecture', 'scenographie', 'communication'] as DisciplineSlug[])
              .filter(d => activeDisciplines.includes(d))
              .map(discipline => {
                const isSelected = formData.disciplines?.includes(discipline);
                return (
                  <Badge
                    key={discipline}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setFormData(prev => {
                        const current = prev.disciplines || [];
                        if (isSelected) {
                          const newDisciplines = current.filter(d => d !== discipline);
                          return { ...prev, disciplines: newDisciplines.length > 0 ? newDisciplines : undefined };
                        } else {
                          return { ...prev, disciplines: [...current, discipline] };
                        }
                      });
                    }}
                  >
                    {discipline}
                  </Badge>
                );
              })}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button onClick={handleSave} disabled={!formData.key || !formData.label}>
          <Save className="h-4 w-4 mr-2" />
          {isNew ? 'Créer' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function TenderFieldsConfigSection() {
  const { activeDisciplines } = useWorkspaceDisciplines();
  const { configs } = useTenderTypeConfigs();
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general', 'dates']));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeKey, setSelectedTypeKey] = useState<string | null>(null);
  
  // Custom fields state
  const [customFields, setCustomFields] = useState<TenderFieldDefinition[]>([]);
  
  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<TenderFieldDefinition | null>(null);
  const [isNewField, setIsNewField] = useState(false);
  
  // Field configurations state
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfigState>>(() => {
    const initial: Record<string, FieldConfigState> = {};
    ALL_TENDER_FIELDS.forEach(field => {
      initial[field.key] = {
        visible: field.defaultVisible ?? false,
        required: field.defaultRequired ?? false,
      };
    });
    return initial;
  });

  // All fields (base + custom)
  const allFields = useMemo(() => {
    return [...ALL_TENDER_FIELDS, ...customFields];
  }, [customFields]);

  // Filter fields by search and discipline
  const filteredFields = useMemo(() => {
    let fields = allFields;
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      fields = fields.filter(f => 
        f.label.toLowerCase().includes(query) ||
        f.key.toLowerCase().includes(query) ||
        f.section.toLowerCase().includes(query)
      );
    }
    
    // Filter by active disciplines
    fields = fields.filter(f => 
      !f.disciplines || f.disciplines.some(d => activeDisciplines.includes(d))
    );
    
    return fields;
  }, [searchQuery, activeDisciplines, allFields]);

  // Group fields by section
  const fieldsBySection = useMemo(() => {
    const grouped: Record<string, TenderFieldDefinition[]> = {};
    FIELD_SECTIONS.forEach(section => {
      grouped[section.key] = filteredFields.filter(f => f.section === section.key);
    });
    return grouped;
  }, [filteredFields]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const toggleFieldVisible = (fieldKey: string) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        visible: !prev[fieldKey]?.visible,
        required: !prev[fieldKey]?.visible ? prev[fieldKey]?.required : false,
      },
    }));
  };

  const toggleFieldRequired = (fieldKey: string) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        required: !prev[fieldKey]?.required,
        visible: !prev[fieldKey]?.required ? true : prev[fieldKey]?.visible,
      },
    }));
  };

  const handleEditField = (field: TenderFieldDefinition) => {
    setEditingField(field);
    setIsNewField(false);
    setEditorOpen(true);
  };

  const handleAddField = () => {
    setEditingField(null);
    setIsNewField(true);
    setEditorOpen(true);
  };

  const handleSaveField = (field: TenderFieldDefinition) => {
    if (isNewField) {
      // Add new custom field
      setCustomFields(prev => [...prev, { ...field, isCustom: true } as TenderFieldDefinition]);
      setFieldConfigs(prev => ({
        ...prev,
        [field.key]: {
          visible: field.defaultVisible ?? true,
          required: field.defaultRequired ?? false,
        },
      }));
    } else {
      // Update existing field (only custom fields can be fully edited)
      const isCustom = customFields.some(f => f.key === field.key);
      if (isCustom) {
        setCustomFields(prev => prev.map(f => f.key === field.key ? field : f));
      }
      // Update config for all fields
      setFieldConfigs(prev => ({
        ...prev,
        [field.key]: {
          ...prev[field.key],
          customLabel: field.label !== editingField?.label ? field.label : undefined,
          customUnit: field.unit !== editingField?.unit ? field.unit : undefined,
        },
      }));
    }
    setEditorOpen(false);
  };

  const handleDeleteField = (fieldKey: string) => {
    // Only custom fields can be deleted
    if (customFields.some(f => f.key === fieldKey)) {
      setCustomFields(prev => prev.filter(f => f.key !== fieldKey));
      setFieldConfigs(prev => {
        const { [fieldKey]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const visibleCount = Object.values(fieldConfigs).filter(c => c.visible).length;
  const requiredCount = Object.values(fieldConfigs).filter(c => c.required).length;

  // Get unique tender types from configs
  const tenderTypes = configs.filter(c => activeDisciplines.includes(c.discipline_slug));

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Configuration des champs</h4>
          <p className="text-sm text-muted-foreground">
            Définissez quels champs sont visibles et requis pour chaque type d'AO
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1">
            <Eye className="h-3 w-3" />
            {visibleCount} visibles
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Asterisk className="h-3 w-3" />
            {requiredCount} requis
          </Badge>
          <Button size="sm" onClick={handleAddField}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un champ
          </Button>
        </div>
      </div>

      {/* Filtre par type d'AO */}
      {tenderTypes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtrer par type :</span>
          <Button
            variant={selectedTypeKey === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTypeKey(null)}
          >
            Tous
          </Button>
          {tenderTypes.map(type => (
            <Button
              key={type.id}
              variant={selectedTypeKey === type.type_key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTypeKey(type.type_key)}
              className="gap-1"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: type.color }}
              />
              {type.label}
            </Button>
          ))}
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un champ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste des sections et champs */}
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-2">
          {FIELD_SECTIONS.map(section => {
            const sectionFields = fieldsBySection[section.key] || [];
            if (sectionFields.length === 0) return null;
            
            const Icon = SECTION_ICONS[section.key] || FileText;
            const isExpanded = expandedSections.has(section.key);
            const visibleInSection = sectionFields.filter(f => fieldConfigs[f.key]?.visible).length;

            return (
              <Collapsible
                key={section.key}
                open={isExpanded}
                onOpenChange={() => toggleSection(section.key)}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-3 w-full p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-medium flex-1 text-left">{section.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {visibleInSection}/{sectionFields.length}
                    </Badge>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <AnimatePresence>
                    <div className="pl-6 pt-2 space-y-1">
                      {sectionFields.map((field, idx) => {
                        const config = fieldConfigs[field.key] || { visible: false, required: false };
                        const isCustom = customFields.some(f => f.key === field.key);
                        
                        return (
                          <motion.div
                            key={field.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-colors group",
                              config.visible ? "bg-card hover:bg-accent/30" : "bg-muted/30 opacity-60 hover:opacity-80"
                            )}
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab" />
                            
                            <div 
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => handleEditField(field)}
                            >
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-medium text-sm",
                                  !config.visible && "text-muted-foreground"
                                )}>
                                  {config.customLabel || field.label}
                                </span>
                                {field.unit && (
                                  <Badge variant="outline" className="text-xs">
                                    {config.customUnit || field.unit}
                                  </Badge>
                                )}
                                {isCustom && (
                                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                    Personnalisé
                                  </Badge>
                                )}
                                {field.disciplines && (
                                  <Badge variant="secondary" className="text-xs">
                                    {field.disciplines.join(', ')}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {field.dbColumn} • {field.type}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Edit button */}
                              <button
                                onClick={() => handleEditField(field)}
                                className="p-1.5 rounded-md bg-muted text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Modifier"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>

                              {/* Delete button (custom fields only) */}
                              {isCustom && (
                                <button
                                  onClick={() => handleDeleteField(field.key)}
                                  className="p-1.5 rounded-md bg-muted text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}

                              {/* Visible toggle */}
                              <button
                                onClick={() => toggleFieldVisible(field.key)}
                                className={cn(
                                  "p-1.5 rounded-md transition-colors",
                                  config.visible 
                                    ? "bg-primary/10 text-primary" 
                                    : "bg-muted text-muted-foreground hover:text-foreground"
                                )}
                                title={config.visible ? "Masquer" : "Afficher"}
                              >
                                {config.visible ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </button>

                              {/* Required toggle */}
                              <button
                                onClick={() => toggleFieldRequired(field.key)}
                                disabled={!config.visible}
                                className={cn(
                                  "p-1.5 rounded-md transition-colors",
                                  config.required 
                                    ? "bg-destructive/10 text-destructive" 
                                    : "bg-muted text-muted-foreground hover:text-foreground",
                                  !config.visible && "opacity-50 cursor-not-allowed"
                                )}
                                title={config.required ? "Optionnel" : "Obligatoire"}
                              >
                                <Asterisk className="h-4 w-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </AnimatePresence>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button variant="outline" size="sm">
          Réinitialiser
        </Button>
        <Button size="sm">
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </div>

      {/* Field Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        {editorOpen && (
          <FieldEditor
            field={editingField}
            isNew={isNewField}
            onSave={handleSaveField}
            onCancel={() => setEditorOpen(false)}
            activeDisciplines={activeDisciplines}
          />
        )}
      </Dialog>
    </div>
  );
}
