import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  Building2,
  Briefcase,
  Users,
  Loader2,
  Copy,
  Settings2,
  Palette
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES_BY_CATEGORY,
  type DocumentCategory,
  type DocumentType,
} from '@/lib/documentTypes';
import { AgencySettings } from './AgencySettings';

interface DocumentTemplateConfig {
  id: string;
  document_type: DocumentType;
  name: string;
  description: string;
  header_text: string;
  footer_text: string;
  is_active: boolean;
  default_validity_days: number;
}

// Mock data - in real app would come from database
const mockTemplates: DocumentTemplateConfig[] = [
  {
    id: '1',
    document_type: 'power_of_attorney',
    name: 'Pouvoir standard',
    description: 'Modèle de pouvoir par défaut',
    header_text: '',
    footer_text: 'Document généré automatiquement',
    is_active: true,
    default_validity_days: 365,
  },
  {
    id: '2',
    document_type: 'service_order',
    name: 'Ordre de service standard',
    description: "Modèle d'ODS pour début de phase",
    header_text: '',
    footer_text: '',
    is_active: true,
    default_validity_days: 30,
  },
  {
    id: '3',
    document_type: 'invoice',
    name: "Note d'honoraires standard",
    description: 'Facture avec TVA 20%',
    header_text: '',
    footer_text: "En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.",
    is_active: true,
    default_validity_days: 30,
  },
];

const categoryIcons: Record<DocumentCategory, React.ReactNode> = {
  administrative: <Building2 className="h-4 w-4" />,
  project: <Briefcase className="h-4 w-4" />,
  hr: <Users className="h-4 w-4" />,
  commercial: <FileText className="h-4 w-4" />,
};

