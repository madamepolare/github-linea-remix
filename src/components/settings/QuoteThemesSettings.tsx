import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Palette,
  Type,
  Layout,
  Table,
  FileText,
  Trash2,
  Star,
  Sparkles,
  Upload,
  Image,
  Wand2,
  Check,
  Loader2,
  Eye,
  Code2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuoteThemes, QuoteTheme, QuoteThemeInput } from '@/hooks/useQuoteThemes';
import { supabase } from '@/integrations/supabase/client';
import { QuoteHtmlEditor } from './quote-themes/QuoteHtmlEditor';

const DEFAULT_THEME: QuoteThemeInput = {
  name: 'Nouveau thème',
  description: '',
  primary_color: '#0a0a0a',
  secondary_color: '#737373',
  accent_color: '#7c3aed',
  background_color: '#ffffff',
  header_bg_color: '',
  heading_font: 'Inter',
  body_font: 'Inter',
  heading_size: '24px',
  body_size: '11px',
  header_style: 'classic',
  show_logo: true,
  logo_position: 'left',
  logo_size: 'medium',
  table_header_bg: '#f5f5f5',
  table_border_style: 'solid',
  table_stripe_rows: false,
  footer_style: 'simple',
  show_signature_area: true,
  is_default: false,
  is_ai_generated: false,
};

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Poppins',
  'Nunito',
  'Playfair Display',
  'Source Sans 3',
  'DM Sans',
  'Space Grotesk',
  'Montserrat',
  'Lato',
];

const HEADER_STYLES = [
  { value: 'classic', label: 'Classique', description: 'Logo à gauche, infos à droite' },
  { value: 'modern', label: 'Moderne', description: 'Bande colorée avec logo centré' },
  { value: 'minimal', label: 'Minimaliste', description: 'Logo discret, espaces généreux' },
  { value: 'centered', label: 'Centré', description: 'Tout centré, symétrique' },
];

