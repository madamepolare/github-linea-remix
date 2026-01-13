import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Plus, Trash2, Edit, Download, GripVertical, Building2, Sofa, Theater, 
  Megaphone, Palette, Globe, FileText, Percent, List, Package, Calendar, 
  FileCheck, Sparkles, Loader2, LayoutTemplate, Settings2, Building, Video, 
  Scale, ChevronDown, ChevronRight, Filter
} from 'lucide-react';
import { useContractTypes, ContractType, CreateContractTypeInput, ContractTypeFields, BuilderTab, DEFAULT_MOE_CONFIG, DEFAULT_COMMUNICATION_CONFIG } from '@/hooks/useContractTypes';
import { ContractMOEConfig, MOEConfigData } from './ContractMOEConfig';
import { ContractClausesEditor } from './ContractClausesEditor';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useWorkspaceDiscipline } from '@/hooks/useDiscipline';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { PDFBlocksConfigurator } from './PDFBlocksConfigurator';
import { type PDFDocumentConfig } from '@/lib/pdfBlockTypes';
import { isArchitectureContractType } from '@/lib/moeContractDefaults';
import { isCommunicationContractType } from '@/lib/communicationContractDefaults';

// ============= Constants =============

const TAB_OPTIONS: { key: BuilderTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'general', label: 'Général', icon: FileText },
  { key: 'fees', label: 'Honoraires', icon: Percent },
  { key: 'lines', label: 'Lignes', icon: List },
  { key: 'production', label: 'Production', icon: Package },
  { key: 'planning', label: 'Planning', icon: Calendar },
  { key: 'terms', label: 'Conditions', icon: FileCheck },
];

const ICON_OPTIONS = [
  { value: 'FileText', label: 'Document', icon: FileText },
  { value: 'Building2', label: 'Bâtiment', icon: Building2 },
  { value: 'Building', label: 'MOE', icon: Building },
  { value: 'Sofa', label: 'Intérieur', icon: Sofa },
  { value: 'Theater', label: 'Scène', icon: Theater },
  { value: 'Megaphone', label: 'Publicité', icon: Megaphone },
  { value: 'Palette', label: 'Design', icon: Palette },
  { value: 'Globe', label: 'Web', icon: Globe },
  { value: 'Video', label: 'Vidéo', icon: Video },
  { value: 'Calendar', label: 'Événement', icon: Calendar },
];

// Contract types mapping to disciplines
const DISCIPLINE_MAPPING: Record<string, { name: string; icon: React.ComponentType<{ className?: string }>; color: string; codes: string[] }> = {
  architecture: {
    name: 'Architecture / MOE',
    icon: Building2,
    color: '#3B82F6',
    codes: ['MOE', 'ARCHI', 'INTERIOR', 'SCENO']
  },
  communication: {
    name: 'Communication',
    icon: Megaphone,
    color: '#EC4899',
    codes: ['CAMP360', 'BRAND', 'DIGITAL', 'EVENT', 'VIDEO', 'ACCORD', 'PUB', 'COM']
  },
  scenographie: {
    name: 'Scénographie',
    icon: Theater,
    color: '#8B5CF6',
    codes: ['SCENO', 'EXPO', 'MUSEUM']
  },
  other: {
    name: 'Autres',
    icon: FileText,
    color: '#6B7280',
    codes: []
  }
};

// Contract types that support MOE configuration
const MOE_CONTRACT_CODES = ['MOE', 'ARCHI', 'INTERIOR'];
const COMMUNICATION_CONTRACT_CODES = ['CAMP360', 'BRAND', 'DIGITAL', 'EVENT', 'VIDEO', 'ACCORD', 'PUB', 'COM'];

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

// ============= Helpers =============

function getIconComponent(iconName: string) {
  const option = ICON_OPTIONS.find(o => o.value === iconName);
  if (option) {
    const IconComponent = option.icon;
    return <IconComponent className="h-4 w-4" />;
  }
  return <FileText className="h-4 w-4" />;
}

function getDisciplineForContract(code: string): string {
  for (const [discipline, config] of Object.entries(DISCIPLINE_MAPPING)) {
    if (config.codes.includes(code)) {
      return discipline;
    }
  }
  return 'other';
}

function groupContractsByDiscipline(contracts: ContractType[]): Record<string, ContractType[]> {
  const groups: Record<string, ContractType[]> = {
    architecture: [],
    communication: [],
    scenographie: [],
    other: []
  };

  contracts.forEach(contract => {
    const discipline = getDisciplineForContract(contract.code);
    if (!groups[discipline]) {
      groups[discipline] = [];
    }
    groups[discipline].push(contract);
  });

  return groups;
}

// ============= Sub-components =============

