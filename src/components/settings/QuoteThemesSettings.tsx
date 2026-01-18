import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Trash2,
  Star,
  Sparkles,
  Upload,
  Wand2,
  Check,
  Loader2,
  Code2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuoteThemes, QuoteTheme, QuoteThemeInput } from '@/hooks/useQuoteThemes';
import { supabase } from '@/integrations/supabase/client';
import { QuoteHtmlEditor } from './quote-themes/QuoteHtmlEditor';
import { QuoteThemeStylesEditor } from './quote-themes/QuoteThemeStylesEditor';

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

export function QuoteThemesSettings() {
  const { themes, isLoading, createTheme, updateTheme, deleteTheme, setDefaultTheme } = useQuoteThemes();
  const [editingTheme, setEditingTheme] = useState<Partial<QuoteTheme> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [htmlEditorOpen, setHtmlEditorOpen] = useState(false);
  const [customHtml, setCustomHtml] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editingTheme?.id;

  const handleCreateNew = () => {
    setEditingTheme({ ...DEFAULT_THEME });
    setReferenceImage(null);
    setCustomHtml('');
    setHtmlEditorOpen(true); // Open HTML editor directly
  };

  const handleEdit = (theme: QuoteTheme) => {
    setEditingTheme(theme);
    setReferenceImage(theme.reference_image_url || null);
    setCustomHtml((theme as any).custom_html_template || '');
    setHtmlEditorOpen(true); // Open HTML editor directly
  };

  const handleSave = async () => {
    if (!editingTheme?.name) {
      toast.error('Le nom du thème est requis');
      return;
    }

    try {
      const themeData = {
        ...editingTheme,
        custom_html_template: customHtml,
        use_custom_html: !!customHtml,
        reference_image_url: referenceImage || undefined,
      };

      if (isEditing) {
        await updateTheme.mutateAsync({
          id: editingTheme.id!,
          ...themeData,
        } as QuoteTheme);
      } else {
        await createTheme.mutateAsync(themeData as QuoteThemeInput);
      }
      setHtmlEditorOpen(false);
      setEditingTheme(null);
      setReferenceImage(null);
      setCustomHtml('');
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
                Créez et gérez des thèmes visuels pour vos devis
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
                        "cursor-pointer transition-all hover:shadow-md group relative",
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

                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <Code2 className="h-3 w-3" />
                          {theme.heading_font} / {theme.body_font}
                        </div>

                        {/* Quick actions on hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {!theme.is_default && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDefaultTheme.mutate(theme.id);
                              }}
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(theme.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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

      {/* HTML Editor Dialog - Main editing interface */}
      <Dialog open={htmlEditorOpen} onOpenChange={(open) => {
        if (!open) {
          setHtmlEditorOpen(false);
          setEditingTheme(null);
          setCustomHtml('');
        }
      }}>
        <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70">
                  <Code2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    value={editingTheme?.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="h-8 w-48 text-sm font-medium"
                    placeholder="Nom du thème"
                  />
                  <Input
                    value={editingTheme?.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="h-8 w-64 text-sm"
                    placeholder="Description..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  setHtmlEditorOpen(false);
                  setEditingTheme(null);
                }}>
                  Annuler
                </Button>
                <Button size="sm" onClick={handleSave} disabled={createTheme.isPending || updateTheme.isPending}>
                  {(createTheme.isPending || updateTheme.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden">
            <Tabs defaultValue="html" className="flex-1 flex flex-col">
              <div className="px-6 py-2 border-b bg-muted/30">
                <TabsList className="h-8">
                  <TabsTrigger value="html" className="text-xs">
                    <Code2 className="h-3.5 w-3.5 mr-1.5" />
                    Template HTML
                  </TabsTrigger>
                  <TabsTrigger value="styles" className="text-xs">
                    <Palette className="h-3.5 w-3.5 mr-1.5" />
                    Styles
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="text-xs">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Génération IA
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="html" className="flex-1 m-0 overflow-hidden">
                <QuoteHtmlEditor
                  open={true}
                  onOpenChange={() => {}}
                  htmlTemplate={customHtml}
                  onHtmlChange={setCustomHtml}
                  onSave={handleSave}
                  embedded
                />
              </TabsContent>

              <TabsContent value="styles" className="flex-1 m-0 overflow-auto p-6">
                {editingTheme && (
                  <QuoteThemeStylesEditor 
                    theme={editingTheme} 
                    onChange={updateField} 
                  />
                )}
              </TabsContent>

              <TabsContent value="ai" className="flex-1 m-0 overflow-auto p-6">
                <div className="max-w-xl">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        Génération IA
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Uploadez une image de mise en page et l'IA génèrera un thème correspondant.
                      </p>
                    </div>

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
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Uploader une image
                      </Button>
                      <Button
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

                    {referenceImage && (
                      <div className="relative w-64 h-64 rounded-lg overflow-hidden border bg-white">
                        <img
                          src={referenceImage}
                          alt="Reference"
                          className="w-full h-full object-contain"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => setReferenceImage(null)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
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
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