export function QuoteThemesSettings() {
  const { themes, isLoading, createTheme, updateTheme, deleteTheme, setDefaultTheme } = useQuoteThemes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Partial<QuoteTheme> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [htmlEditorOpen, setHtmlEditorOpen] = useState(false);
  const [customHtml, setCustomHtml] = useState('');
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});
  const [fontsUsed, setFontsUsed] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editingTheme?.id;

  const handleCreateNew = () => {
    setEditingTheme({ ...DEFAULT_THEME });
    setReferenceImage(null);
    setCustomHtml('');
    setCssVariables({});
    setFontsUsed([]);
    setDialogOpen(true);
  };

  const handleEdit = (theme: QuoteTheme) => {
    setEditingTheme(theme);
    setReferenceImage(theme.reference_image_url || null);
    setCustomHtml((theme as any).custom_html_template || '');
    setCssVariables((theme as any).css_variables || {});
    setFontsUsed((theme as any).fonts_used || []);
    setDialogOpen(true);
  };

  const handleOpenHtmlEditor = () => {
    setHtmlEditorOpen(true);
  };

  const handleSaveHtmlTemplate = () => {
    setEditingTheme(prev => prev ? {
      ...prev,
      custom_html_template: customHtml,
      css_variables: cssVariables,
      fonts_used: fontsUsed,
      use_custom_html: !!customHtml,
    } as any : null);
    setHtmlEditorOpen(false);
    toast.success('Template HTML enregistré');
  };

  const handleSave = async () => {
    if (!editingTheme?.name) {
      toast.error('Le nom du thème est requis');
      return;
    }

    try {
      if (isEditing) {
        await updateTheme.mutateAsync({
          id: editingTheme.id!,
          ...editingTheme,
          reference_image_url: referenceImage || undefined,
        } as QuoteTheme);
      } else {
        await createTheme.mutateAsync({
          ...editingTheme,
          reference_image_url: referenceImage || undefined,
        } as QuoteThemeInput);
      }
      setDialogOpen(false);
      setEditingTheme(null);
      setReferenceImage(null);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteTheme.mutateAsync(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerateFromImage = async () => {
    if (!referenceImage) {
      toast.error('Veuillez d\'abord uploader une image de référence');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quote-theme', {
        body: { image_url: referenceImage }
      });

      if (error) throw error;

      if (data?.theme) {
        setEditingTheme(prev => ({
          ...prev,
          ...data.theme,
          is_ai_generated: true,
        }));
        toast.success('Thème généré par l\'IA !');
      }
    } catch (error) {
      console.error('Error generating theme:', error);
      toast.error('Erreur lors de la génération du thème');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateField = <K extends keyof QuoteTheme>(field: K, value: QuoteTheme[K]) => {
    setEditingTheme(prev => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Thèmes de devis
              </CardTitle>
              <CardDescription>
                Créez et gérez des thèmes visuels pour vos devis. Utilisez l'IA pour générer un thème à partir d'une image.
              </CardDescription>
            </div>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau thème
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : themes.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Palette className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">Aucun thème créé</p>
              <Button variant="outline" onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un thème
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {themes.map(theme => (
                  <motion.div
                    key={theme.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        theme.is_default && "ring-2 ring-primary"
                      )}
                      onClick={() => handleEdit(theme)}
                    >
                      <CardContent className="p-4">
                        {/* Color preview */}
                        <div className="flex gap-1.5 mb-3">
                          <div 
                            className="w-8 h-8 rounded-full border"
                            style={{ backgroundColor: theme.primary_color }}
                          />
                          <div 
                            className="w-8 h-8 rounded-full border"
                            style={{ backgroundColor: theme.secondary_color }}
                          />
                          <div 
                            className="w-8 h-8 rounded-full border"
                            style={{ backgroundColor: theme.accent_color }}
                          />
                          <div 
                            className="w-8 h-8 rounded-full border"
                            style={{ backgroundColor: theme.background_color }}
                          />
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium">{theme.name}</h3>
                            {theme.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {theme.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {theme.is_default && (
                              <Badge variant="default" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Défaut
                              </Badge>
                            )}
                            {theme.is_ai_generated && (
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                IA
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {HEADER_STYLES.find(s => s.value === theme.header_style)?.label || theme.header_style}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {theme.heading_font} / {theme.body_font}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Modifier le thème' : 'Créer un thème'}
            </DialogTitle>
            <DialogDescription>
              Personnalisez l'apparence de vos devis ou laissez l'IA générer un thème à partir d'une image.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 pr-4">
                {/* Name and description */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du thème</Label>
                    <Input
                      value={editingTheme?.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Mon thème personnalisé"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={editingTheme?.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Description optionnelle..."
                    />
                  </div>
                </div>

                {/* AI Generation */}
                <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          Génération IA
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Uploadez une image de mise en page de devis et l'IA génèrera un thème correspondant.
                        </p>

                        <div className="flex items-center gap-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Uploader une image
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleGenerateFromImage}
                            disabled={!referenceImage || isGenerating}
                          >
                            {isGenerating ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Wand2 className="h-4 w-4 mr-2" />
                            )}
                            Générer le thème
                          </Button>
                        </div>
                      </div>

                      {referenceImage && (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-white">
                          <img
                            src={referenceImage}
                            alt="Reference"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={() => setReferenceImage(null)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* HTML Editor Button */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center gap-2 mb-2">
                          <Code2 className="h-4 w-4 text-blue-500" />
                          Design HTML personnalisé
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Créez un design 100% personnalisé avec HTML/CSS. Uploadez une image de devis et l'IA génèrera le template exact.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {customHtml && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Template défini
                          </Badge>
                        )}
                        <Button onClick={handleOpenHtmlEditor}>
                          <Code2 className="h-4 w-4 mr-2" />
                          Ouvrir l'éditeur
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="colors" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="colors" className="text-xs">
                      <Palette className="h-4 w-4 mr-1" />
                      Couleurs
                    </TabsTrigger>
                    <TabsTrigger value="typography" className="text-xs">
                      <Type className="h-4 w-4 mr-1" />
                      Typo
                    </TabsTrigger>
                    <TabsTrigger value="layout" className="text-xs">
                      <Layout className="h-4 w-4 mr-1" />
                      Layout
                    </TabsTrigger>
                    <TabsTrigger value="table" className="text-xs">
                      <Table className="h-4 w-4 mr-1" />
                      Tableau
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="colors" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Couleur principale</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editingTheme?.primary_color || '#0a0a0a'}
                            onChange={(e) => updateField('primary_color', e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editingTheme?.primary_color || ''}
                            onChange={(e) => updateField('primary_color', e.target.value)}
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Couleur secondaire</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editingTheme?.secondary_color || '#737373'}
                            onChange={(e) => updateField('secondary_color', e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editingTheme?.secondary_color || ''}
                            onChange={(e) => updateField('secondary_color', e.target.value)}
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Couleur d'accent</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editingTheme?.accent_color || '#7c3aed'}
                            onChange={(e) => updateField('accent_color', e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editingTheme?.accent_color || ''}
                            onChange={(e) => updateField('accent_color', e.target.value)}
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Couleur de fond</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editingTheme?.background_color || '#ffffff'}
                            onChange={(e) => updateField('background_color', e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editingTheme?.background_color || ''}
                            onChange={(e) => updateField('background_color', e.target.value)}
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="typography" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Police titres</Label>
                        <Select
                          value={editingTheme?.heading_font || 'Inter'}
                          onValueChange={(v) => updateField('heading_font', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map(font => (
                              <SelectItem key={font} value={font}>{font}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Police texte</Label>
                        <Select
                          value={editingTheme?.body_font || 'Inter'}
                          onValueChange={(v) => updateField('body_font', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS.map(font => (
                              <SelectItem key={font} value={font}>{font}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Taille titres</Label>
                        <Input
                          value={editingTheme?.heading_size || '24px'}
                          onChange={(e) => updateField('heading_size', e.target.value)}
                          placeholder="24px"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Taille texte</Label>
                        <Input
                          value={editingTheme?.body_size || '11px'}
                          onChange={(e) => updateField('body_size', e.target.value)}
                          placeholder="11px"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="layout" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Style d'en-tête</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {HEADER_STYLES.map(style => (
                            <div
                              key={style.value}
                              className={cn(
                                "p-3 rounded-lg border-2 cursor-pointer transition-all",
                                editingTheme?.header_style === style.value
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-muted-foreground/50"
                              )}
                              onClick={() => updateField('header_style', style.value as any)}
                            >
                              <p className="font-medium text-sm">{style.label}</p>
                              <p className="text-xs text-muted-foreground">{style.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Position logo</Label>
                          <Select
                            value={editingTheme?.logo_position || 'left'}
                            onValueChange={(v) => updateField('logo_position', v as any)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Gauche</SelectItem>
                              <SelectItem value="center">Centre</SelectItem>
                              <SelectItem value="right">Droite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Taille logo</Label>
                          <Select
                            value={editingTheme?.logo_size || 'medium'}
                            onValueChange={(v) => updateField('logo_size', v as any)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Petit</SelectItem>
                              <SelectItem value="medium">Moyen</SelectItem>
                              <SelectItem value="large">Grand</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Style pied de page</Label>
                          <Select
                            value={editingTheme?.footer_style || 'simple'}
                            onValueChange={(v) => updateField('footer_style', v as any)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="simple">Simple</SelectItem>
                              <SelectItem value="detailed">Détaillé</SelectItem>
                              <SelectItem value="minimal">Minimal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Afficher le logo</Label>
                          <p className="text-xs text-muted-foreground">Afficher le logo de l'agence</p>
                        </div>
                        <Switch
                          checked={editingTheme?.show_logo ?? true}
                          onCheckedChange={(v) => updateField('show_logo', v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Zone de signature</Label>
                          <p className="text-xs text-muted-foreground">Afficher la zone de signature client</p>
                        </div>
                        <Switch
                          checked={editingTheme?.show_signature_area ?? true}
                          onCheckedChange={(v) => updateField('show_signature_area', v)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="table" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fond en-tête tableau</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={editingTheme?.table_header_bg || '#f5f5f5'}
                            onChange={(e) => updateField('table_header_bg', e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={editingTheme?.table_header_bg || ''}
                            onChange={(e) => updateField('table_header_bg', e.target.value)}
                            className="flex-1 font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Style bordures</Label>
                        <Select
                          value={editingTheme?.table_border_style || 'solid'}
                          onValueChange={(v) => updateField('table_border_style', v as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Trait plein</SelectItem>
                            <SelectItem value="dashed">Pointillés</SelectItem>
                            <SelectItem value="none">Aucune</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Lignes alternées</Label>
                        <p className="text-xs text-muted-foreground">Alterner la couleur des lignes du tableau</p>
                      </div>
                      <Switch
                        checked={editingTheme?.table_stripe_rows ?? false}
                        onCheckedChange={(v) => updateField('table_stripe_rows', v)}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>

          <Separator />

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setDefaultTheme.mutateAsync(editingTheme.id!)}
                    disabled={editingTheme.is_default}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Définir par défaut
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDialogOpen(false);
                      setDeleteConfirmId(editingTheme.id!);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={createTheme.isPending || updateTheme.isPending}>
                {(createTheme.isPending || updateTheme.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Check className="h-4 w-4 mr-2" />
                {isEditing ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce thème ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le thème sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* HTML Editor Dialog */}
      <QuoteHtmlEditor
        open={htmlEditorOpen}
        onOpenChange={setHtmlEditorOpen}
        htmlTemplate={customHtml}
        onHtmlChange={setCustomHtml}
        cssVariables={cssVariables}
        onCssVariablesChange={setCssVariables}
        fontsUsed={fontsUsed}
        onFontsChange={setFontsUsed}
        onSave={handleSaveHtmlTemplate}
        isSaving={false}
      />
    </div>
  );
}