export function DocumentsSettings() {
  const [templates, setTemplates] = useState<DocumentTemplateConfig[]>(mockTemplates);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplateConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<DocumentCategory>('administrative');
  const [activeSection, setActiveSection] = useState<'agency' | 'templates' | 'numbering'>('agency');

  // Default settings
  const [defaultSettings, setDefaultSettings] = useState({
    auto_number_documents: true,
    number_prefix: 'DOC',
    number_separator: '-',
    include_year: true,
    default_sender_name: '',
    default_sender_address: '',
    default_sender_email: '',
    default_sender_phone: '',
  });

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    
    setIsSaving(true);
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTemplates(prev => {
        const index = prev.findIndex(t => t.id === editingTemplate.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = editingTemplate;
          return updated;
        }
        return [...prev, { ...editingTemplate, id: Date.now().toString() }];
      });
      
      toast.success('Template sauvegardé');
      setIsDialogOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = (templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, is_active: !t.is_active } : t
    ));
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Template supprimé');
  };

  const handleDuplicateTemplate = (template: DocumentTemplateConfig) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (copie)`,
    };
    setTemplates(prev => [...prev, newTemplate]);
    toast.success('Template dupliqué');
  };

  const openEditDialog = (template?: DocumentTemplateConfig) => {
    if (template) {
      setEditingTemplate({ ...template });
    } else {
      setEditingTemplate({
        id: '',
        document_type: 'power_of_attorney',
        name: '',
        description: '',
        header_text: '',
        footer_text: '',
        is_active: true,
        default_validity_days: 30,
      });
    }
    setIsDialogOpen(true);
  };

  const filteredTypes = DOCUMENT_TYPES_BY_CATEGORY[activeCategory] || [];

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as 'agency' | 'templates' | 'numbering')}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="agency" className="gap-2">
            <Building2 className="h-4 w-4" />
            Agence
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="numbering" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Numérotation
          </TabsTrigger>
        </TabsList>

        {/* Agency Settings Tab */}
        <TabsContent value="agency">
          <AgencySettings />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Templates de documents
                  </CardTitle>
                  <CardDescription>
                    Personnalisez les modèles pour chaque type de document
                  </CardDescription>
                </div>
                <Button onClick={() => openEditDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as DocumentCategory)}>
                <TabsList className="mb-4">
                  {Object.entries(DOCUMENT_CATEGORY_LABELS)
                    .filter(([key]) => key !== 'commercial')
                    .map(([key, label]) => (
                      <TabsTrigger key={key} value={key} className="gap-2">
                        {categoryIcons[key as DocumentCategory]}
                        {label}
                      </TabsTrigger>
                    ))}
                </TabsList>

                {Object.keys(DOCUMENT_CATEGORY_LABELS)
                  .filter(key => key !== 'commercial')
                  .map((category) => (
                    <TabsContent key={category} value={category}>
                      <Accordion type="multiple" className="w-full">
                        {DOCUMENT_TYPES_BY_CATEGORY[category as DocumentCategory].map((docType) => {
                          const typeTemplates = templates.filter(t => t.document_type === docType);
                          return (
                            <AccordionItem key={docType} value={docType}>
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                  <span>{DOCUMENT_TYPE_LABELS[docType]}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {typeTemplates.length} template{typeTemplates.length > 1 ? 's' : ''}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                {typeTemplates.length === 0 ? (
                                  <div className="text-center py-6 text-muted-foreground">
                                    <p>Aucun template configuré</p>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="mt-2"
                                      onClick={() => {
                                        setEditingTemplate({
                                          id: '',
                                          document_type: docType,
                                          name: `Template ${DOCUMENT_TYPE_LABELS[docType]}`,
                                          description: '',
                                          header_text: '',
                                          footer_text: '',
                                          is_active: true,
                                          default_validity_days: 30,
                                        });
                                        setIsDialogOpen(true);
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Créer un template
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {typeTemplates.map((template) => (
                                      <div 
                                        key={template.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Switch
                                            checked={template.is_active}
                                            onCheckedChange={() => handleToggleActive(template.id)}
                                          />
                                          <div>
                                            <p className="font-medium">{template.name}</p>
                                            {template.description && (
                                              <p className="text-sm text-muted-foreground">
                                                {template.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDuplicateTemplate(template)}
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEditDialog(template)}
                                          >
                                            <Edit2 className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteTemplate(template.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </TabsContent>
                  ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Numbering Tab */}
        <TabsContent value="numbering">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Numérotation automatique
              </CardTitle>
              <CardDescription>
                Configuration de la numérotation des documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-number" className="flex-1">
                  Numéroter automatiquement les documents
                </Label>
                <Switch
                  id="auto-number"
                  checked={defaultSettings.auto_number_documents}
                  onCheckedChange={(checked) => 
                    setDefaultSettings(prev => ({ ...prev, auto_number_documents: checked }))
                  }
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Préfixe</Label>
                  <Input
                    id="prefix"
                    value={defaultSettings.number_prefix}
                    onChange={(e) => 
                      setDefaultSettings(prev => ({ ...prev, number_prefix: e.target.value }))
                    }
                    placeholder="DOC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="separator">Séparateur</Label>
                  <Input
                    id="separator"
                    value={defaultSettings.number_separator}
                    onChange={(e) => 
                      setDefaultSettings(prev => ({ ...prev, number_separator: e.target.value }))
                    }
                    placeholder="-"
                    maxLength={3}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="include-year"
                      checked={defaultSettings.include_year}
                      onCheckedChange={(checked) => 
                        setDefaultSettings(prev => ({ ...prev, include_year: checked }))
                      }
                    />
                    <Label htmlFor="include-year">Inclure l'année</Label>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Exemple: {defaultSettings.number_prefix}{defaultSettings.number_separator}
                {defaultSettings.include_year ? '2025' + defaultSettings.number_separator : ''}0001
              </p>

              <div className="flex justify-end">
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.id ? 'Modifier le template' : 'Nouveau template'}
            </DialogTitle>
            <DialogDescription>
              Configurez les paramètres par défaut pour ce type de document
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type de document</Label>
                <Input 
                  value={DOCUMENT_TYPE_LABELS[editingTemplate.document_type]} 
                  disabled 
                />
              </div>

              <div className="space-y-2">
                <Label>Nom du template</Label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => 
                    setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)
                  }
                  placeholder="Nom du template"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingTemplate.description}
                  onChange={(e) => 
                    setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)
                  }
                  placeholder="Description du template"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Texte d'en-tête par défaut</Label>
                <Textarea
                  value={editingTemplate.header_text}
                  onChange={(e) => 
                    setEditingTemplate(prev => prev ? { ...prev, header_text: e.target.value } : null)
                  }
                  placeholder="Texte affiché en haut du document"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Texte de pied de page par défaut</Label>
                <Textarea
                  value={editingTemplate.footer_text}
                  onChange={(e) => 
                    setEditingTemplate(prev => prev ? { ...prev, footer_text: e.target.value } : null)
                  }
                  placeholder="Texte affiché en bas du document"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Durée de validité par défaut (jours)</Label>
                <Input
                  type="number"
                  value={editingTemplate.default_validity_days}
                  onChange={(e) => 
                    setEditingTemplate(prev => prev ? { 
                      ...prev, 
                      default_validity_days: parseInt(e.target.value) || 30 
                    } : null)
                  }
                  min={1}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editingTemplate.is_active}
                  onCheckedChange={(checked) => 
                    setEditingTemplate(prev => prev ? { ...prev, is_active: checked } : null)
                  }
                />
                <Label>Template actif</Label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