interface ContractTypeCardProps {
  type: ContractType;
  onEdit: (type: ContractType) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function ContractTypeCard({ type, onEdit, onDelete, isDeleting }: ContractTypeCardProps) {
  return (
    <div 
      className={`flex items-center justify-between gap-4 p-3 rounded-lg border bg-card transition-opacity ${!type.is_active ? 'opacity-50' : ''}`}
    >
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
          onClick={() => onEdit(type)}
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
                onClick={() => onDelete(type.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

interface DisciplineGroupProps {
  discipline: string;
  config: typeof DISCIPLINE_MAPPING.architecture;
  contracts: ContractType[];
  onEdit: (type: ContractType) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  defaultOpen?: boolean;
}

function DisciplineGroup({ discipline, config, contracts, onEdit, onDelete, isDeleting, defaultOpen = true }: DisciplineGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Icon = config.icon;
  
  if (contracts.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger className="flex items-center gap-3 w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <div 
          className="p-1.5 rounded"
          style={{ backgroundColor: `${config.color}20`, color: config.color }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="font-medium">{config.name}</span>
        <Badge variant="secondary" className="ml-auto">{contracts.length}</Badge>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pl-4">
        {contracts.map(type => (
          <ContractTypeCard
            key={type.id}
            type={type}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============= Main Component =============

export function ContractTypesSettings() {
  const { contractTypes, isLoading, createContractType, updateContractType, deleteContractType, initializeDefaults } = useContractTypes();
  const { isGenerating, generateContractTypes } = useAIGeneration();
  const { data: currentDiscipline } = useWorkspaceDiscipline();
  
  const [editingType, setEditingType] = useState<ContractType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [newType, setNewType] = useState<Partial<CreateContractTypeInput>>({
    name: '',
    code: '',
    description: '',
    icon: 'FileText',
    color: '#3B82F6',
    default_fields: {},
    is_default: false,
    builder_tabs: ['general', 'lines', 'terms']
  });

  // Group contracts by discipline
  const groupedContracts = useMemo(() => groupContractsByDiscipline(contractTypes), [contractTypes]);

  // Filter contracts based on selected discipline
  const filteredGroups = useMemo(() => {
    if (disciplineFilter === 'all') {
      return groupedContracts;
    }
    return { [disciplineFilter]: groupedContracts[disciplineFilter] || [] };
  }, [groupedContracts, disciplineFilter]);

  const handleGenerateWithAI = async () => {
    if (!currentDiscipline) {
      toast.error('Veuillez d\'abord sélectionner une discipline dans les paramètres');
      return;
    }

    try {
      const generatedTypes = await generateContractTypes(
        currentDiscipline.name,
        currentDiscipline.description || undefined
      );

      for (let i = 0; i < generatedTypes.length; i++) {
        const type = generatedTypes[i];
        await createContractType.mutateAsync({
          name: type.name,
          code: type.code,
          description: type.description,
          icon: type.icon,
          color: type.color,
          default_fields: type.default_fields as ContractTypeFields,
          builder_tabs: type.builder_tabs as BuilderTab[],
          sort_order: contractTypes.length + i,
          is_default: i === 0,
        });
      }

      toast.success(`${generatedTypes.length} types de contrat générés avec succès`);
    } catch (error) {
      console.error('Error generating contract types:', error);
    }
  };

  const toggleBuilderTab = (tabs: BuilderTab[], tab: BuilderTab): BuilderTab[] => {
    if (tabs.includes(tab)) {
      if (tab === 'general') return tabs;
      return tabs.filter(t => t !== tab);
    }
    return [...tabs, tab];
  };

  const handleCreate = async () => {
    if (!newType.name || !newType.code) return;
    
    // Determine default clauses based on discipline
    let defaultClauses = {};
    if (MOE_CONTRACT_CODES.includes(newType.code?.toUpperCase() || '')) {
      defaultClauses = DEFAULT_MOE_CONFIG;
    } else if (COMMUNICATION_CONTRACT_CODES.includes(newType.code?.toUpperCase() || '')) {
      defaultClauses = DEFAULT_COMMUNICATION_CONFIG;
    }
    
    await createContractType.mutateAsync({
      name: newType.name,
      code: newType.code.toUpperCase(),
      description: newType.description,
      icon: newType.icon,
      color: newType.color,
      default_fields: newType.default_fields,
      default_clauses: defaultClauses,
      builder_tabs: newType.builder_tabs,
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
      is_default: false,
      builder_tabs: ['general', 'lines', 'terms']
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
      default_clauses: editingType.default_clauses,
      builder_tabs: editingType.builder_tabs,
      pdf_config: editingType.pdf_config as any,
      is_default: editingType.is_default,
      is_active: editingType.is_active
    });
    
    setEditingType(null);
  };

  const handlePDFConfigSave = (pdfConfig: PDFDocumentConfig) => {
    if (!editingType) return;
    setEditingType({ ...editingType, pdf_config: pdfConfig });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="font-medium">Types de contrats</h4>
          <p className="text-sm text-muted-foreground">
            Définissez les typologies de contrats et devis pour votre activité
          </p>
        </div>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => initializeDefaults.mutate()}
            disabled={initializeDefaults.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Charger par défaut
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau type
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
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
                <div className="space-y-2">
                  <Label>Onglets du builder</Label>
                  <div className="flex flex-wrap gap-2">
                    {TAB_OPTIONS.map(tab => {
                      const Icon = tab.icon;
                      const isActive = newType.builder_tabs?.includes(tab.key);
                      const isGeneral = tab.key === 'general';
                      return (
                        <Badge
                          key={tab.key}
                          variant={isActive ? 'default' : 'outline'}
                          className={`cursor-pointer gap-1 ${isGeneral ? 'opacity-70' : ''}`}
                          onClick={() => !isGeneral && setNewType({
                            ...newType,
                            builder_tabs: toggleBuilderTab(newType.builder_tabs || ['general', 'lines', 'terms'], tab.key)
                          })}
                        >
                          <Icon className="h-3 w-3" />
                          {tab.label}
                        </Badge>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">L'onglet "Général" est obligatoire</p>
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

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par discipline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les disciplines</SelectItem>
            <SelectItem value="architecture">Architecture / MOE</SelectItem>
            <SelectItem value="communication">Communication</SelectItem>
            <SelectItem value="scenographie">Scénographie</SelectItem>
            <SelectItem value="other">Autres</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {contractTypes.length} type{contractTypes.length > 1 ? 's' : ''} de contrat
        </span>
      </div>

      {/* Contract Types List */}
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
        <div className="space-y-4">
          {Object.entries(filteredGroups).map(([discipline, contracts]) => (
            <DisciplineGroup
              key={discipline}
              discipline={discipline}
              config={DISCIPLINE_MAPPING[discipline] || DISCIPLINE_MAPPING.other}
              contracts={contracts}
              onEdit={setEditingType}
              onDelete={(id) => deleteContractType.mutate(id)}
              isDeleting={deleteContractType.isPending}
              defaultOpen={disciplineFilter === 'all' || disciplineFilter === discipline}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingType && (
        <Dialog open onOpenChange={() => setEditingType(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div 
                  className="p-1.5 rounded"
                  style={{ backgroundColor: `${editingType.color}20`, color: editingType.color }}
                >
                  {getIconComponent(editingType.icon || 'FileText')}
                </div>
                {editingType.name}
                <Badge variant="outline">{editingType.code}</Badge>
              </DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Paramètres
                </TabsTrigger>
                <TabsTrigger value="clauses" className="gap-2">
                  <Scale className="h-4 w-4" />
                  Clauses
                </TabsTrigger>
                {MOE_CONTRACT_CODES.includes(editingType.code) && (
                  <TabsTrigger value="moe" className="gap-2">
                    <Building className="h-4 w-4" />
                    Config MOE
                  </TabsTrigger>
                )}
                <TabsTrigger value="pdf" className="gap-2">
                  <LayoutTemplate className="h-4 w-4" />
                  Blocs PDF
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 mt-4">
                <TabsContent value="general" className="space-y-4 pr-4">
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
                  <div className="space-y-2">
                    <Label>Onglets du builder</Label>
                    <div className="flex flex-wrap gap-2">
                      {TAB_OPTIONS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = editingType.builder_tabs?.includes(tab.key);
                        const isGeneral = tab.key === 'general';
                        return (
                          <Badge
                            key={tab.key}
                            variant={isActive ? 'default' : 'outline'}
                            className={`cursor-pointer gap-1 ${isGeneral ? 'opacity-70' : ''}`}
                            onClick={() => !isGeneral && setEditingType({
                              ...editingType,
                              builder_tabs: toggleBuilderTab(editingType.builder_tabs || ['general', 'lines', 'terms'], tab.key)
                            })}
                          >
                            <Icon className="h-3 w-3" />
                            {tab.label}
                          </Badge>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">L'onglet "Général" est obligatoire</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
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
                </TabsContent>
                
                <TabsContent value="clauses" className="pr-4">
                  <ContractClausesEditor
                    contractCode={editingType.code}
                    defaultClauses={editingType.default_clauses as Record<string, unknown>}
                    onChange={(clauses) => setEditingType({ 
                      ...editingType, 
                      default_clauses: clauses as unknown as Record<string, unknown>
                    })}
                  />
                </TabsContent>
                
                {MOE_CONTRACT_CODES.includes(editingType.code) && (
                  <TabsContent value="moe" className="pr-4">
                    <ContractMOEConfig
                      config={(editingType.default_clauses as unknown as MOEConfigData) || DEFAULT_MOE_CONFIG}
                      onChange={(moeConfig) => setEditingType({ 
                        ...editingType, 
                        default_clauses: moeConfig as unknown as Record<string, unknown>
                      })}
                    />
                  </TabsContent>
                )}
                
                <TabsContent value="pdf" className="pr-4">
                  <PDFBlocksConfigurator
                    contractType={editingType}
                    onSave={handlePDFConfigSave}
                    isLoading={updateContractType.isPending}
                  />
                </TabsContent>
              </ScrollArea>
            </Tabs>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditingType(null)}>
                Annuler
              </Button>
              <Button onClick={handleUpdate} disabled={updateContractType.isPending}>
                {updateContractType.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
